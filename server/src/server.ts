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

/**
 * Build a tolerant CORS origin check. ALLOWED_ORIGIN may be a comma-separated
 * list; trailing slashes are ignored (browsers send Origin without one). Any
 * *.vercel.app deploy (preview or production) and localhost are also allowed so
 * the demo never breaks when Vercel mints a new preview URL.
 */
function corsOrigin(
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void,
): void {
  // Non-browser callers (curl, health checks, same-origin) send no Origin.
  if (!origin) return cb(null, true);

  const clean = origin.replace(/\/+$/, "");
  const allowList = CONFIG.ALLOWED_ORIGIN.split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  let host = "";
  try {
    host = new URL(clean).hostname;
  } catch {
    return cb(null, false);
  }

  const allowed =
    allowList.includes(clean) ||
    /(^|\.)vercel\.app$/.test(host) ||
    /^localhost$|^127\.0\.0\.1$/.test(host);

  return cb(null, allowed);
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // CORS: configured origin(s) + any *.vercel.app deploy + localhost.
  app.use(
    cors({
      origin: corsOrigin,
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
