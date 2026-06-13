/**
 * mentorController.ts
 *
 * POST /api/mentor — stateless, NON-STREAMING grounded mentor chat. Validates the
 * question, grounding, and optional history, then delegates to mentorService
 * (which reconstructs the analysis internally). The server stores no chat state.
 *
 * @module controllers/mentorController
 */

import type { Request, Response, NextFunction } from "express";
import { CONFIG, type RoleName } from "../config.js";
import { AppError, type ApiErrorDetail } from "../utils/AppError.js";
import { answerMentor, type MentorMessage } from "../services/mentorService.js";
import { getRequestApiKey } from "../utils/apiKey.js";

function isSupportedRole(role: unknown): role is RoleName {
  return typeof role === "string" && (CONFIG.SUPPORTED_ROLES as readonly string[]).includes(role);
}

function validationError(field: string, issue: string): AppError {
  const details: ApiErrorDetail[] = [{ field, issue }];
  return new AppError("VALIDATION_ERROR", "Request validation failed.", {
    status: 400,
    retryable: false,
    details,
  });
}

function isValidHistory(h: unknown): h is MentorMessage[] {
  if (h === undefined) return true;
  if (!Array.isArray(h)) return false;
  return h.every(
    (m) =>
      m &&
      typeof m === "object" &&
      (m.role === "user" || m.role === "mentor") &&
      typeof m.text === "string" &&
      m.text.length > 0,
  );
}

export async function postMentor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = (req.body ?? {}) as {
      question?: unknown;
      history?: unknown;
      grounding?: {
        targetRole?: unknown;
        structuredResume?: { skills?: unknown };
        matchObject?: { role?: unknown; missing?: unknown; requiredSkills?: unknown };
        rawResumeText?: unknown;
        fromJobPosting?: unknown;
      };
    };

    // 1. question: non-empty string ≤ QUESTION_MAX.
    if (typeof body.question !== "string" || body.question.trim().length === 0) {
      throw validationError("question", "must be a non-empty string");
    }
    if (body.question.length > CONFIG.QUESTION_MAX) {
      throw validationError("question", `must be ≤ ${CONFIG.QUESTION_MAX} characters`);
    }

    // 2. grounding present and an object.
    const g = body.grounding;
    if (typeof g !== "object" || g === null || Array.isArray(g)) {
      throw validationError("grounding", "must be an object");
    }

    // 3. The role must be either a supported role OR a valid custom role
    //    (parsed from a job posting) — detected by a non-empty requiredSkills
    //    list on the grounded matchObject.
    const roleName = g.targetRole ?? g.matchObject?.role;
    const hasCustomRole =
      g.fromJobPosting === true &&
      Array.isArray(g.matchObject?.requiredSkills) &&
      (g.matchObject?.requiredSkills as unknown[]).length > 0;
    if (!isSupportedRole(roleName) && !hasCustomRole) {
      throw new AppError("INVALID_ROLE", "Unsupported target role. Please choose a supported role.");
    }

    // 4. structuredResume.skills must be a non-empty array.
    const skills = g.structuredResume?.skills;
    if (!Array.isArray(skills) || skills.length === 0) {
      throw validationError("grounding.structuredResume.skills", "must be a non-empty array");
    }

    // 5. matchObject.missing must be an array.
    if (!Array.isArray(g.matchObject?.missing)) {
      throw validationError("grounding.matchObject.missing", "must be an array");
    }

    // 6. history (if present) must be an array of { role, text }.
    if (!isValidHistory(body.history)) {
      throw validationError("history", "must be an array of { role: 'user'|'mentor', text }");
    }

    const result = await answerMentor({
      question: body.question,
      history: (body.history as MentorMessage[]) ?? [],
      grounding: g as never,
      apiKey: getRequestApiKey(req),
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export default postMentor;
