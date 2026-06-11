/**
 * matchService.ts
 *
 * Deterministic skill-gap engine for CareerPilot.
 *
 * Compares a candidate's extracted resume skills against a target role's
 * required and nice-to-have skills, grounded by `roles.json` and
 * `skillAliases.json`. This module is the product's core differentiator and
 * MUST remain 100% deterministic.
 *
 * Guarantees (per COPILOT_INSTRUCTIONS.md):
 *  - No AI usage. No network. No randomness.
 *  - Pure, dependency-free TypeScript.
 *  - Skills are normalized + alias-resolved to canonical names BEFORE matching.
 *  - `have` and `missing` are computed here and are never overridden by an LLM.
 *
 * @module services/matchService
 */

import rolesData from "../data/roles.json";
import skillAliasesData from "../data/skillAliases.json";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                            */
/* -------------------------------------------------------------------------- */

/** A single role definition as stored in `roles.json`. */
export interface RoleDefinition {
  id: string;
  name: string;
  required: string[];
  niceToHave: string[];
  keywords: string[];
  commonProjects?: string[];
  learningPriorities?: string[];
}

/** Root shape of `roles.json`. */
export interface RolesFile {
  roles: RoleDefinition[];
}

/** Shape of `skillAliases.json`: canonical skill -> list of aliases. */
export type SkillAliasMap = Record<string, string[]>;

/**
 * The deterministic match result returned by {@link generateMatchObject}.
 * Field names align with SCHEMAS.md (`matchObject`) plus reporting extras.
 */
export interface MatchObject {
  /** Canonical role name (e.g., "Backend Developer"). */
  role: string;
  /** Role's required canonical skills. */
  requiredSkills: string[];
  /** Role's nice-to-have canonical skills. */
  niceToHaveSkills: string[];
  /** Required skills present in the resume (canonical). */
  have: string[];
  /** Required skills absent from the resume (canonical). */
  missing: string[];
  /** Nice-to-have skills present in the resume (canonical). */
  matchedNiceToHave: string[];
  /** Percentage of required skills covered, 0–100, rounded to an integer. */
  coveragePercentage: number;
}

/** Dependencies injected into the service (for testability). */
export interface MatchServiceDeps {
  roles: RoleDefinition[];
  /** Precomputed alias index: normalized token -> canonical skill name. */
  aliasIndex: Map<string, string>;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Thrown when a requested role does not exist in the role dataset.
 * Controllers should map this to `400 INVALID_ROLE`.
 */
export class UnknownRoleError extends Error {
  public readonly code = "INVALID_ROLE";
  constructor(role: string) {
    super(`Unknown target role: "${role}".`);
    this.name = "UnknownRoleError";
  }
}

/* -------------------------------------------------------------------------- */
/* Core pure helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Normalize a raw skill string into a stable comparison form.
 *
 * Steps: coerce to string, trim, lowercase, collapse internal whitespace,
 * and strip leading/trailing punctuation. Internal punctuation (e.g., the dot
 * in "node.js" or hyphen in "rest-api") is preserved so enumerated aliases
 * still match.
 *
 * @param raw - Any candidate value (may be null/undefined/non-string).
 * @returns The normalized token, or an empty string for invalid input.
 *
 * @example
 * normalizeSkill("  React.JS ");      // "react.js"
 * normalizeSkill("NODE   JS");        // "node js"
 * normalizeSkill(null);               // ""
 */
export function normalizeSkill(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const str = typeof raw === "string" ? raw : String(raw);
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .trim();
}

/**
 * Build a "loose" key by removing every non-alphanumeric character.
 * Used as a fallback so punctuation differences not enumerated in the alias
 * map still resolve (e.g., "react.js" / "react js" / "reactjs" -> "reactjs").
 *
 * @param normalized - A value already passed through {@link normalizeSkill}.
 * @returns The alphanumeric-only key.
 */
function looseKey(normalized: string): string {
  return normalized.replace(/[^a-z0-9]/g, "");
}

/**
 * Construct a fast lookup index mapping every alias (and canonical name)
 * to its canonical skill, in both exact-normalized and loose forms.
 *
 * @param aliasMap - The `skillAliases.json` map (canonical -> aliases[]).
 * @returns A Map of normalized/loose token -> canonical skill name.
 */
export function buildAliasIndex(aliasMap: SkillAliasMap): Map<string, string> {
  const index = new Map<string, string>();

  const add = (token: string, canonical: string): void => {
    const norm = normalizeSkill(token);
    if (!norm) return;
    if (!index.has(norm)) index.set(norm, canonical);
    const loose = looseKey(norm);
    if (loose && !index.has(loose)) index.set(loose, canonical);
  };

  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    add(canonical, canonical); // canonical maps to itself
    if (Array.isArray(aliases)) {
      for (const alias of aliases) add(alias, canonical);
    }
  }

  return index;
}

/**
 * Resolve a single skill to its canonical name using the alias index.
 * Falls back to exact-normalized match, then loose match. If unknown, returns
 * the trimmed original string so it can still serve as resume evidence.
 *
 * @param raw - The raw skill value from the resume.
 * @param aliasIndex - Index from {@link buildAliasIndex}.
 * @returns The canonical skill name, or the cleaned original if unresolved.
 *
 * @example
 * resolveAlias("nodejs", idx);   // "Node.js"
 * resolveAlias("Mongo DB", idx); // "MongoDB"
 * resolveAlias("Svelte", idx);   // "Svelte" (passthrough)
 */
export function resolveAlias(raw: unknown, aliasIndex: Map<string, string>): string {
  const norm = normalizeSkill(raw);
  if (!norm) return "";

  const exact = aliasIndex.get(norm);
  if (exact) return exact;

  const loose = aliasIndex.get(looseKey(norm));
  if (loose) return loose;

  // Unknown skill: return a trimmed, single-spaced version of the original.
  return typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : norm;
}

/**
 * Calculate required-skill coverage as an integer percentage (0–100).
 *
 * @param haveCount - Number of required skills present.
 * @param requiredCount - Total number of required skills.
 * @returns Rounded percentage; 0 when there are no required skills.
 *
 * @example
 * calculateCoverage(3, 7); // 43
 * calculateCoverage(0, 0); // 0
 */
export function calculateCoverage(haveCount: number, requiredCount: number): number {
  if (!Number.isFinite(haveCount) || !Number.isFinite(requiredCount)) return 0;
  if (requiredCount <= 0) return 0;
  const clamped = Math.max(0, Math.min(haveCount, requiredCount));
  return Math.round((clamped / requiredCount) * 100);
}

/* -------------------------------------------------------------------------- */
/* Skill set cleaning                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Clean, normalize, alias-resolve, and de-duplicate a raw skills array.
 * Handles null/undefined entries, non-string values, blanks, mixed casing,
 * whitespace, and punctuation differences.
 *
 * @param rawSkills - The resume's skills array (untrusted input).
 * @param aliasIndex - Index from {@link buildAliasIndex}.
 * @returns A Set of canonical resolved skill names (case as stored).
 */
export function resolveSkillSet(
  rawSkills: unknown,
  aliasIndex: Map<string, string>
): Set<string> {
  const resolved = new Set<string>();
  if (!Array.isArray(rawSkills)) return resolved;

  for (const entry of rawSkills) {
    const canonical = resolveAlias(entry, aliasIndex);
    if (canonical) resolved.add(canonical);
  }
  return resolved;
}

/**
 * Internal: test whether a canonical role skill is present in the resolved
 * resume set. Both sides are compared via canonical resolution to guarantee
 * symmetry (e.g., role lists "Node.js"; resume had "nodejs").
 */
function isPresent(
  roleSkill: string,
  resumeCanonical: Set<string>,
  aliasIndex: Map<string, string>
): boolean {
  const canonical = resolveAlias(roleSkill, aliasIndex);
  return resumeCanonical.has(canonical);
}

/* -------------------------------------------------------------------------- */
/* Public: generateMatchObject                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Deterministically compare resume skills against a role's requirements.
 *
 * @param roleName - Target role name (must exist in the role dataset).
 * @param rawSkills - The resume's extracted skills (untrusted).
 * @param deps - Injected roles + alias index (defaults to bundled data).
 * @returns A fully populated {@link MatchObject}.
 * @throws {UnknownRoleError} When `roleName` is not in the dataset.
 *
 * @example
 * const result = generateMatchObject("Backend Developer", ["nodejs", "express", "git"]);
 * // result.have      -> ["JavaScript"?, "Node.js", "Express.js", "Git"] (subset present)
 * // result.missing   -> ["REST APIs", "MongoDB", ...]
 */
export function generateMatchObject(
  roleName: string,
  rawSkills: unknown,
  deps: MatchServiceDeps = defaultDeps
): MatchObject {
  const role = deps.roles.find((r) => r.name === roleName);
  if (!role) throw new UnknownRoleError(roleName);

  const requiredSkills = Array.isArray(role.required) ? role.required : [];
  const niceToHaveSkills = Array.isArray(role.niceToHave) ? role.niceToHave : [];

  const resumeCanonical = resolveSkillSet(rawSkills, deps.aliasIndex);

  const have: string[] = [];
  const missing: string[] = [];
  for (const skill of requiredSkills) {
    if (isPresent(skill, resumeCanonical, deps.aliasIndex)) have.push(skill);
    else missing.push(skill);
  }

  const matchedNiceToHave = niceToHaveSkills.filter((skill) =>
    isPresent(skill, resumeCanonical, deps.aliasIndex)
  );

  return {
    role: role.name,
    requiredSkills,
    niceToHaveSkills,
    have,
    missing,
    matchedNiceToHave,
    coveragePercentage: calculateCoverage(have.length, requiredSkills.length),
  };
}

/* -------------------------------------------------------------------------- */
/* Factory + default instance                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Create a match service bound to specific datasets. Prefer this in tests to
 * inject fixtures instead of the bundled JSON files.
 *
 * @param roles - Role definitions.
 * @param aliasMap - Canonical -> aliases map.
 */
export function createMatchService(
  roles: RoleDefinition[],
  aliasMap: SkillAliasMap
) {
  const aliasIndex = buildAliasIndex(aliasMap);
  const deps: MatchServiceDeps = { roles, aliasIndex };
  return {
    deps,
    generateMatchObject: (roleName: string, rawSkills: unknown): MatchObject =>
      generateMatchObject(roleName, rawSkills, deps),
  };
}

/** Default dependencies built from the bundled `roles.json` + `skillAliases.json`. */
export const defaultDeps: MatchServiceDeps = {
  roles: (rolesData as RolesFile).roles,
  aliasIndex: buildAliasIndex(skillAliasesData as SkillAliasMap),
};

/** Default, ready-to-use service instance. */
export const matchService = {
  deps: defaultDeps,
  generateMatchObject: (roleName: string, rawSkills: unknown): MatchObject =>
    generateMatchObject(roleName, rawSkills, defaultDeps),
};

export default matchService;

/* -------------------------------------------------------------------------- */
/* Example usage (remove or guard in production builds)                        */
/* -------------------------------------------------------------------------- */

/*
import matchService from "./services/matchService";

const result = matchService.generateMatchObject("Backend Developer", [
  "NODE.JS",        // -> Node.js
  "  express js ",  // -> Express.js
  "Git",            // -> Git
  "javascript",     // -> JavaScript
  null,             // ignored
  undefined,        // ignored
  "Express",        // duplicate -> deduped
]);

console.log(result);
// {
//   role: "Backend Developer",
//   requiredSkills: ["JavaScript","Node.js","Express.js","REST APIs","MongoDB","Git"],
//   niceToHaveSkills: ["SQL","Authentication","TypeScript","Unit Testing","Docker","Error Handling"],
//   have: ["JavaScript","Node.js","Express.js","Git"],
//   missing: ["REST APIs","MongoDB"],
//   matchedNiceToHave: [],
//   coveragePercentage: 67
// }
*/
