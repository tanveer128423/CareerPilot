/**
 * readinessService.ts
 *
 * Deterministic Career Readiness Score (0–100) for a selected role.
 *
 * Implements the FIX_PACK scoring model. Skill coverage is counted EXACTLY ONCE
 * (in Technical Skills). Role Alignment uses orthogonal signals (keywords,
 * nice-to-have skills, project relevance) so nothing is double-counted.
 *
 * Weighting:
 *   Technical Skills  35%
 *   Projects          25%
 *   Experience        20%
 *   Resume Health     10%
 *   Role Alignment    10%
 *
 * No AI. No network. No randomness. Every strength/weakness/next-action is
 * evidence-based and references concrete resume facts (a named skill, project,
 * or its absence). Generic advice is never produced.
 *
 * @module services/readinessService
 */

import type { MatchObject, RoleDefinition } from "./matchService";
import type { ResumeHealthReport } from "./analysisService";
import type { StructuredResume } from "./resumeParser";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** Inputs required to compute readiness. */
export interface ReadinessInput {
  structuredResume: StructuredResume;
  matchObject: MatchObject;
  resumeHealthReport: ResumeHealthReport;
  selectedRole: RoleDefinition;
}

/** The Career Readiness result. */
export interface CareerReadiness {
  /** Overall score 0–100 (sum of weighted breakdown). */
  score: number;
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  /** Weighted point contributions; sums to `score`. */
  scoreBreakdown: {
    technicalSkills: number; // out of 35
    projects: number; // out of 25
    experience: number; // out of 20
    resumeHealth: number; // out of 10
    roleAlignment: number; // out of 10
  };
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

/** Component weights (percent of the 0–100 total). Must sum to 100. */
export const WEIGHTS = {
  technicalSkills: 35,
  projects: 25,
  experience: 20,
  resumeHealth: 10,
  roleAlignment: 10,
} as const;

/* -------------------------------------------------------------------------- */
/* Math helpers                                                                */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, lo = 0, hi = 100): number =>
  Math.max(lo, Math.min(hi, Math.round(n)));

/** Safe ratio that never divides by zero. */
const ratio = (num: number, den: number): number => (den > 0 ? num / den : 0);

/** Format a short, truncated list for evidence strings. */
const list = (arr: string[], max = 3): string =>
  arr.slice(0, max).join(", ") + (arr.length > max ? ", …" : "");

/* -------------------------------------------------------------------------- */
/* Component sub-scores (each returns 0–100)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Technical Skills (the ONLY skill-coverage term).
 * Pure required-skill coverage: have ÷ required, scaled to 0–100.
 *
 * @example calculateTechnicalSkillsScore(match) // 5 of 6 -> 83
 */
export function calculateTechnicalSkillsScore(match: MatchObject): number {
  const required = match.requiredSkills.length;
  if (required === 0) return 0;
  return clamp(ratio(match.have.length, required) * 100);
}

/**
 * Projects: count, role-relevance (tech ∩ required), and summary quality.
 * Relevance is weighted most heavily; absence of projects scores 0.
 */
export function calculateProjectsScore(
  resume: StructuredResume,
  match: MatchObject
): number {
  const projects = resume.projects ?? [];
  if (projects.length === 0) return 0;

  const requiredSet = new Set(match.requiredSkills.map((s) => s.toLowerCase()));
  const countScore = Math.min(30, projects.length * 15); // up to 30 (≥2 projects)

  const relevant = projects.filter((p) =>
    (p.tech ?? []).some((t) => requiredSet.has(t.toLowerCase()))
  ).length;
  const relevanceScore = ratio(relevant, projects.length) * 45; // up to 45

  const withSummary = projects.filter(
    (p) => (p.summary ?? "").trim().length >= 30
  ).length;
  const summaryScore = ratio(withSummary, projects.length) * 25; // up to 25

  return clamp(countScore + relevanceScore + summaryScore);
}

/**
 * Experience: number of entries plus a duration signal.
 * Entries without any stated duration are capped (weaker evidence).
 */
export function calculateExperienceScore(resume: StructuredResume): number {
  const exp = resume.experience ?? [];
  if (exp.length === 0) return 0;

  const base = Math.min(100, exp.length * 55); // 1 -> 55, 2 -> 100
  const hasDuration = exp.some((e) => (e.duration ?? "").trim().length > 0);
  return clamp(hasDuration ? base : base * 0.8);
}

/**
 * Resume Health: the deterministic overall health score (0–100).
 */
export function calculateResumeHealthScore(
  health: ResumeHealthReport
): number {
  return clamp(health?.overallScore ?? 0);
}

/**
 * Role Alignment: orthogonal-to-skills fit signals — keyword coverage,
 * nice-to-have matches, and whether any project is role-relevant. Deliberately
 * does NOT use required have/required (that lives in Technical Skills) to avoid
 * double-counting.
 */
export function calculateRoleAlignmentScore(
  resume: StructuredResume,
  match: MatchObject,
  health: ResumeHealthReport
): number {
  const keywordScore = health?.keywordCoverage?.score ?? 60; // 0–100
  const keywordPart = keywordScore * 0.6; // up to 60

  const niceBonus = Math.min(20, match.matchedNiceToHave.length * 7); // up to 20

  const requiredSet = new Set(match.requiredSkills.map((s) => s.toLowerCase()));
  const hasRelevantProject = (resume.projects ?? []).some((p) =>
    (p.tech ?? []).some((t) => requiredSet.has(t.toLowerCase()))
  );
  const projectPart = hasRelevantProject ? 20 : 0; // up to 20

  return clamp(keywordPart + niceBonus + projectPart);
}

/* -------------------------------------------------------------------------- */
/* Evidence generators                                                         */
/* -------------------------------------------------------------------------- */

interface SubScores {
  technicalSkills: number;
  projects: number;
  experience: number;
  resumeHealth: number;
  roleAlignment: number;
}

/**
 * Produce evidence-based strengths. Only true, threshold-passing facts appear.
 */
export function generateStrengths(
  input: ReadinessInput,
  sub: SubScores
): string[] {
  const { structuredResume: resume, matchObject: match, resumeHealthReport: health } = input;
  const out: string[] = [];

  if (sub.technicalSkills >= 70 && match.have.length > 0) {
    out.push(
      `Strong skill match: you have ${match.have.length} of ${match.requiredSkills.length} required ${match.role} skills (${list(match.have)}).`
    );
  }

  const requiredSet = new Set(match.requiredSkills.map((s) => s.toLowerCase()));
  const relevantProject = (resume.projects ?? []).find((p) =>
    (p.tech ?? []).some((t) => requiredSet.has(t.toLowerCase()))
  );
  if (sub.projects >= 60 && relevantProject) {
    out.push(
      `Your project "${relevantProject.name}" demonstrates required skills (${list(
        relevantProject.tech
      )}).`
    );
  }

  if (sub.experience >= 60 && (resume.experience?.length ?? 0) > 0) {
    const e = resume.experience[0];
    out.push(
      `Real-world experience: ${e.title}${e.org ? ` at ${e.org}` : ""}${
        e.duration ? ` (${e.duration})` : ""
      }.`
    );
  }

  if (match.matchedNiceToHave.length > 0) {
    out.push(
      `Bonus skills beyond the basics: ${list(match.matchedNiceToHave)}.`
    );
  }

  if ((health?.overallScore ?? 0) >= 75) {
    out.push(`Well-structured resume (health ${health.overallScore}/100).`);
  }

  return out;
}

/**
 * Produce evidence-based weaknesses citing specific gaps.
 */
export function generateWeaknesses(
  input: ReadinessInput,
  sub: SubScores
): string[] {
  const { structuredResume: resume, matchObject: match, resumeHealthReport: health } = input;
  const out: string[] = [];

  if (match.missing.length > 0) {
    out.push(
      `Missing ${match.missing.length} required ${match.role} skill(s): ${list(
        match.missing,
        4
      )}.`
    );
  }

  if (sub.projects < 50) {
    out.push(
      (resume.projects?.length ?? 0) === 0
        ? "No projects demonstrate role-relevant skills."
        : "Projects show little role relevance or lack outcome summaries."
    );
  }

  if (sub.experience < 50) {
    out.push(
      (resume.experience?.length ?? 0) === 0
        ? "No internships or professional experience listed."
        : "Limited professional experience for this role."
    );
  }

  if ((health?.impactMetrics?.score ?? 100) < 50) {
    out.push("Few quantified achievements — impact is hard to gauge.");
  }

  if ((health?.overallScore ?? 100) < 60) {
    out.push(`Resume structure needs work (health ${health.overallScore}/100).`);
  }

  return out;
}

/**
 * Pick a concrete, role-appropriate project descriptor for a missing skill.
 */
function descriptorForSkill(skill: string): string {
  const s = skill.toLowerCase();
  if (/mongo|sql|database/.test(s)) return `${skill} CRUD project`;
  if (/auth/.test(s)) return `${skill} (JWT login) feature`;
  if (/rest|api/.test(s)) return `${skill} service`;
  if (/react|state management/.test(s)) return `${skill} single-page app`;
  if (/node|express/.test(s)) return `${skill} backend API`;
  if (/test/.test(s)) return `test suite using ${skill}`;
  if (/docker|ci\/cd|aws|deploy/.test(s)) return `deployment setup using ${skill}`;
  if (/data structures|algorithms|problem solving/.test(s))
    return `set of ${skill} practice solutions`;
  if (/responsive|html|css/.test(s)) return `responsive UI using ${skill}`;
  return `${skill} project`;
}

/** Find a role commonProject that references the skill, for a concrete example. */
function exampleProjectForSkill(
  skill: string,
  role: RoleDefinition
): string | null {
  const token = skill.toLowerCase().split(/[\s.]/)[0];
  const hit = (role.commonProjects ?? []).find((p) =>
    p.toLowerCase().includes(token)
  );
  return hit ?? null;
}

/**
 * Produce next actions that map DIRECTLY to missing skills, weak projects, or
 * weak experience. Never generic. Each action names the specific gap it closes.
 */
export function generateNextActions(
  input: ReadinessInput,
  sub: SubScores
): string[] {
  const { structuredResume: resume, matchObject: match, resumeHealthReport: health, selectedRole } = input;
  const out: string[] = [];

  // 1) Missing skills -> concrete build actions (highest priority).
  const prioritized = [
    ...match.missing.filter((m) => match.requiredSkills.includes(m)),
  ].slice(0, 3);
  for (const skill of prioritized) {
    const example = exampleProjectForSkill(skill, selectedRole);
    const base = `Build a ${descriptorForSkill(skill)} to close the ${skill} gap.`;
    out.push(example ? `${base} Try: "${example}".` : base);
  }

  // 2) Weak projects (and there ARE missing skills) -> a role-relevant project.
  if (sub.projects < 50 && match.missing.length > 0 && prioritized.length === 0) {
    out.push(
      `Add a project using ${match.missing[0]} (e.g., ${descriptorForSkill(
        match.missing[0]
      )}) to prove role-relevant ability.`
    );
  } else if (sub.projects < 50 && (resume.projects?.length ?? 0) > 0) {
    out.push(
      "Add a one-line outcome summary with a metric to each project (e.g., \"served 1k+ users\")."
    );
  }

  // 3) Weak experience -> a specific experience-building action.
  if (sub.experience < 50) {
    out.push(
      (resume.experience?.length ?? 0) === 0
        ? `Gain experience for ${match.role}: pursue an internship, freelance gig, or open-source contribution.`
        : "Strengthen experience bullets with concrete responsibilities and outcomes."
    );
  }

  // 4) Low impact metrics -> quantify.
  if ((health?.impactMetrics?.score ?? 100) < 50 && out.length < 5) {
    out.push(
      'Quantify 2–3 resume bullets with numbers (e.g., "reduced query time by 30%").'
    );
  }

  // 5) Fully ready -> a non-generic, readiness-tied action.
  if (out.length === 0) {
    out.push(
      `You meet the core bar for ${match.role}: apply now and prepare for technical interviews.`
    );
  }

  return out.slice(0, 5);
}

/* -------------------------------------------------------------------------- */
/* Public: computeReadiness                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Compute the Career Readiness Score and supporting evidence.
 *
 * @param input - Resume, deterministic match, health report, selected role.
 * @returns A fully populated {@link CareerReadiness}.
 *
 * @example
 * const readiness = computeReadiness({
 *   structuredResume, matchObject, resumeHealthReport, selectedRole,
 * });
 * // readiness.score -> 68
 * // readiness.nextActions[0] -> 'Build a MongoDB CRUD project to close the MongoDB gap. ...'
 */
export function computeReadiness(input: ReadinessInput): CareerReadiness {
  const { structuredResume: resume, matchObject: match, resumeHealthReport: health } = input;

  const sub: SubScores = {
    technicalSkills: calculateTechnicalSkillsScore(match),
    projects: calculateProjectsScore(resume, match),
    experience: calculateExperienceScore(resume),
    resumeHealth: calculateResumeHealthScore(health),
    roleAlignment: calculateRoleAlignmentScore(resume, match, health),
  };

  // Weighted point contributions (rounded) — they sum to `score` exactly.
  const scoreBreakdown = {
    technicalSkills: Math.round((sub.technicalSkills * WEIGHTS.technicalSkills) / 100),
    projects: Math.round((sub.projects * WEIGHTS.projects) / 100),
    experience: Math.round((sub.experience * WEIGHTS.experience) / 100),
    resumeHealth: Math.round((sub.resumeHealth * WEIGHTS.resumeHealth) / 100),
    roleAlignment: Math.round((sub.roleAlignment * WEIGHTS.roleAlignment) / 100),
  };

  const score = clamp(
    scoreBreakdown.technicalSkills +
      scoreBreakdown.projects +
      scoreBreakdown.experience +
      scoreBreakdown.resumeHealth +
      scoreBreakdown.roleAlignment
  );

  return {
    score,
    strengths: generateStrengths(input, sub),
    weaknesses: generateWeaknesses(input, sub),
    nextActions: generateNextActions(input, sub),
    scoreBreakdown,
  };
}

export default computeReadiness;

/* -------------------------------------------------------------------------- */
/* Example usage                                                               */
/* -------------------------------------------------------------------------- */

/*
import computeReadiness from "./services/readinessService";
import matchService from "./services/matchService";
import analyzeResumeHealth from "./services/analysisService";
import rolesData from "../data/roles.json";

const selectedRole = rolesData.roles.find((r) => r.name === "Backend Developer")!;
const matchObject = matchService.generateMatchObject("Backend Developer", structuredResume.skills);
const resumeHealthReport = analyzeResumeHealth({ structuredResume, matchObject, rawResumeText });

const readiness = computeReadiness({
  structuredResume,
  matchObject,
  resumeHealthReport,
  selectedRole,
});
// readiness.score, readiness.scoreBreakdown, readiness.nextActions
*/

/* -------------------------------------------------------------------------- */
/* Edge cases handled                                                          */
/* -------------------------------------------------------------------------- */
/*
 * - Empty resume (no skills/projects/experience): all sub-scores 0 -> score 0;
 *   weaknesses + concrete nextActions (build missing-skill projects) generated.
 * - Role with 0 required skills: technicalSkills returns 0 (no divide-by-zero).
 * - Missing health dimensions: resumeHealth uses overallScore ?? 0;
 *   roleAlignment uses keywordCoverage.score ?? 60.
 * - Projects/experience with null tech/duration arrays: guarded with ?? [].
 * - Perfectly qualified candidate (no missing skills): nextActions returns a
 *   single readiness-tied action ("apply now and prepare for interviews"),
 *   never generic filler.
 * - scoreBreakdown always sums exactly to score (rounded contributions).
 */
