/**
 * geminiClient.ts
 *
 * Thin wrapper over @google/generative-ai. Enforces a hard timeout via
 * Promise.race, retries transient (5xx / timeout / rate-limit) failures with
 * exponential backoff, and surfaces failures as typed AppErrors. JSON mode sets
 * responseMimeType to application/json so the model returns parseable JSON.
 *
 * @module services/geminiClient
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "../config.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export interface CallGeminiArgs {
  system?: string;
  prompt: string;
  jsonMode?: boolean;
  temperature?: number;
  timeoutMs: number;
  retries?: number;
  /** Optional per-request API key (e.g., provided by the user via the UI). */
  apiKey?: string;
}

class TimeoutError extends Error {
  constructor() {
    super("Gemini request timed out");
    this.name = "TimeoutError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(provided?: string): string {
  // Prefer a per-request key (from the UI), fall back to the server env key.
  const key = (provided && provided.trim()) || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") {
    throw new AppError("AI_UNAVAILABLE", "AI service is not configured. Please provide a Gemini API key.", {
      retryable: false,
    });
  }
  return key;
}

/** Heuristic: is this error worth retrying? */
function isRetryable(err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  const msg = String((err as Error)?.message || "").toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("500") ||
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable")
  );
}

/**
 * Call Gemini and return the raw text response.
 * Throws AppError("AI_TIMEOUT") on timeout, AppError("AI_UNAVAILABLE") otherwise.
 */
export async function callGemini(args: CallGeminiArgs): Promise<string> {
  const {
    system,
    prompt,
    jsonMode = true,
    temperature = 0.3,
    timeoutMs,
    retries = CONFIG.GEMINI_RETRIES,
  } = args;

  const apiKey = getApiKey(args.apiKey);
  const client = new GoogleGenerativeAI(apiKey);

  const model = client.getGenerativeModel({
    model: CONFIG.GEMINI_MODEL,
    ...(system ? { systemInstruction: system } : {}),
    generationConfig: {
      temperature,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  });

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const generation = model.generateContent(prompt);

      const timeout = new Promise<never>((_, reject) => {
        const t = setTimeout(() => reject(new TimeoutError()), timeoutMs);
        // Prevent the timer from keeping the process alive.
        if (typeof t.unref === "function") t.unref();
      });

      const result = await Promise.race([generation, timeout]);
      const text = result.response.text();

      if (!text || text.trim() === "") {
        throw new Error("Empty response from Gemini");
      }
      return text;
    } catch (err) {
      lastErr = err;
      logger.warn("Gemini call failed", {
        attempt: attempt + 1,
        maxAttempts: retries + 1,
        error: String((err as Error)?.message || err),
      });

      if (attempt < retries && isRetryable(err)) {
        const backoff = 300 * Math.pow(2, attempt); // 300ms, 600ms, ...
        await sleep(backoff);
        continue;
      }
      break;
    }
  }

  if (lastErr instanceof TimeoutError) {
    throw new AppError("AI_TIMEOUT", "The AI service took too long to respond. Please try again.", {
      retryable: true,
    });
  }

  const msg = String((lastErr as Error)?.message || "").toLowerCase();
  if (msg.includes("429") || msg.includes("rate")) {
    throw new AppError("RATE_LIMITED", "The AI service is rate limited. Please try again shortly.", {
      retryable: true,
    });
  }

  throw new AppError("AI_UNAVAILABLE", "The AI service is temporarily unavailable. Please try again.", {
    retryable: true,
  });
}

export default callGemini;
