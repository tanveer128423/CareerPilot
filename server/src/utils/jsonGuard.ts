/**
 * jsonGuard.ts
 *
 * Defensive JSON parsing for LLM output. Strips Markdown code fences, removes
 * trailing commas, and attempts JSON.parse. Returns a discriminated result so
 * callers can repair or throw AI_BAD_JSON without try/catch noise.
 *
 * @module utils/jsonGuard
 */

export type SafeParseResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false };

/**
 * Repair common LLM JSON defects:
 *  - ```json ... ``` / ``` ... ``` code fences
 *  - leading/trailing prose around the JSON body
 *  - trailing commas before } or ]
 */
export function repair(text: string): string {
  if (typeof text !== "string") return "";
  let out = text.trim();

  // Strip code fences (```json ... ``` or ``` ... ```).
  out = out.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // Extract the outermost JSON object/array if surrounded by prose.
  const firstObj = out.indexOf("{");
  const firstArr = out.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);

  if (start > 0) {
    const lastObj = out.lastIndexOf("}");
    const lastArr = out.lastIndexOf("]");
    const end = Math.max(lastObj, lastArr);
    if (end > start) out = out.slice(start, end + 1);
  }

  // Remove trailing commas before closing braces/brackets.
  out = out.replace(/,(\s*[}\]])/g, "$1");

  return out.trim();
}

/** Try to parse text as JSON, repairing common defects first. */
export function safeParseJson<T = unknown>(text: string): SafeParseResult<T> {
  if (typeof text !== "string" || text.trim() === "") return { ok: false };

  // First, try the raw text.
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    // fall through to repair
  }

  try {
    const repaired = repair(text);
    return { ok: true, value: JSON.parse(repaired) as T };
  } catch {
    return { ok: false };
  }
}

export default safeParseJson;
