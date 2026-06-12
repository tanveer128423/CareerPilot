/**
 * AppError.ts
 *
 * Single error type for the whole backend. Every operational failure is thrown
 * as an AppError carrying a stable machine-readable `code`, an HTTP `status`,
 * a `retryable` flag, and optional field-level `details`. The errorHandler
 * middleware maps these directly into the standard error envelope.
 *
 * @module utils/AppError
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "MISSING_FILE"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "BODY_TOO_LARGE"
  | "PARSE_FAILED"
  | "INVALID_ROLE"
  | "AI_TIMEOUT"
  | "AI_BAD_JSON"
  | "AI_UNAVAILABLE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

/** Default HTTP status for each stable error code (API_CONTRACTS.md). */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  MISSING_FILE: 400,
  UNSUPPORTED_FILE_TYPE: 415,
  FILE_TOO_LARGE: 413,
  BODY_TOO_LARGE: 413,
  PARSE_FAILED: 422,
  INVALID_ROLE: 400,
  AI_TIMEOUT: 504,
  AI_BAD_JSON: 502,
  AI_UNAVAILABLE: 502,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

/** Whether each error is retryable by default. */
export const ERROR_RETRYABLE: Record<ErrorCode, boolean> = {
  VALIDATION_ERROR: false,
  MISSING_FILE: false,
  UNSUPPORTED_FILE_TYPE: false,
  FILE_TOO_LARGE: false,
  BODY_TOO_LARGE: false,
  PARSE_FAILED: true,
  INVALID_ROLE: false,
  AI_TIMEOUT: true,
  AI_BAD_JSON: true,
  AI_UNAVAILABLE: true,
  RATE_LIMITED: true,
  INTERNAL_ERROR: true,
};

export interface AppErrorOptions {
  status?: number;
  retryable?: boolean;
  details?: ApiErrorDetail[] | null;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly retryable: boolean;
  public readonly details: ApiErrorDetail[] | null;

  constructor(code: ErrorCode, message: string, opts: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = opts.status ?? ERROR_STATUS[code] ?? 500;
    this.retryable = opts.retryable ?? ERROR_RETRYABLE[code] ?? false;
    this.details = opts.details ?? null;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Serialize into the standard error envelope (safe for clients). */
  toEnvelope() {
    return {
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        details: this.details,
      },
    };
  }
}
