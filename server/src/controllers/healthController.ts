/**
 * healthController.ts
 *
 * GET /api/health — liveness/readiness probe. Also used to warm the dyno before
 * a demo. Reports whether the Gemini key is configured (without exposing it).
 *
 * @module controllers/healthController
 */

import type { Request, Response } from "express";
import { CONFIG } from "../config.js";

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    ok: true,
    service: CONFIG.SERVICE_NAME,
    version: CONFIG.VERSION,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}

export default getHealth;
