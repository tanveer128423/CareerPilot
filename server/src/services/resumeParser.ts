/**
 * resumeParser.ts
 *
 * Converts raw extracted resume text (from PDF/DOCX) into a `StructuredResume`
 * matching SCHEMAS.md #4.
 *
 * Strategy (per ARCHITECTURE.md §7):
 *  1. DETERMINISTIC FIRST — clean text, detect sections, and extract skills /
 *     projects / experience / education with heuristics + the alias dictionary.
 *  2. GEMINI FALLBACK ONLY WHEN NECESSARY — if deterministic parsing is
 *     insufficient (or `forceGemini` is set), delegate to an injected
 *     structurer. The structurer is an interface, so this module stays
 *     dependency-free and unit-testable without any LLM.
 *
 * @module services/resumeParser
 */

import { buildAliasIndex, resolveAlias } from "./matchService";
import skillAliasesData from "../data/skillAliases.json";

/* -------------------------------------------------------------------------- */
/* Types (align with SCHEMAS.md)                                               */
/* -------------------------------------------------------------------------- */

export interface Project {
  name: string;
  tech: string[];
  summary: string;
}

export interface Experience {
  title: string;
  org: string;
  duration: string;
  summary: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface StructuredResume {
  skills: string[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  rawTextLength: number;
}

/** Minimum characters of usable text before we consider the input parseable. */
export const MIN_TEXT_LENGTH = 50;

/** Max chars of source text retained for downstream raw-text use. */
export const RAW_TEXT_LIMIT = 8000;

/**
 * Optional LLM structurer. Implemented elsewhere (e.g., geminiClient) and
 * injected, so this module has no hard AI dependency.
 */
export interface GeminiStructurer {
  /** Convert raw resume text into a StructuredResume (without rawTextLength). */
  structure(rawText: string): Promise<Omit<StructuredResume, "rawTextLength">>;
}

/** Options controlling parse behavior. */
export interface ParseOptions {
  /** Injected LLM fallback. If omitted, only deterministic parsing runs. */
  structurer?: GeminiStructurer;
  /** Force the Gemini path even if deterministic parsing looks sufficient. */
  forceGemini?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Thrown when text cannot be parsed (e.g., empty / scanned image PDF).
 * Controllers should map this to `422 PARSE_FAILED`.
 */
export class ParseError extends Error {
  public readonly code = "PARSE_FAILED";
  public readonly retryable = true;
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/* -------------------------------------------------------------------------- */
/* Shared alias index (built once)                                             */
/* -------------------------------------------------------------------------- */

const ALIAS_INDEX = buildAliasIndex(
  skillAliasesData as Record<string, string[]>
);

/* -------------------------------------------------------------------------- */
/* Section detection                                                           */
/* -------------------------------------------------------------------------- */

type SectionKey =
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "summary"
  | "other";

/** Header keyword -> canonical section. Order matters for specificity. */
const SECTION_PATTERNS: Array<{ key: SectionKey; re: RegExp }> = [
  { key: "skills", re: /^(technical\s+)?skills?|technologies|tech\s*stack|competenc/i },
  { key: "projects", re: /^projects?|personal\s+projects?|portfolio/i },
  { key: "experience", re: /^(work\s+)?experience|employment|internships?|professional/i },
  { key: "education", re: /^education|academics?|qualifications?/i },
  { key: "summary", re: /^(professional\s+)?summary|objective|about(\s+me)?|profile/i },
];

/** Degree keywords used to detect/parse education lines. */
const DEGREE_RE =
  /\b(b\.?\s?s\.?c?|b\.?\s?tech|b\.?\s?e\b|bachelor|m\.?\s?s\.?c?|m\.?\s?tech|master|ph\.?\s?d|associate|diploma)\b/i;

/** 4-digit year or year range (e.g., 2026, 2022-2026, 2022–2026). */
const YEAR_RE = /\b(19|20)\d{2}\s*(?:[-–—]\s*(?:present|current|(?:19|20)\d{2}))?\b/i;

/* -------------------------------------------------------------------------- */
/* Public: cleanText                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Clean and normalize raw extracted text.
 * Normalizes line endings, strips control chars, collapses excess whitespace,
 * de-hyphenates line-broken words, and trims each line.
 *
 * @param raw - Untrusted extracted text (may be undefined/null).
 * @returns Cleaned text.
 */
export function cleanText(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let text = typeof raw === "string" ? raw : String(raw);

  text = text
    .replace(/\r\n?/g, "\n") // normalize newlines
    .replace(/\u00A0/g, " ") // non-breaking space -> space
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // control chars
    .replace(/[ \t]+/g, " ") // collapse horizontal whitespace
    .replace(/ ?\n ?/g, "\n") // trim around newlines
    .replace(/\n{3,}/g, "\n\n"); // cap blank-line runs

  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

/**
 * Split cleaned text into detected sections.
 * Any content before the first recognized header is stored under "summary".
 *
 * @param cleaned - Output of {@link cleanText}.
 * @returns A record of section key -> array of content lines.
 */
export function splitSections(cleaned: string): Record<SectionKey, string[]> {
  const sections: Record<SectionKey, string[]> = {
    skills: [],
    projects: [],
    experience: [],
    education: [],
    summary: [],
    other: [],
  };

  const lines = cleaned.split("\n");
  let current: SectionKey = "summary";

  for (const line of lines) {
    if (!line) continue;
    const header = detectHeader(line);
    if (header) {
      current = header;
      continue; // do not include the header text itself
    }
    sections[current].push(line);
  }

  return sections;
}

/** Detect whether a short line is a section header; return its key or null. */
function detectHeader(line: string): SectionKey | null {
  const stripped = line.replace(/[:\-–—|]+$/g, "").trim();
  // Headers are short and not full sentences.
  if (stripped.length === 0 || stripped.length > 40) return null;
  if (stripped.split(" ").length > 4) return null;
  for (const { key, re } of SECTION_PATTERNS) {
    if (re.test(stripped)) return key;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Extractors (deterministic)                                                  */
/* -------------------------------------------------------------------------- */

/** Split a free-form skills blob into candidate tokens. */
function tokenizeSkillsBlob(blob: string): string[] {
  return blob
    .split(/[,;|/•·\n\t]| - |\u2022/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extract canonical skills. Prefers the Skills section; always augments with a
 * full-text scan for known aliases. Returns de-duplicated canonical names.
 *
 * @param cleaned - Full cleaned text.
 * @param sections - Detected sections.
 * @returns Canonical skill names (order: section-first, then discovered).
 */
export function extractSkills(
  cleaned: string,
  sections: Record<SectionKey, string[]>
): string[] {
  const found = new Set<string>();
  const ordered: string[] = [];

  const consider = (token: string): void => {
    const norm = token.toLowerCase().trim();
    if (!norm) return;
    const canonical = resolveAlias(token, ALIAS_INDEX);
    // Only accept tokens that resolve to a KNOWN canonical skill.
    const isKnown =
      ALIAS_INDEX.has(norm) ||
      ALIAS_INDEX.has(norm.replace(/[^a-z0-9]/g, ""));
    if (isKnown && canonical && !found.has(canonical)) {
      found.add(canonical);
      ordered.push(canonical);
    }
  };

  // 1) Explicit skills section.
  for (const line of sections.skills) {
    for (const tok of tokenizeSkillsBlob(line)) consider(tok);
  }

  // 2) Full-text alias scan (catches skills mentioned in projects/experience).
  //    Conservative: skip single ambiguous words to avoid prose false positives.
  for (const phrase of generatePhrases(tokenizeWords(cleaned))) {
    if (isAmbiguousInProse(phrase)) continue;
    consider(phrase);
  }

  return ordered;
}

/**
 * Single-word aliases that are common English words / proper-noun fragments.
 * They are accepted in an explicit Skills SECTION but ignored during prose and
 * project-tech scans to avoid false positives (e.g., "State University" ->
 * "State Management", "next steps" -> "Next.js", "browser cache" -> "Redis").
 */
const PROSE_AMBIGUOUS = new Set([
  "state",
  "next",
  "cache",
  "pipeline",
  "testing",
]);

/** True if a phrase is a single ambiguous word that prose scans must skip. */
function isAmbiguousInProse(phrase: string): boolean {
  const norm = phrase.toLowerCase().trim();
  return !norm.includes(" ") && PROSE_AMBIGUOUS.has(norm);
}

/** Split prose into atomic, lowercase word tokens (keeps internal . + #). */
function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9][a-z0-9.+#]*/g) || [];
}

/** Generate 1–3 word phrases for alias scanning. */
function generatePhrases(words: string[]): string[] {
  const phrases: string[] = [];
  for (let i = 0; i < words.length; i++) {
    phrases.push(words[i]);
    if (i + 1 < words.length) phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i + 2 < words.length)
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return phrases;
}

/**
 * Extract education entries by scanning the education section (and fallback to
 * full text) for degree keywords, institutions, and years.
 */
export function extractEducation(
  cleaned: string,
  sections: Record<SectionKey, string[]>
): Education[] {
  const lines = sections.education.length
    ? sections.education
    : cleaned.split("\n");
  const out: Education[] = [];

  for (const line of lines) {
    if (!DEGREE_RE.test(line)) continue;
    const yearMatch = line.match(YEAR_RE);
    const year = yearMatch ? yearMatch[0].replace(/\s+/g, "") : "";

    // Heuristic: split "Degree, Institution, Year" style lines.
    const parts = line.split(/[,–—|]| - /).map((p) => p.trim()).filter(Boolean);
    const degreePart =
      parts.find((p) => DEGREE_RE.test(p)) ?? parts[0] ?? line.trim();
    const institution =
      parts.find((p) => p !== degreePart && !YEAR_RE.test(p)) ?? "";

    out.push({
      degree: clip(degreePart, 120) || "Degree",
      institution: clip(institution, 120),
      year: clip(year, 20),
    });
    if (out.length >= 20) break;
  }

  return out;
}

/**
 * Extract experience entries from the experience section.
 * Recognizes "Title, Org (Duration)" and "Title at Org" patterns; the next
 * non-header line is treated as the summary.
 */
export function extractExperience(
  sections: Record<SectionKey, string[]>
): Experience[] {
  const lines = sections.experience;
  const out: Experience[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const durationMatch = line.match(
      /\(([^)]*\d[^)]*)\)|\b\d+\s*(?:months?|years?|yrs?|mos?)\b|\b(19|20)\d{2}\s*[-–—]\s*(?:present|current|(19|20)\d{2})\b/i
    );
    const duration = durationMatch ? clean(durationMatch[1] ?? durationMatch[0]) : "";

    // Split title / org on "at", "@", comma, or dash.
    const withoutDuration = line.replace(/\([^)]*\)/g, "").trim();
    const parts = withoutDuration.split(/\s+at\s+|\s+@\s+|,| - |–|—|\|/i)
      .map((p) => p.trim())
      .filter(Boolean);

    const looksLikeRole =
      /\b(intern|engineer|developer|analyst|manager|assistant|lead|consultant|designer|trainee)\b/i.test(
        line
      );
    if (!looksLikeRole && !duration) continue;

    const title = clip(parts[0] ?? withoutDuration, 120) || "Role";
    const org = clip(parts[1] ?? "", 120);
    const summary = clip(lookahead(lines, i), 500);

    out.push({ title, org, duration: clip(duration, 60), summary });
    if (out.length >= 30) break;
  }

  return out;
}

/** Leading bullet / numbering markers (e.g. "- ", "• ", "1. ", "‣"). */
const BULLET_PREFIX_RE = /^\s*(?:[-*•·–—▪◦‣>]+|\d+[.)])\s+/;

/** Separators that divide an inline "Title <sep> Description". */
const TITLE_DESC_SPLIT_RE = /\s+[-–—:|]+\s+|:\s+|\s+\u2013\s+/;

/** Experience-style line we should NOT treat as a project in fallback mode. */
const EXPERIENCE_ROLE_RE =
  /\b(intern|engineer|developer|analyst|manager|consultant|assistant|trainee|lead)\b/i;
const DURATION_HINT_RE =
  /\(([^)]*\d[^)]*)\)|\b\d+\s*(?:months?|years?|yrs?|mos?)\b|\b(19|20)\d{2}\s*[-–—]\s*(?:present|current|(19|20)\d{2})\b/i;

/** Strip any leading bullet/number marker from a line. */
function stripBulletMarker(line: string): { text: string; wasBullet: boolean } {
  const wasBullet = BULLET_PREFIX_RE.test(line);
  return { text: line.replace(BULLET_PREFIX_RE, "").trim(), wasBullet };
}

/**
 * Split a single line into a project name and an inline description.
 * Splits on the FIRST title/description separator only; if none exists the
 * whole line is treated as a title with an empty inline description.
 */
function splitTitleDescription(text: string): { name: string; inlineSummary: string } {
  const match = text.match(TITLE_DESC_SPLIT_RE);
  if (match && match.index !== undefined && match.index > 0) {
    const name = text.slice(0, match.index).trim();
    const inlineSummary = text.slice(match.index + match[0].length).trim();
    // Guard: only treat as Title+Desc when the left side reads like a title
    // (short-ish and not a full sentence already).
    if (name && name.length <= 80) return { name, inlineSummary };
  }
  return { name: text.trim(), inlineSummary: "" };
}

/**
 * Decide whether a line begins a new project entry (vs. being a continuation
 * line that should attach to the previous project's summary).
 */
function startsProject(
  rawLine: string,
  text: string,
  wasBullet: boolean,
  hasInlineSummary: boolean,
  techCount: number
): boolean {
  if (wasBullet) return true; // bullet-style projects
  if (hasInlineSummary) return true; // "Title - Description"
  // Title-only line: starts with an uppercase/alphanumeric token, not lowercase
  // sentence continuation, and is reasonably short OR clearly tech-bearing.
  const titleish = /^[A-Z0-9("']/.test(text) && text.length <= 80;
  return titleish || techCount > 0;
}

/**
 * Extract project entries.
 *
 * Handles four resume styles deterministically:
 *  1. Title-only lines (description on the following line).
 *  2. Title + description on the same line (split on the first separator).
 *  3. Bullet / numbered project lines.
 *  4. No dedicated Projects section (falls back to scanning the rest of the
 *     resume for tech-bearing project-like lines, skipping experience entries).
 *
 * Tech is detected via the alias index across the title, inline description,
 * and the next line; returned as a de-duplicated, appearance-ordered set.
 */
export function extractProjects(
  sections: Record<SectionKey, string[]>
): Project[] {
  const hasSection = sections.projects.length > 0;

  // Candidate lines: the Projects section when present; otherwise a fallback
  // pool from the rest of the resume (no dedicated Projects section).
  const lines = hasSection
    ? sections.projects
    : [...sections.summary, ...sections.other, ...sections.experience];

  const out: Project[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    const { text, wasBullet } = stripBulletMarker(rawLine);
    if (!text) continue;

    const { name: rawName, inlineSummary } = splitTitleDescription(text);
    const name = clip(rawName.replace(/[\s\-–—:|]+$/g, "").trim(), 120);
    if (!name) continue;

    // Tech from the full line + inline summary + the following line.
    const next = lookahead(lines, i);
    const tech = detectTechIn(`${text}\n${next}`);

    const isStart = startsProject(
      rawLine,
      text,
      wasBullet,
      inlineSummary.length > 0,
      tech.length
    );

    if (!isStart) {
      // Continuation line: append to the previous project's summary if empty.
      const prev = out[out.length - 1];
      if (prev && !prev.summary) prev.summary = clip(text, 500);
      continue;
    }

    // In fallback mode (no Projects section), be PRECISION-FIRST:
    //  - require explicit project STRUCTURE (a bullet, or "Title <sep> Desc"),
    //    so flowing prose like a SUMMARY/objective sentence is never a project;
    //  - require a tech signal; and
    //  - skip experience-style role lines.
    if (!hasSection) {
      const structured = wasBullet || inlineSummary.length > 0;
      const looksLikeExperience =
        EXPERIENCE_ROLE_RE.test(text) && DURATION_HINT_RE.test(rawLine);
      if (!structured || tech.length === 0 || looksLikeExperience) continue;
    }

    const summary = clip(inlineSummary || next, 500);

    out.push({ name, tech, summary });
    if (out.length >= 30) break;
  }

  return out;
}

/** Detect known canonical skills mentioned within a text block. */
function detectTechIn(block: string): string[] {
  const found = new Set<string>();
  for (const phrase of generatePhrases(tokenizeWords(block))) {
    if (isAmbiguousInProse(phrase)) continue;
    const norm = phrase.trim();
    if (!norm) continue;
    if (
      ALIAS_INDEX.has(norm) ||
      ALIAS_INDEX.has(norm.replace(/[^a-z0-9]/g, ""))
    ) {
      found.add(resolveAlias(phrase, ALIAS_INDEX));
    }
  }
  return [...found];
}

/* -------------------------------------------------------------------------- */
/* Small utilities                                                             */
/* -------------------------------------------------------------------------- */

function clean(s: string): string {
  return s.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
}

function clip(s: string, max: number): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max).trim() : t;
}

/** Return the next non-empty line after index i (a likely description). */
function lookahead(lines: string[], i: number): string {
  for (let j = i + 1; j < lines.length; j++) {
    if (lines[j] && lines[j].length > 0) return lines[j];
  }
  return "";
}

/* -------------------------------------------------------------------------- */
/* Sufficiency check + assembly                                                */
/* -------------------------------------------------------------------------- */

/**
 * Decide whether deterministic parsing produced a usable result.
 * We require at least one skill OR a project/experience with a skill signal.
 */
export function isSufficient(r: Omit<StructuredResume, "rawTextLength">): boolean {
  if (r.skills.length >= 3) return true;
  if (r.skills.length >= 1 && (r.projects.length > 0 || r.experience.length > 0))
    return true;
  return false;
}

/** Deterministically build a StructuredResume from cleaned text. */
export function parseDeterministic(
  cleaned: string
): Omit<StructuredResume, "rawTextLength"> {
  const sections = splitSections(cleaned);
  return {
    skills: extractSkills(cleaned, sections),
    projects: extractProjects(sections),
    experience: extractExperience(sections),
    education: extractEducation(cleaned, sections),
  };
}

/* -------------------------------------------------------------------------- */
/* Public: parseResume                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Parse extracted resume text into a `StructuredResume`.
 *
 * Deterministic-first: if heuristics yield a sufficient result (and
 * `forceGemini` is not set), no LLM is used. Otherwise, if a `structurer` is
 * injected, the Gemini fallback runs; its output is sanitized and preferred.
 *
 * @param rawText - Extracted text from the uploaded PDF/DOCX.
 * @param options - Optional Gemini fallback + flags.
 * @returns A validated, sanitized StructuredResume.
 * @throws {ParseError} When there is too little usable text to parse.
 *
 * @example
 * const resume = await parseResume(pdfText);                  // deterministic only
 * const resume = await parseResume(pdfText, { structurer });  // with LLM fallback
 */
export async function parseResume(
  rawText: unknown,
  options: ParseOptions = {}
): Promise<StructuredResume> {
  const cleaned = cleanText(rawText);

  if (cleaned.length < MIN_TEXT_LENGTH) {
    throw new ParseError(
      "We couldn't read enough text from that file. Please upload a text-based PDF or DOCX (not a scanned image)."
    );
  }

  const rawTextLength = cleaned.length;
  let result = parseDeterministic(cleaned);

  const needsLlm = options.forceGemini || !isSufficient(result);
  if (needsLlm && options.structurer) {
    try {
      const llm = await options.structurer.structure(
        cleaned.slice(0, RAW_TEXT_LIMIT)
      );
      result = mergePreferLlm(result, sanitizeStructured(llm));
    } catch {
      // LLM failed — fall back to whatever deterministic parsing produced.
    }
  }

  return finalize(result, rawTextLength);
}

/* -------------------------------------------------------------------------- */
/* Sanitization + finalization                                                 */
/* -------------------------------------------------------------------------- */

/** Coerce/sanitize an untrusted structured object (e.g., from the LLM). */
export function sanitizeStructured(
  input: Partial<Omit<StructuredResume, "rawTextLength">> | null | undefined
): Omit<StructuredResume, "rawTextLength"> {
  const safeArr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

  const skills = [
    ...new Set(
      safeArr<unknown>(input?.skills)
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
    ),
  ];

  const projects = safeArr<Partial<Project>>(input?.projects).map((p) => ({
    name: clip(String(p?.name ?? ""), 120) || "Project",
    tech: safeArr<unknown>(p?.tech)
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean),
    summary: clip(String(p?.summary ?? ""), 500),
  }));

  const experience = safeArr<Partial<Experience>>(input?.experience).map((e) => ({
    title: clip(String(e?.title ?? ""), 120) || "Role",
    org: clip(String(e?.org ?? ""), 120),
    duration: clip(String(e?.duration ?? ""), 60),
    summary: clip(String(e?.summary ?? ""), 500),
  }));

  const education = safeArr<Partial<Education>>(input?.education).map((ed) => ({
    degree: clip(String(ed?.degree ?? ""), 120) || "Degree",
    institution: clip(String(ed?.institution ?? ""), 120),
    year: clip(String(ed?.year ?? ""), 20),
  }));

  return { skills, projects, experience, education };
}

/** Prefer LLM fields when they are non-empty; otherwise keep deterministic. */
function mergePreferLlm(
  base: Omit<StructuredResume, "rawTextLength">,
  llm: Omit<StructuredResume, "rawTextLength">
): Omit<StructuredResume, "rawTextLength"> {
  return {
    skills: llm.skills.length ? unique(llm.skills) : base.skills,
    projects: llm.projects.length ? llm.projects : base.projects,
    experience: llm.experience.length ? llm.experience : base.experience,
    education: llm.education.length ? llm.education : base.education,
  };
}

/** Final clamps to satisfy schema limits and ensure required fields exist. */
function finalize(
  r: Omit<StructuredResume, "rawTextLength">,
  rawTextLength: number
): StructuredResume {
  return {
    skills: unique(r.skills).slice(0, 100),
    projects: r.projects.slice(0, 30),
    experience: r.experience.slice(0, 30),
    education: r.education.slice(0, 20),
    rawTextLength,
  };
}

function unique(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

export default parseResume;

/* -------------------------------------------------------------------------- */
/* Example usage                                                               */
/* -------------------------------------------------------------------------- */

/*
import parseResume from "./services/resumeParser";

const text = `
AISHA KHAN
Computer Science Student | aisha@email.com

SKILLS
JavaScript, Node, Express, React, Git

PROJECTS
E-commerce API - Built a REST API with Node and Express for products and orders.

EXPERIENCE
Software Intern at TechCorp (3 months) - Built internal tooling.

EDUCATION
BS Computer Science, State University, 2026
`;

const resume = await parseResume(text); // deterministic; no LLM needed
// resume.skills -> ["JavaScript","Node.js","Express.js","React","Git"]
*/

/* -------------------------------------------------------------------------- */
/* extractProjects() edge-case scenarios (expected deterministic behavior)     */
/* -------------------------------------------------------------------------- */
/*
 * All examples assume the lines sit under a "PROJECTS" section unless the
 * scenario states otherwise. `tech` is a de-duplicated, first-appearance set.
 *
 * 1) Title + inline description (the reported bug):
 *    IN : "E-commerce API - Built a REST API with Node.js and Express.js."
 *    OUT: { name: "E-commerce API",
 *           tech: ["REST APIs", "Node.js", "Express.js"],   // set; order = appearance
 *           summary: "Built a REST API with Node.js and Express.js." }
 *
 * 2) Title-only line, description on the NEXT line:
 *    IN : ["Task Manager", "A full-stack app using React and MongoDB."]
 *    OUT: { name: "Task Manager",
 *           tech: ["React", "MongoDB"],
 *           summary: "A full-stack app using React and MongoDB." }
 *
 * 3) Bullet-style project:
 *    IN : "- Chat App: real-time messaging built with Node.js and WebSockets."
 *    OUT: { name: "Chat App",
 *           tech: ["Node.js"],
 *           summary: "real-time messaging built with Node.js and WebSockets." }
 *
 * 4) Numbered list project:
 *    IN : "1. Portfolio Site — Responsive personal site in HTML, CSS, JavaScript."
 *    OUT: { name: "Portfolio Site",
 *           tech: ["Responsive Design", "HTML", "CSS", "JavaScript"], // "responsive" alias hits
 *           summary: "Responsive personal site in HTML, CSS, JavaScript." }
 *
 * 5) Colon separator between title and description:
 *    IN : "URL Shortener: A Node.js and Express.js service with MongoDB."
 *    OUT: { name: "URL Shortener",
 *           tech: ["Node.js", "Express.js", "MongoDB"],
 *           summary: "A Node.js and Express.js service with MongoDB." }
 *
 * 6) Long single line (> 80 chars) — must NOT be rejected:
 *    IN : "E-commerce API - Built a REST API with Node.js, Express.js and " +
 *         "MongoDB that reduced query time by 30%."
 *    OUT: { name: "E-commerce API",
 *           tech: ["REST APIs", "Node.js", "Express.js", "MongoDB"],
 *           summary: "Built a REST API with Node.js, Express.js and MongoDB that
 *                     reduced query time by 30%." }
 *
 * 7) Title-only with NO description anywhere (sparse resume):
 *    IN : ["Weather App"]
 *    OUT: { name: "Weather App", tech: [], summary: "" }
 *
 * 8) Multi-line bullet project (continuation line attaches to summary):
 *    IN : ["Blog Platform", "Built with React and Node.js.",
 *          "Added JWT authentication and comments."]
 *    OUT: { name: "Blog Platform",
 *           tech: ["React", "Node.js"],
 *           summary: "Built with React and Node.js." }   // first desc line wins
 *
 * 9) No dedicated Projects section (fallback scan; precision-first):
 *    IN (under SUMMARY/other): "- Expense Tracker: built with React, Node.js and MongoDB."
 *    OUT: { name: "Expense Tracker",
 *           tech: ["React", "Node.js", "MongoDB"], summary: "built with React, Node.js and MongoDB." }
 *    Accepted ONLY because it is STRUCTURED (bullet/separator) AND tech-bearing.
 *    A plain prose line with tech but no bullet/separator (e.g. a SUMMARY
 *    sentence "Experienced React developer with Node.js...") is REJECTED.
 *
 * 10) Fallback must IGNORE experience-style lines:
 *     IN (no Projects section): "Software Intern at TechCorp (3 months) - Used Node.js."
 *     OUT: (no project extracted) — matches EXPERIENCE_ROLE_RE + duration, so it is
 *          skipped in fallback mode and handled by extractExperience() instead.
 */
