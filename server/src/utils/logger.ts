/**
 * logger.ts
 *
 * Minimal structured logger. Never logs full resume text (lengths/ids only) and
 * always redacts the Gemini API key if it appears anywhere in a logged value.
 *
 * @module utils/logger
 */

const REDACTION = "***REDACTED***";

function redact(value: unknown): unknown {
  const key = process.env.GEMINI_API_KEY;
  if (typeof value === "string") {
    let out = value;
    if (key && key.length > 0) {
      out = out.split(key).join(REDACTION);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Never echo back raw resume / prompt text in logs.
      if (/^(rawResumeText|resumeText|prompt|text|apiKey|GEMINI_API_KEY)$/i.test(k)) {
        obj[k] = typeof v === "string" ? `[len=${v.length}]` : REDACTION;
      } else {
        obj[k] = redact(v);
      }
    }
    return obj;
  }
  return value;
}

function emit(level: string, msg: string, meta?: unknown) {
  const line: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    msg,
  };
  if (meta !== undefined) line.meta = redact(meta);
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
  debug: (msg: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== "production") emit("debug", msg, meta);
  },
};

export default logger;
