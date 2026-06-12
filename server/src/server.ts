/**
 * server.ts
 *
 * Application entrypoint. Builds a stateless Express app: CORS locked to
 * ALLOWED_ORIGIN, JSON body limited to 1 MB, an X-Request-Id stamped on every
 * response, the API router mounted at /api, a 404 handler, and the terminal
 * errorHandler mounted LAST.
 *
 * @module server
 */

import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { CONFIG } from "./config.js";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";
import { logger } from "./utils/logger.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // CORS locked to the configured client origin; expose the trace header.
  app.use(
    cors({
      origin: CONFIG.ALLOWED_ORIGIN,
      exposedHeaders: ["X-Request-Id"],
    }),
  );

  // Attach a request id to every response for tracing.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("X-Request-Id", requestId);
    next();
  });

  // JSON body parser with a hard 1 MB limit.
  app.use(express.json({ limit: CONFIG.MAX_BODY }));

  // API routes.
  app.use("/api", router);

  // Unknown route → 404 via the standard envelope.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError("VALIDATION_ERROR", `Route not found: ${req.method} ${req.path}`, { status: 404 }));
  });

  // Terminal error handler — must be mounted last.
  app.use(errorHandler);

  return app;
}

const app = createApp();

// Only start listening when run directly (not when imported by tests).
const isDirectRun =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  app.listen(CONFIG.PORT, () => {
    logger.info("CareerPilot API started", {
      port: CONFIG.PORT,
      origin: CONFIG.ALLOWED_ORIGIN,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      version: CONFIG.VERSION,
    });
  });
}

export default app;
