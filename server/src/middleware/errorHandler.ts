/**
 * errorHandler.ts
 *
 * Terminal Express error middleware (4-arg signature). Maps AppError to its
 * status + standard envelope; maps multer and unknown errors to safe codes.
 * Logs full detail server-side and sends only the user-safe envelope. Always
 * sets X-Request-Id on the response.
 *
 * @module middleware/errorHandler
 */

import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { AppError } from "../utils/AppError.js";
import { CONFIG } from "../config.js";
import { logger } from "../utils/logger.js";

/** Translate framework/library errors into AppErrors where possible. */
function normalize(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const e = err as { code?: string; type?: string; message?: string };

  // Multer file-size limit.
  if (e?.code === "LIMIT_FILE_SIZE") {
    return new AppError(
      "FILE_TOO_LARGE",
      `File exceeds the ${Math.round(CONFIG.MAX_FILE_SIZE / (1024 * 1024))} MB limit.`,
    );
  }

  // Other multer limits → treated as validation issues.
  if (typeof e?.code === "string" && e.code.startsWith("LIMIT_")) {
    return new AppError("VALIDATION_ERROR", "The uploaded file could not be accepted.");
  }

  // express.json body-size limit.
  if (e?.type === "entity.too.large") {
    return new AppError("BODY_TOO_LARGE", "Request body exceeds the 1 MB limit.");
  }

  // Malformed JSON body.
  if (e?.type === "entity.parse.failed") {
    return new AppError("VALIDATION_ERROR", "Request body is not valid JSON.");
  }

  return new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("X-Request-Id", requestId);

  const appError = normalize(err);

  // Full detail server-side only.
  logger.error("Request failed", {
    requestId,
    method: req.method,
    path: req.path,
    code: appError.code,
    status: appError.status,
    message: appError.message,
    stack: appError instanceof AppError && err instanceof AppError ? undefined : (err as Error)?.stack,
  });

  if (res.headersSent) return;

  res.status(appError.status).json(appError.toEnvelope());
}

export default errorHandler;
