/**
 * geminiStructurer.ts
 *
 * GeminiStructurer implementation (PROMPTS.md §1 — Resume Structuring). Used only
 * as the FALLBACK path of resumeParser when deterministic parsing is insufficient
 * (sparse/unusual resumes). Builds the strict structuring prompt, calls Gemini in
 * JSON mode at low temperature, and parses the response defensively.
 *
 * @module services/geminiStructurer
 */

import { callGemini } from "./geminiClient.js";
import { CONFIG } from "../config.js";
import { AppError } from "../utils/AppError.js";
import { safeParseJson } from "../utils/jsonGuard.js";
import type { GeminiStructurer, StructuredResume } from "./resumeParser.js";

type StructuredOut = Omit<StructuredResume, "rawTextLength">;

const SYSTEM_PROMPT = `You are CareerPilot's resume parser. You convert raw resume text into structured JSON.

GLOBAL RULES:
1. Output ONLY valid JSON matching the schema. No markdown, no prose, no code fences.
2. NEVER invent skills, projects, experience, or education not present in the text.
3. Extract ONLY what is explicitly stated. If a field is absent, use an empty array.
4. Normalize skill names to canonical forms:
   - "node", "nodejs", "node js" -> "Node.js"
   - "express", "expressjs" -> "Express.js"
   - "react.js", "reactjs" -> "React"
   - "mongo", "mongodb" -> "MongoDB"
   - "js" -> "JavaScript"; "ts" -> "TypeScript"
   - Preserve standard casing for others (e.g., "Git", "SQL", "Docker").
5. Deduplicate skills. Do not include soft skills unless explicitly relevant tools.
6. For each project, capture name, the technologies used (tech[]), and a 1-sentence summary.
7. Keep string fields within limits: project/summary <= 500 chars, names <= 120 chars.
8. Use exact schema keys. No extra keys.`;

function buildUserPrompt(rawResumeText: string): string {
  return `Extract a StructuredResume from the resume text below.

RESUME TEXT:
"""
${rawResumeText}
"""

Return JSON ONLY in this exact shape:
{
  "skills": string[],
  "projects": [{ "name": string, "tech": string[], "summary": string }],
  "experience": [{ "title": string, "org": string, "duration": string, "summary": string }],
  "education": [{ "degree": string, "institution": string, "year": string }]
}`;
}

/** Create a structurer bound to an optional per-request API key. */
export function createGeminiStructurer(apiKey?: string): GeminiStructurer {
  return {
    async structure(rawText: string): Promise<StructuredOut> {
      const raw = await callGemini({
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(rawText),
        jsonMode: true,
        temperature: 0.1,
        timeoutMs: CONFIG.GEMINI_TIMEOUT_ANALYZE,
        retries: CONFIG.GEMINI_RETRIES,
        apiKey,
      });

      const parsed = safeParseJson<Partial<StructuredOut>>(raw);
      if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null) {
        throw new AppError("AI_BAD_JSON", "The AI returned an unreadable response. Please try again.", {
          status: 502,
          retryable: true,
        });
      }

      const v = parsed.value;
      return {
        skills: Array.isArray(v.skills) ? v.skills : [],
        projects: Array.isArray(v.projects) ? v.projects : [],
        experience: Array.isArray(v.experience) ? v.experience : [],
        education: Array.isArray(v.education) ? v.education : [],
      };
    },
  };
}

/** Default structurer using the server env key (back-compat). */
export const geminiStructurer: GeminiStructurer = createGeminiStructurer();

export default geminiStructurer;
