/**
 * mentorService.ts
 *
 * Grounded, NON-STREAMING AI Career Mentor.
 *
 * The client sends only DETERMINISTIC inputs it actually has
 * ({ targetRole, structuredResume, matchObject, rawResumeText }). This service
 * reconstructs the internal analysis shapes (resume health, readiness, roadmap)
 * SERVER-SIDE — with no AI and no network — then builds the strict grounded
 * system prompt and asks Gemini for a single validated MentorResponse JSON.
 *
 * @module services/mentorService
 */

import { callGemini } from "./geminiClient.js";
import { CONFIG, type RoleName } from "../config.js";
import { AppError } from "../utils/AppError.js";
import { safeParseJson } from "../utils/jsonGuard.js";
import { validate } from "../utils/validators.js";
import buildMentorSystemPrompt from "./mentorPromptBuilder.js";
import analyzeResumeHealth from "./analysisService.js";
import computeReadiness from "./readinessService.js";
import generateRoadmap from "./roadmapService.js";
import type { MatchObject, RoleDefinition } from "./matchService.js";
import type { StructuredResume } from "./resumeParser.js";
import rolesData from "../data/roles.json" with { type: "json" };

const ROLES = (rolesData as { roles: RoleDefinition[] }).roles;

export interface MentorMessage {
  role: "user" | "mentor";
  text: string;
}

export interface MentorGrounding {
  targetRole?: RoleName | string;
  structuredResume: { skills: string[]; projects?: unknown; experience?: unknown; education?: unknown };
  matchObject: MatchObject;
  rawResumeText?: string;
}

export interface AnswerMentorInput {
  question: string;
  history?: MentorMessage[];
  grounding: MentorGrounding;
  /** Optional per-request Gemini API key supplied by the user via the UI. */
  apiKey?: string;
}

export interface MentorResponse {
  answer: string;
  usedGrounding: boolean;
  suggestedFollowups: string[];
}

/** Build a full StructuredResume from the grounding's (loose) resume slice. */
function normalizeResume(sr: MentorGrounding["structuredResume"], rawLen: number): StructuredResume {
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    skills: Array.isArray(sr?.skills) ? sr.skills : [],
    projects: arr(sr?.projects),
    experience: arr(sr?.experience),
    education: arr(sr?.education),
    rawTextLength: rawLen,
  };
}

/** Compose the user-turn prompt from prior history + the new question. */
function buildUserPrompt(history: MentorMessage[], question: string): string {
  const recent = history.slice(-CONFIG.MAX_HISTORY);
  const convo = recent.length
    ? recent
        .map((m) => `${m.role === "mentor" ? "Mentor" : "User"}: ${m.text}`)
        .join("\n")
    : "(no prior conversation)";

  return [
    "CONVERSATION SO FAR:",
    convo,
    "",
    "USER'S NEW QUESTION:",
    `"""${question}"""`,
    "",
    "Respond with ONLY a JSON object (no markdown, no code fences) in this exact shape:",
    `{ "answer": string (2-6 sentences, grounded in the ALLOWED DATA), "usedGrounding": boolean, "suggestedFollowups": string[] (0-3 items, each <= 120 chars) }`,
  ].join("\n");
}

/** Coerce an untrusted parsed object into a clamped MentorResponse candidate. */
function coerce(value: unknown): MentorResponse {
  const v = (value ?? {}) as Partial<MentorResponse>;
  const followups = Array.isArray(v.suggestedFollowups)
    ? v.suggestedFollowups
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 120))
        .slice(0, 3)
    : [];
  return {
    answer: typeof v.answer === "string" ? v.answer.trim().slice(0, 4000) : "",
    usedGrounding: typeof v.usedGrounding === "boolean" ? v.usedGrounding : true,
    suggestedFollowups: followups,
  };
}

/** Parse + coerce + schema-validate a raw Gemini reply. Returns null on failure. */
function parseValidReply(raw: string): MentorResponse | null {
  const parsed = safeParseJson(raw);
  if (!parsed.ok) return null;
  const candidate = coerce(parsed.value);
  const { valid } = validate("MentorResponse", candidate);
  return valid ? candidate : null;
}

/**
 * Answer a mentor question, fully grounded in deterministic engine outputs.
 *
 * @throws AppError("AI_BAD_JSON") when the model fails to return valid JSON twice.
 */
export async function answerMentor(input: AnswerMentorInput): Promise<MentorResponse> {
  const { question, history = [], grounding, apiKey } = input;

  // --- Reconstruct internal shapes server-side (no AI, no network) ---
  const roleName = grounding.targetRole ?? grounding.matchObject?.role;
  // Prefer a known role from roles.json; otherwise synthesize one from the
  // deterministic matchObject so CUSTOM roles (parsed from a pasted job
  // posting) are fully supported by the grounded mentor too.
  const selectedRole: RoleDefinition =
    ROLES.find((r) => r.name === roleName) ??
    (grounding.matchObject
      ? {
          id: "custom-job-posting",
          name: grounding.matchObject.role || String(roleName ?? "Target Role"),
          required: grounding.matchObject.requiredSkills ?? [],
          niceToHave: grounding.matchObject.niceToHaveSkills ?? [],
          keywords: [],
        }
      : (null as unknown as RoleDefinition));
  if (!selectedRole) {
    throw new AppError("INVALID_ROLE", "Unsupported target role for the mentor.");
  }

  const rawResumeText = typeof grounding.rawResumeText === "string" ? grounding.rawResumeText : "";
  const structuredResume = normalizeResume(grounding.structuredResume, rawResumeText.length);
  const matchObject = grounding.matchObject;

  const resumeHealthReport = analyzeResumeHealth({
    structuredResume: structuredResume as never,
    matchObject,
    rawResumeText,
  });
  const careerReadiness = computeReadiness({
    structuredResume,
    matchObject,
    resumeHealthReport,
    selectedRole,
  });
  const roadmap = generateRoadmap({ matchObject });

  const system = buildMentorSystemPrompt({
    structuredResume,
    matchObject,
    resumeHealthReport,
    careerReadiness,
    roadmap,
  });
  const prompt = buildUserPrompt(history, question);

  // --- Single call, with one repair/retry on unparseable JSON ---
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGemini({
      system,
      prompt,
      jsonMode: true,
      temperature: 0.6,
      timeoutMs: CONFIG.GEMINI_TIMEOUT_MENTOR,
      apiKey,
    });
    const result = parseValidReply(raw);
    if (result) return result;
  }

  throw new AppError("AI_BAD_JSON", "The mentor returned an unreadable response. Please try again.", {
    status: 502,
    retryable: true,
  });
}

export default answerMentor;
