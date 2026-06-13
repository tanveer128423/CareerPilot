/**
 * analysisService.ts
 *
 * Deterministic Resume Health Report generator for CareerPilot.
 *
 * Scores a resume across five dimensions WITHOUT any LLM:
 *   - Formatting Quality   (from raw resume text)
 *   - Impact Metrics       (from raw resume text)
 *   - Skills Coverage      (from the deterministic MatchObject)
 *   - Keyword Coverage     (from raw text vs role keywords)
 *   - Project Quality      (from structured projects + MatchObject)
 *
 * Every score is evidence-based: each dimension's `reason` cites concrete counts
 * drawn from the actual resume, and `fixTip` gives a specific, actionable fix.
 * No score is fabricated. When raw text is unavailable, the two text-dependent
 * dimensions fall back to a neutral 60 with a stated limitation (never a guess).
 *
 * @module services/analysisService
 */

import rolesData from "../data/roles.json";
import type { MatchObject, RoleDefinition } from "./matchService";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** Minimal StructuredResume slice this service depends on. */
export interface AnalysisProject {
  name: string;
  tech: string[];
  summary: string;
}
export interface AnalysisResumeInput {
  skills: string[];
  projects: AnalysisProject[];
  experience: Array<{ title: string; org: string; duration: string; summary: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
}

/** A single scored dimension. */
export interface DimensionScore {
  /** Integer 0–100. */
  score: number;
  /** Evidence-based explanation of WHY this score was given. */
  reason: string;
  /** Specific, actionable fix to raise the score. */
  fixTip: string;
}

/** The full Resume Health Report. */
export interface ResumeHealthReport {
  formattingQuality: DimensionScore;
  impactMetrics: DimensionScore;
  skillsCoverage: DimensionScore;
  keywordCoverage: DimensionScore;
  projectQuality: DimensionScore;
  /** Rounded average of the five dimension scores (0–100). */
  overallScore: number;
}

/** Inputs to the analysis. */
export interface AnalyzeHealthInput {
  structuredResume: AnalysisResumeInput;
  matchObject: MatchObject;
  rawResumeText?: string;
  /**
   * Keyword set to score against. For custom roles parsed from a job posting
   * (not in roles.json), pass the posting's keywords here. When omitted, the
   * role's keywords are looked up from roles.json by name.
   */
  roleKeywords?: string[];
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

/** Neutral score used when raw text is unavailable for text-based dimensions. */
const NEUTRAL_NO_TEXT = 60;

const ROLES: RoleDefinition[] = (rolesData as { roles: RoleDefinition[] }).roles;

/* -------------------------------------------------------------------------- */
/* Small utilities                                                             */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, lo = 0, hi = 100): number =>
  Math.max(lo, Math.min(hi, Math.round(n)));

const list = (arr: string[], max = 3): string =>
  arr.slice(0, max).join(", ") + (arr.length > max ? ", …" : "");

/** Split raw text into non-empty, trimmed lines. */
function toLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Heuristic: does a line read like a bullet / achievement statement? */
function isBulletLine(line: string): boolean {
  if (/^[-*•·–▪◦‣]/.test(line)) return true; // explicit bullet marker
  // Or an action-verb-led sentence of reasonable length.
  return (
    line.length >= 25 &&
    /^[A-Z(]/.test(line) &&
    /\b(built|created|developed|designed|implemented|led|managed|improved|reduced|increased|automated|launched|optimized|delivered|maintained|integrated|wrote|deployed|tested)\b/i.test(
      line
    )
  );
}

/** Heuristic: does a line contain a quantified result? */
function hasMetric(line: string): boolean {
  return (
    /\b\d+(\.\d+)?\s?%/.test(line) || // 40%
    /[$₹€£]\s?\d/.test(line) || // $1,000
    /\b\d+(\.\d+)?\s?(k|m|x|\+)\b/i.test(line) || // 10k, 5x, 100+
    /\b\d{2,}\b/.test(line) || // any 2+ digit count (users, requests…)
    /\b\d+\s*(users?|requests?|projects?|hours?|days?|weeks?|tests?|apis?|endpoints?|records?)\b/i.test(
      line
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Dimension 1 — Formatting Quality (raw text)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Score structure, section presence, contact info, length, and consistency.
 * Points model (max 100): sections 40, contact 15, length 20, bullets 15,
 * date consistency 10.
 */
export function scoreFormatting(raw: string): DimensionScore {
  if (!raw || raw.trim().length === 0) {
    return {
      score: NEUTRAL_NO_TEXT,
      reason: "Raw resume text was unavailable, so structural review was limited.",
      fixTip: "Re-upload a text-based PDF/DOCX so formatting can be assessed precisely.",
    };
  }

  const text = raw;
  const lower = text.toLowerCase();
  const lines = toLines(text);
  const wordCount = (text.match(/\b\w+\b/g) || []).length;

  const sectionChecks: Array<{ label: string; re: RegExp }> = [
    { label: "Skills", re: /\bskills?\b|technologies|tech stack/i },
    { label: "Experience", re: /\bexperience\b|employment|internship/i },
    { label: "Education", re: /\beducation\b|academics/i },
    { label: "Projects", re: /\bprojects?\b|portfolio/i },
  ];
  const found = sectionChecks.filter((s) => s.re.test(lower));
  const missing = sectionChecks.filter((s) => !s.re.test(lower)).map((s) => s.label);
  const sectionScore = found.length * 10; // 0–40

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  const contactScore = (hasEmail ? 10 : 0) + (hasPhone ? 5 : 0); // 0–15

  let lengthScore: number; // 0–20
  if (wordCount >= 150 && wordCount <= 900) lengthScore = 20;
  else if (wordCount < 150) lengthScore = Math.round((wordCount / 150) * 20);
  else lengthScore = Math.max(8, 20 - Math.round((wordCount - 900) / 100));

  const bulletCount = lines.filter(isBulletLine).length;
  const bulletScore = clamp(Math.min(15, bulletCount * 3), 0, 15); // 0–15

  const years = text.match(/\b(19|20)\d{2}\b/g) || [];
  const dateConsistency = years.length >= 1 ? 10 : 4; // 0–10

  const score = clamp(
    sectionScore + contactScore + lengthScore + bulletScore + dateConsistency
  );

  const reasonParts: string[] = [];
  reasonParts.push(
    `Found ${found.length}/4 core sections (${found.map((f) => f.label).join(", ") || "none"}).`
  );
  reasonParts.push(
    hasEmail ? "Contact email present." : "No contact email detected."
  );
  reasonParts.push(`Resume length ~${wordCount} words.`);

  let fixTip: string;
  if (missing.length) fixTip = `Add a clear ${missing[0]} section header.`;
  else if (!hasEmail) fixTip = "Add a professional contact email near the top.";
  else if (wordCount < 150)
    fixTip = "Expand bullets with specifics — the resume is quite short.";
  else if (bulletCount < 4)
    fixTip = "Use consistent bullet points to describe experience and projects.";
  else fixTip = "Standardize date formats (e.g., MMM YYYY) for visual consistency.";

  return { score, reason: reasonParts.join(" "), fixTip };
}

/* -------------------------------------------------------------------------- */
/* Dimension 2 — Impact Metrics (raw text)                                     */
/* -------------------------------------------------------------------------- */

/**
 * Score the share of bullet/achievement lines that include a quantified result.
 */
export function scoreImpactMetrics(raw: string): DimensionScore {
  if (!raw || raw.trim().length === 0) {
    return {
      score: NEUTRAL_NO_TEXT,
      reason: "Raw resume text was unavailable, so impact metrics could not be measured.",
      fixTip: "Re-upload a text-based resume; then quantify achievements with numbers.",
    };
  }

  const lines = toLines(raw);
  const bullets = lines.filter(isBulletLine);
  const metricBullets = bullets.filter(hasMetric);

  if (bullets.length === 0) {
    return {
      score: 35,
      reason:
        "No clear achievement bullet points were detected, so impact is hard to gauge.",
      fixTip:
        "Rewrite experience and projects as action-led bullets, each with a measurable result.",
    };
  }

  const ratio = metricBullets.length / bullets.length;
  const score = clamp(ratio * 100);

  return {
    score,
    reason: `${metricBullets.length} of ${bullets.length} achievement bullets include a quantified result (numbers, %, scale).`,
    fixTip:
      metricBullets.length >= bullets.length
        ? "Strong — keep quantifying outcomes in every new bullet."
        : `Add metrics to ${Math.min(
            bullets.length - metricBullets.length,
            3
          )} more bullet(s), e.g. "reduced load time by 40%" or "served 1k+ users".`,
  };
}

/* -------------------------------------------------------------------------- */
/* Dimension 3 — Skills Coverage (MatchObject)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Score required-skill coverage (weighted 85) plus a nice-to-have bonus (15).
 */
export function scoreSkillsCoverage(match: MatchObject): DimensionScore {
  const required = match.requiredSkills.length;
  const have = match.have.length;
  const coverage = required > 0 ? have / required : 0;
  const niceBonus = Math.min(15, match.matchedNiceToHave.length * 5);
  const score = clamp(coverage * 85 + niceBonus);

  const reason =
    required > 0
      ? `You have ${have} of ${required} required skills for ${match.role}` +
        (match.matchedNiceToHave.length
          ? `, plus ${match.matchedNiceToHave.length} nice-to-have (${list(
              match.matchedNiceToHave
            )}).`
          : ".")
      : "No required skills are defined for this role.";

  const fixTip = match.missing.length
    ? `Learn and list these missing required skills: ${list(match.missing)}.`
    : "All required skills present — add advanced/nice-to-have skills to stand out.";

  return { score, reason, fixTip };
}

/* -------------------------------------------------------------------------- */
/* Dimension 4 — Keyword Coverage (raw text vs role keywords)                  */
/* -------------------------------------------------------------------------- */

/** Find the role's keyword list from roles.json by role name. */
function keywordsForRole(roleName: string): string[] {
  return ROLES.find((r) => r.name === roleName)?.keywords ?? [];
}

/**
 * Score how many of the role's expected keywords appear in the resume text.
 */
export function scoreKeywordCoverage(
  raw: string,
  match: MatchObject,
  keywordsOverride?: string[]
): DimensionScore {
  const keywords =
    keywordsOverride && keywordsOverride.length > 0
      ? keywordsOverride
      : keywordsForRole(match.role);

  if (keywords.length === 0) {
    return {
      score: NEUTRAL_NO_TEXT,
      reason: `No keyword set is defined for ${match.role}.`,
      fixTip: "Mirror the language used in target job descriptions.",
    };
  }
  if (!raw || raw.trim().length === 0) {
    return {
      score: NEUTRAL_NO_TEXT,
      reason: "Raw resume text was unavailable, so keyword coverage was limited.",
      fixTip: "Re-upload a text-based resume to evaluate role keyword usage.",
    };
  }

  const lower = raw.toLowerCase();
  const present = keywords.filter((k) =>
    new RegExp(`\\b${escapeRegExp(k.toLowerCase())}\\b`).test(lower)
  );
  const missing = keywords.filter((k) => !present.includes(k));
  const score = clamp((present.length / keywords.length) * 100);

  return {
    score,
    reason: `Resume contains ${present.length} of ${keywords.length} role keywords for ${match.role}${
      present.length ? ` (${list(present)})` : ""
    }.`,
    fixTip: missing.length
      ? `Weave these role keywords into real bullets where true: ${list(missing)}.`
      : "Excellent keyword alignment with the target role.",
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------------------------------------------------------------- */
/* Dimension 5 — Project Quality (projects + MatchObject)                      */
/* -------------------------------------------------------------------------- */

/**
 * Score number of projects, tech depth, role relevance, and summary quality.
 */
export function scoreProjectQuality(
  projects: AnalysisProject[],
  match: MatchObject
): DimensionScore {
  if (!projects || projects.length === 0) {
    return {
      score: 30,
      reason: "No projects were detected on the resume.",
      fixTip: match.missing.length
        ? `Build one project using a missing skill (e.g., ${match.missing[0]}) and add it.`
        : "Add 1–2 portfolio projects that demonstrate your strongest skills.",
    };
  }

  const requiredSet = new Set(match.requiredSkills.map((s) => s.toLowerCase()));
  const countScore = Math.min(25, projects.length * 12); // up to 25 (≥2 projects)

  const withTech = projects.filter((p) => p.tech && p.tech.length > 0).length;
  const techScore = Math.round((withTech / projects.length) * 25); // up to 25

  const relevantProjects = projects.filter((p) =>
    (p.tech || []).some((t) => requiredSet.has(t.toLowerCase()))
  );
  const relevanceScore = Math.round(
    (relevantProjects.length / projects.length) * 30
  ); // up to 30

  const withSummary = projects.filter(
    (p) => (p.summary || "").trim().length >= 30
  ).length;
  const summaryScore = Math.round((withSummary / projects.length) * 20); // up to 20

  const score = clamp(countScore + techScore + relevanceScore + summaryScore);

  const reason =
    `${projects.length} project(s) detected; ` +
    `${relevantProjects.length} use a required ${match.role} skill; ` +
    `${withTech} list a tech stack.`;

  let fixTip: string;
  if (relevantProjects.length === 0)
    fixTip = match.missing.length
      ? `Add a project using ${match.missing[0]} to prove role-relevant ability.`
      : "Tie a project explicitly to your target role's core skills.";
  else if (withSummary < projects.length)
    fixTip = "Add a one-line outcome summary (with a metric) to each project.";
  else if (projects.length < 2)
    fixTip = "Add a second substantial project to show range.";
  else fixTip = "Strong projects — highlight measurable outcomes in each summary.";

  return { score, reason, fixTip };
}

/* -------------------------------------------------------------------------- */
/* Public: analyzeResumeHealth                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Produce a complete, evidence-based Resume Health Report.
 *
 * @param input - StructuredResume slice, deterministic MatchObject, raw text.
 * @returns The five scored dimensions plus the overall score.
 *
 * @example
 * const report = analyzeResumeHealth({ structuredResume, matchObject, rawResumeText });
 * // report.overallScore -> 64
 */
export function analyzeResumeHealth(
  input: AnalyzeHealthInput
): ResumeHealthReport {
  const raw = input.rawResumeText ?? "";
  const { structuredResume: resume, matchObject: match } = input;

  const formattingQuality = scoreFormatting(raw);
  const impactMetrics = scoreImpactMetrics(raw);
  const skillsCoverage = scoreSkillsCoverage(match);
  const keywordCoverage = scoreKeywordCoverage(raw, match, input.roleKeywords);
  const projectQuality = scoreProjectQuality(resume.projects ?? [], match);

  const overallScore = clamp(
    (formattingQuality.score +
      impactMetrics.score +
      skillsCoverage.score +
      keywordCoverage.score +
      projectQuality.score) /
      5
  );

  return {
    formattingQuality,
    impactMetrics,
    skillsCoverage,
    keywordCoverage,
    projectQuality,
    overallScore,
  };
}

/* -------------------------------------------------------------------------- */
/* Adapter to SCHEMAS.md ResumeHealthReport shape (dimensions[] form)          */
/* -------------------------------------------------------------------------- */

/** SCHEMAS.md-compatible dimension entry. */
export interface SchemaHealthDimension {
  key: "formatting" | "impactMetrics" | "skillsCoverage" | "keywordCoverage" | "projectQuality";
  label: string;
  score: number;
  reason: string;
  tip: string;
}
export interface SchemaResumeHealth {
  overall: number;
  dimensions: SchemaHealthDimension[];
}

/**
 * Convert the internal report to the API/schema `resumeHealth` shape
 * (`{ overall, dimensions:[{key,label,score,reason,tip}] }`).
 */
export function toSchemaHealth(report: ResumeHealthReport): SchemaResumeHealth {
  const map: Array<[SchemaHealthDimension["key"], string, DimensionScore]> = [
    ["formatting", "Formatting Quality", report.formattingQuality],
    ["impactMetrics", "Impact Metrics", report.impactMetrics],
    ["skillsCoverage", "Skills Coverage", report.skillsCoverage],
    ["keywordCoverage", "Keyword Coverage", report.keywordCoverage],
    ["projectQuality", "Project Quality", report.projectQuality],
  ];
  return {
    overall: report.overallScore,
    dimensions: map.map(([key, label, d]) => ({
      key,
      label,
      score: d.score,
      reason: d.reason,
      tip: d.fixTip,
    })),
  };
}

export default analyzeResumeHealth;

/* -------------------------------------------------------------------------- */
/* Example usage                                                               */
/* -------------------------------------------------------------------------- */

/*
import analyzeResumeHealth, { toSchemaHealth } from "./services/analysisService";
import matchService from "./services/matchService";

const matchObject = matchService.generateMatchObject("Backend Developer", structuredResume.skills);
const report = analyzeResumeHealth({ structuredResume, matchObject, rawResumeText });
const apiShape = toSchemaHealth(report); // ready for /api/analyze response
*/
