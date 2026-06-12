/**
 * parseController.ts
 *
 * POST /api/parse — accepts a multipart resume upload, validates the file and
 * targetRole, extracts raw text in memory, structures it into a StructuredResume
 * (deterministic-first, Gemini fallback only for sparse resumes), validates the
 * result against the schema, and returns it.
 *
 * Response: { targetRole, structuredResume, rawResumeText }.
 * `rawResumeText` is a SIBLING of structuredResume (never nested inside it).
 *
 * @module controllers/parseController
 */

import type { Request, Response, NextFunction } from "express";
import { CONFIG, type RoleName } from "../config.js";
import { AppError } from "../utils/AppError.js";
import { extractText } from "../services/textExtractor.js";
import parseResume from "../services/resumeParser.js";
import { geminiStructurer } from "../services/geminiStructurer.js";
import type { StructuredResume } from "../services/resumeParser.js";
import { validate } from "../utils/validators.js";
import { logger } from "../utils/logger.js";

function isSupportedRole(role: unknown): role is RoleName {
  return typeof role === "string" && (CONFIG.SUPPORTED_ROLES as readonly string[]).includes(role);
}

/** Non-empty string or a neutral placeholder (schema requires minLength 1). */
function nonEmpty(value: string, fallback: string): string {
  const t = (value ?? "").trim();
  return t.length > 0 ? t : fallback;
}

/**
 * Make the deterministic parser output schema-safe WITHOUT fabricating facts.
 * The schema requires non-empty required string fields; the heuristic parser can
 * leave some empty (e.g., a summary when the next line is blank). We fill only
 * those gaps with neutral placeholders — never invented skills or experience.
 */
function toSchemaSafeResume(r: StructuredResume): StructuredResume {
  return {
    skills: r.skills,
    projects: r.projects.map((p) => ({
      name: nonEmpty(p.name, "Project"),
      tech: p.tech,
      summary: nonEmpty(p.summary, "No description provided."),
    })),
    experience: r.experience.map((e) => ({
      title: nonEmpty(e.title, "Role"),
      org: nonEmpty(e.org, "Not specified"),
      duration: nonEmpty(e.duration, "Not specified"),
      summary: nonEmpty(e.summary, "No description provided."),
    })),
    education: r.education.map((ed) => ({
      degree: nonEmpty(ed.degree, "Degree"),
      institution: nonEmpty(ed.institution, "Not specified"),
      year: nonEmpty(ed.year, "N/A"),
    })),
    rawTextLength: r.rawTextLength,
  };
}

export async function postParse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("MISSING_FILE", "No file uploaded. Please attach a PDF or DOCX resume.");
    }

    const targetRole = req.body?.targetRole;
    if (!isSupportedRole(targetRole)) {
      throw new AppError(
        "INVALID_ROLE",
        "Unsupported target role. Please choose a role from the supported list.",
      );
    }

    // Extract text (throws PARSE_FAILED if too little), then cap to the raw limit.
    const fullText = await extractText(req.file.buffer, req.file.mimetype);
    const rawResumeText = fullText.slice(0, CONFIG.RAW_TEXT_LIMIT);

    // Deterministic-first structuring; Gemini fallback only fires for sparse input.
    const parsed = await parseResume(rawResumeText, { structurer: geminiStructurer });
    const structuredResume = toSchemaSafeResume(parsed);

    // Validate the assembled StructuredResume before returning.
    const { valid, errors } = validate("StructuredResume", structuredResume);
    if (!valid) {
      logger.error("StructuredResume failed schema validation", { errors });
      throw new AppError("INTERNAL_ERROR", "We couldn't structure that resume. Please try again.");
    }

    // rawResumeText is a SIBLING of structuredResume.
    res.status(200).json({ targetRole, structuredResume, rawResumeText });
  } catch (err) {
    next(err);
  }
}

export default postParse;
