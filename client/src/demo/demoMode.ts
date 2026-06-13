/**
 * demoMode.ts — Offline demo safety net.
 *
 * When VITE_DEMO_MODE=true (or any live call fails), the app serves pre-baked,
 * engine-verified results so a demo NEVER shows a blank screen or a stack trace.
 *
 * Numbers here mirror prep/02-EXPECTED-RESULTS.md and prep/03-MENTOR-CONVERSATIONS.md:
 *   - Bilal (Weak Backend):  readiness 40, missing Node/Express/REST/MongoDB, 16-week roadmap.
 *   - Aisha (Strong Backend): readiness 87, 6/6 skills, no roadmap.
 *
 * This module performs NO network or AI calls — it is pure, synchronous data.
 *
 * @module demo/demoMode
 */

import type { AnalysisResult, MentorResponse, StructuredResume } from "../types";
import analysisSamples from "./analysisResult.sample.json";
import mentorAnswers from "./mentorAnswers.sample.json";

/** Build-time toggle. Set VITE_DEMO_MODE=true to force fully offline demo. */
export const DEMO_MODE: boolean = import.meta.env.VITE_DEMO_MODE === "true";

export type DemoResumeId = "bilal-backend" | "aisha-backend";

/** The pre-baked resumes available, in demo display order (weak → strong). */
export const DEMO_RESUME_IDS: DemoResumeId[] = ["bilal-backend", "aisha-backend"];

type AnalysisSampleMap = Record<DemoResumeId, AnalysisResult>;

interface CannedAnswer {
  patterns: string[];
  answer: string;
  suggestedFollowups: string[];
}
interface MentorAnswerData {
  default: { answer: string; suggestedFollowups: string[] };
  answers: CannedAnswer[];
}

const samples = analysisSamples as unknown as AnalysisSampleMap;
const mentor = mentorAnswers as unknown as MentorAnswerData;

/** Structured-clone fallback so callers can mutate without poisoning the cache. */
function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Return a fresh, mutation-safe copy of a pre-baked AnalysisResult.
 * @throws if an unknown resume id is requested (programmer error).
 */
export function getDemoAnalysis(resumeId: DemoResumeId): AnalysisResult {
  const sample = samples[resumeId];
  if (!sample) {
    throw new Error(`Unknown demo resume id: ${resumeId}`);
  }
  return deepCopy(sample);
}

/** Normalize a question for fuzzy matching: lowercase, strip punctuation, collapse spaces. */
function normalize(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fuzzy-match a question against the canned grounded answers.
 * Returns the best match, or a sensible grounded default so the demo never blanks.
 * Returns null ONLY when the question is empty/whitespace.
 */
export function getDemoMentorAnswer(question: string): MentorResponse | null {
  const normalized = normalize(question);
  if (!normalized) return null;

  let best: { answer: CannedAnswer; score: number } | null = null;
  for (const answer of mentor.answers) {
    for (const pattern of answer.patterns) {
      const p = normalize(pattern);
      if (!p) continue;
      if (normalized.includes(p)) {
        // Prefer the most specific (longest) matching pattern.
        if (!best || p.length > best.score) best = { answer, score: p.length };
      }
    }
  }

  const chosen = best?.answer ?? mentor.default;
  return {
    answer: chosen.answer,
    usedGrounding: true,
    suggestedFollowups: [...chosen.suggestedFollowups],
  };
}

/** Everything the app needs to render the dashboard AND ground the mentor offline. */
export interface DemoSeed {
  analysis: AnalysisResult;
  structuredResume: StructuredResume;
  rawResumeText: string;
}

/**
 * Build a complete offline seed for a pre-baked resume.
 * The structuredResume mirrors the matched skills so useMentorChat's
 * `!structuredResume` guard passes and grounding stays consistent.
 */
export function buildDemoSeed(resumeId: DemoResumeId): DemoSeed {
  const analysis = getDemoAnalysis(resumeId);
  const structuredResume: StructuredResume = {
    skills: [...analysis.matchObject.have],
    projects: [],
    experience: [],
    education: [],
  };
  return { analysis, structuredResume, rawResumeText: "" };
}

/** Pick which pre-baked resume to serve as a fallback, biased to the lead contrast demo. */
export function pickDemoResumeId(opts: { fileName?: string | null }): DemoResumeId {
  const name = (opts.fileName ?? "").toLowerCase();
  if (name.includes("aisha")) return "aisha-backend";
  return "bilal-backend";
}
