/**
 * validateKeyController.ts
 *
 * POST /api/validate-key — verifies that a user-supplied Gemini API key is real
 * and usable BEFORE the rest of the app relies on it. Because the deterministic
 * analysis never calls Gemini, an invalid key would otherwise pass silently and
 * only fail later at the mentor step. This endpoint closes that gap.
 *
 * It performs a token-free check by listing models with the key
 * (GET .../models?key=...): a valid key returns 200, an invalid/forbidden key
 * returns 400/403. No content is generated, so it costs nothing.
 *
 * @module controllers/validateKeyController
 */

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { getRequestApiKey } from "../utils/apiKey.js";
import { logger } from "../utils/logger.js";

const VALIDATE_TIMEOUT_MS = 10000;
const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function postValidateKey(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Accept the key from the standard header, or a JSON body fallback.
    const headerKey = getRequestApiKey(req);
    const bodyKey =
      typeof (req.body as { apiKey?: unknown })?.apiKey === "string"
        ? ((req.body as { apiKey: string }).apiKey || "").trim()
        : "";
    const apiKey = headerKey || bodyKey;

    if (!apiKey) {
      throw new AppError("VALIDATION_ERROR", "No API key was provided.", {
        status: 400,
        retryable: false,
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VALIDATE_TIMEOUT_MS);
    if (typeof timer.unref === "function") timer.unref();

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(
        `${GEMINI_MODELS_URL}?key=${encodeURIComponent(apiKey)}`,
        { method: "GET", signal: controller.signal },
      );
    } catch (err) {
      // Network/timeout: we cannot confirm the key — treat as transient.
      logger.warn("validate-key network error", { error: String((err as Error)?.message || err) });
      throw new AppError("AI_TIMEOUT", "Couldn't reach the AI service to verify your key. Please try again.", {
        retryable: true,
      });
    } finally {
      clearTimeout(timer);
    }

    if (upstream.ok) {
      res.status(200).json({ valid: true });
      return;
    }

    if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) {
      // The key itself is bad / not authorized.
      res.status(200).json({
        valid: false,
        reason: "That API key was rejected by Google. Please check it and try again.",
      });
      return;
    }

    if (upstream.status === 429) {
      throw new AppError("RATE_LIMITED", "The AI service is rate limited. Please try again shortly.", {
        retryable: true,
      });
    }

    // Anything else (5xx): we couldn't verify right now.
    logger.warn("validate-key unexpected upstream status", { status: upstream.status });
    throw new AppError("AI_UNAVAILABLE", "The AI service is temporarily unavailable. Please try again.", {
      retryable: true,
    });
  } catch (err) {
    next(err);
  }
}

export default postValidateKey;
