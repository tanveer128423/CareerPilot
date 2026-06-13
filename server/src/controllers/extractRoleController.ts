/**
 * extractRoleController.ts
 *
 * POST /api/extract-role — parse a pasted job description into a structured
 * role the deterministic engine can match against. This is the entry point for
 * the "grade me against a REAL job posting" feature.
 *
 * @module controllers/extractRoleController
 */

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { getRequestApiKey } from "../utils/apiKey.js";
import { extractRoleFromJobPosting } from "../services/jobPostingService.js";

const JOB_TEXT_MIN = 40;
const JOB_TEXT_MAX = 8000;

export async function postExtractRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = (req.body ?? {}) as { jobText?: unknown };
    const jobText = body.jobText;

    if (typeof jobText !== "string" || jobText.trim().length < JOB_TEXT_MIN) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Paste a fuller job description (at least ${JOB_TEXT_MIN} characters).`,
        { status: 400, retryable: false },
      );
    }
    if (jobText.length > JOB_TEXT_MAX) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Job description is too long (max ${JOB_TEXT_MAX} characters).`,
        { status: 400, retryable: false },
      );
    }

    const apiKey = getRequestApiKey(req);
    const result = await extractRoleFromJobPosting(jobText.trim(), apiKey);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export default postExtractRole;
