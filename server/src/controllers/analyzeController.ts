/**
 * analyzeController.ts
 *
 * POST /api/analyze — the deterministic analysis endpoint.
 *
 * Phase 4 (this stage): validate the request, then compute the deterministic
 * `matchObject` via matchService (resume skills ∩ role.required) and return it.
 * The match is computed in CODE, BEFORE any AI involvement — this is the
 * anti-hallucination backbone. Later phases add resumeHealth, readiness, roadmap.
 *
 * @module controllers/analyzeController
 */

import type { Request, Response, NextFunction } from "express";
import { CONFIG, type RoleName } from "../config.js";
import { AppError, type ApiErrorDetail } from "../utils/AppError.js";
import matchService, { UnknownRoleError, type RoleDefinition } from "../services/matchService.js";
import analyzeResumeHealth, { toSchemaHealth } from "../services/analysisService.js";
import computeReadiness from "../services/readinessService.js";
import generateRoadmap from "../services/roadmapService.js";
import type { StructuredResume } from "../services/resumeParser.js";
import { validate } from "../utils/validators.js";
import { logger } from "../utils/logger.js";
import rolesData from "../data/roles.json" with { type: "json" };

const ROLES = (rolesData as { roles: RoleDefinition[] }).roles;

/** Build a full StructuredResume from the (partially validated) request body. */
function normalizeResume(sr: Record<string, unknown>, rawLen: number): StructuredResume {
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    skills: sr.skills as string[],
    projects: arr(sr.projects),
    experience: arr(sr.experience),
    education: arr(sr.education),
    rawTextLength: rawLen,
  };
}

function isSupportedRole(role: unknown): role is RoleName {
  return typeof role === "string" && (CONFIG.SUPPORTED_ROLES as readonly string[]).includes(role);
}

function isNonEmptyStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === "string" && s.trim().length > 0);
}

function validationError(details: ApiErrorDetail[]): AppError {
  return new AppError("VALIDATION_ERROR", "Request validation failed.", {
    status: 400,
    retryable: false,
    details,
  });
}

export async function postAnalyze(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = (req.body ?? {}) as {
      targetRole?: unknown;
      structuredResume?: { skills?: unknown };
      rawResumeText?: unknown;
    };

    // 1. targetRole must be a supported role.
    if (!isSupportedRole(body.targetRole)) {
      throw new AppError(
        "INVALID_ROLE",
        "Unsupported target role. Please choose a role from the supported list.",
      );
    }

    // 2. structuredResume must be an object.
    const sr = body.structuredResume;
    if (typeof sr !== "object" || sr === null || Array.isArray(sr)) {
      throw validationError([
        { field: "structuredResume", issue: "must be an object" },
      ]);
    }

    // 3. structuredResume.skills must be a non-empty array of non-empty strings.
    if (!isNonEmptyStringArray(sr.skills)) {
      throw validationError([
        { field: "structuredResume.skills", issue: "must be a non-empty array of strings" },
      ]);
    }

    // 4. rawResumeText (if present) must be a string ≤ 8000 chars.
    if (body.rawResumeText !== undefined) {
      if (typeof body.rawResumeText !== "string") {
        throw validationError([{ field: "rawResumeText", issue: "must be a string" }]);
      }
      if (body.rawResumeText.length > CONFIG.RAW_TEXT_LIMIT) {
        throw validationError([
          { field: "rawResumeText", issue: `must be ≤ ${CONFIG.RAW_TEXT_LIMIT} characters` },
        ]);
      }
    }

    // Deterministic skill match — computed in code, before any AI call.
    let matchObject;
    try {
      matchObject = matchService.generateMatchObject(body.targetRole, sr.skills);
    } catch (e) {
      if (e instanceof UnknownRoleError) {
        throw new AppError(
          "INVALID_ROLE",
          "Unsupported target role. Please choose a role from the supported list.",
        );
      }
      throw e;
    }

    // --- Deterministic Resume Health + Career Readiness (no AI) ---
    const rawResumeText = typeof body.rawResumeText === "string" ? body.rawResumeText : "";
    const structuredResume = normalizeResume(sr as Record<string, unknown>, rawResumeText.length);
    const selectedRole = ROLES.find((r) => r.name === body.targetRole)!;

    const healthReport = analyzeResumeHealth({
      structuredResume: structuredResume as never,
      matchObject,
      rawResumeText,
    });
    const resumeHealth = toSchemaHealth(healthReport); // API shape { overall, dimensions[] }

    const readiness = computeReadiness({
      structuredResume,
      matchObject,
      resumeHealthReport: healthReport,
      selectedRole,
    });

    // --- Deterministic gap-driven roadmap (no AI) ---
    const roadmap = generateRoadmap({ matchObject });

    // Assemble the full AnalysisResult (SCHEMAS.md #15) and validate before returning.
    const result = { targetRole: body.targetRole, matchObject, resumeHealth, readiness, roadmap };
    const { valid, errors } = validate("AnalysisResult", result);
    if (!valid) {
      logger.error("AnalysisResult failed schema validation", { errors });
      throw new AppError("INTERNAL_ERROR", "Analysis produced an invalid shape.", {
        status: 500,
        retryable: true,
      });
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export default postAnalyze;
