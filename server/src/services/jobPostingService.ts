/**
 * jobPostingService.ts
 *
 * Turns a pasted job-description into a structured, deterministic-engine-ready
 * role definition. Gemini extracts ONLY the requirements stated in the posting;
 * the result has the EXACT same shape as a `roles.json` entry, so the existing
 * match / readiness / roadmap engine consumes it unchanged.
 *
 * This is the only AI involved — once the role is extracted, every downstream
 * number is still computed deterministically against the user's real resume.
 *
 * @module services/jobPostingService
 */

import { callGemini } from "./geminiClient.js";
import { CONFIG } from "../config.js";
import { AppError } from "../utils/AppError.js";
import { safeParseJson } from "../utils/jsonGuard.js";
import type { RoleDefinition } from "./matchService.js";

export interface ExtractedJobRole {
  role: RoleDefinition;
  title: string;
  company: string;
}

const SYSTEM_PROMPT = `You are CareerPilot's job-posting analyzer. You convert a raw job description into structured JSON describing what the role requires.

RULES:
1. Output ONLY valid JSON. No markdown, no prose, no code fences.
2. Extract ONLY requirements explicitly stated or strongly implied by the posting. NEVER invent skills the posting doesn't mention.
3. "required" = must-have / core technical skills (hard requirements). "niceToHave" = preferred / bonus / "plus" skills.
4. Normalize skill names to standard, recognizable forms:
   - "node"/"nodejs" -> "Node.js"; "react.js" -> "React"; "postgres" -> "PostgreSQL"; "js" -> "JavaScript"; "ts" -> "TypeScript"; "k8s" -> "Kubernetes".
   - Prefer concise technology/skill names (1-3 words). No full sentences.
5. Deduplicate. Limit "required" to the 6-10 most important skills and "niceToHave" to at most 8.
6. "keywords" = 6-8 domain/role terms from the posting (e.g., "microservices", "scale", "CI/CD").
7. If the title or company is not stated, use "" (empty string).`;

function buildUserPrompt(jobText: string): string {
  return `Analyze the job posting below and extract its requirements.

JOB POSTING:
"""
${jobText}
"""

Return JSON ONLY in this exact shape:
{
  "title": string,
  "company": string,
  "required": string[],
  "niceToHave": string[],
  "keywords": string[]
}`;
}

/** Clean an arbitrary array into deduped, trimmed, length-capped strings. */
function cleanStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const s = item.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

/** Build a human-friendly, ≤60-char role name from title + company. */
function composeRoleName(title: string, company: string): string {
  const t = title || "Target Role";
  const name = company ? `${t} · ${company}` : t;
  return name.slice(0, 60);
}

/**
 * Extract a structured role from a pasted job description.
 *
 * @param jobText - The raw job-description text (already length-validated).
 * @param apiKey - Optional per-request Gemini key from the UI.
 * @returns The structured role plus parsed title/company.
 * @throws AppError("AI_BAD_JSON") if the model output can't be parsed.
 * @throws AppError("VALIDATION_ERROR") if no usable required skills were found.
 */
export async function extractRoleFromJobPosting(
  jobText: string,
  apiKey?: string,
): Promise<ExtractedJobRole> {
  const raw = await callGemini({
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(jobText),
    jsonMode: true,
    temperature: 0.1,
    timeoutMs: CONFIG.GEMINI_TIMEOUT_ANALYZE,
    retries: CONFIG.GEMINI_RETRIES,
    apiKey,
  });

  const parsed = safeParseJson<Record<string, unknown>>(raw);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null) {
    throw new AppError("AI_BAD_JSON", "Couldn't read the job posting. Please try again.", {
      status: 502,
      retryable: true,
    });
  }

  const v = parsed.value;
  const title = cleanText(v.title, 60);
  const company = cleanText(v.company, 40);
  const required = cleanStringArray(v.required, 10);
  const niceToHave = cleanStringArray(v.niceToHave, 8);
  const keywords = cleanStringArray(v.keywords, 8);

  if (required.length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "No clear required skills were found in that job posting. Try pasting the full description.",
      { status: 400, retryable: false },
    );
  }

  const role: RoleDefinition = {
    id: "custom-job-posting",
    name: composeRoleName(title, company),
    required,
    niceToHave,
    keywords,
  };

  return { role, title, company };
}

export default extractRoleFromJobPosting;
