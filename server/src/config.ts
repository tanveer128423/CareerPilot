/**
 * config.ts
 *
 * Centralized, immutable configuration for the CareerPilot backend.
 * All limits and timeouts (API_CONTRACTS.md Appendix C) live here so they are
 * defined once and reused everywhere. No secrets are stored here — the Gemini
 * key is read from process.env at call time.
 *
 * @module config
 */

import "dotenv/config";

export type RoleName =
  | "Frontend Developer"
  | "Backend Developer"
  | "Full Stack Developer"
  | "React Developer"
  | "Node.js Developer"
  | "Software Engineer Intern";

export const SUPPORTED_ROLES: readonly RoleName[] = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Software Engineer Intern",
] as const;

export const CONFIG = {
  // Server
  PORT: Number(process.env.PORT) || 8080,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  SERVICE_NAME: "careerpilot-api",
  VERSION: "1.0.0",

  // Upload / body limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5 MB
  MAX_BODY: "1mb",

  // Text extraction
  MIN_TEXT: 50,
  RAW_TEXT_LIMIT: 8000,

  // Gemini
  GEMINI_TIMEOUT_ANALYZE: 20000,
  GEMINI_TIMEOUT_MENTOR: 15000,
  GEMINI_RETRIES: 2,
  // gemini-1.5-flash is retired for newer API keys (returns 404). Use a current
  // model; override with GEMINI_MODEL env if needed.
  GEMINI_MODEL: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",

  // Mentor
  MAX_HISTORY: 20,
  QUESTION_MAX: 500,

  // Roles
  SUPPORTED_ROLES,
} as const;

export type AppConfig = typeof CONFIG;
