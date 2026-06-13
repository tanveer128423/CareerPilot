/**
 * apiKey.ts
 *
 * Extracts an optional, per-request Gemini API key supplied by the client via
 * the `X-Gemini-Api-Key` header (the UI lets users bring their own key). The key
 * is used only to construct the Gemini client for that request — never logged,
 * never stored.
 *
 * @module utils/apiKey
 */

import type { Request } from "express";

export function getRequestApiKey(req: Request): string | undefined {
  const raw = req.header("x-gemini-api-key");
  const key = typeof raw === "string" ? raw.trim() : "";
  return key.length > 0 ? key : undefined;
}

export default getRequestApiKey;
