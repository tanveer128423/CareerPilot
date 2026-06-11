# Phase 3 — Resume Parsing

## Objective
Turn raw text into a validated `StructuredResume` using the existing `resumeParser.ts` (deterministic-first, Gemini fallback) and finalize the `/api/parse` contract.

## Files to create
```
server/src/services/geminiStructurer.ts          (implements GeminiStructurer using Prompt 1)
server/src/controllers/parseController.ts         (FINALIZE)
```

## Acceptance criteria
- [ ] `/api/parse` returns schema-valid `{ targetRole, structuredResume, rawResumeText }`.
- [ ] Skills normalized to canonical names (node → Node.js).
- [ ] Gemini fallback only fires on sparse resumes (normal resume = no AI call).
- [ ] `rawResumeText` present, ≤ 8000 chars, as a SIBLING of structuredResume.

## Exact Copilot prompt
```
Finalize CareerPilot resume parsing. The deterministic parser already exists at
server/src/services/resumeParser.ts and exports:
  default parseResume(rawText, options?: { structurer?: GeminiStructurer, forceGemini?: boolean })
  and the GeminiStructurer interface: { structure(rawText): Promise<Omit<StructuredResume,"rawTextLength">> }.
Do NOT modify resumeParser.ts. Follow PROMPTS.md §1 (Resume Structuring) and SCHEMAS.md #4.

Create:

1) server/src/services/geminiStructurer.ts
   - export const geminiStructurer: GeminiStructurer = { async structure(rawText) {...} }.
   - Build the Resume-Structuring prompt from PROMPTS.md §1 (normalize skills, extract
     skills/projects/experience/education, output ONLY JSON).
   - Call callGemini({ prompt, jsonMode:true, temperature:0.1, timeoutMs: CONFIG.GEMINI_TIMEOUT_ANALYZE }).
   - Parse with jsonGuard; if invalid, throw AppError("AI_BAD_JSON", ..., {status:502, retryable:true}).
   - Return the parsed object (skills, projects, experience, education).

2) server/src/controllers/parseController.ts  (replace the Phase-2 stub)
   - Validate file + targetRole exactly as before.
   - rawResumeText = extractText(...).slice(0, CONFIG.RAW_TEXT_LIMIT).
   - const structuredResume = await parseResume(rawResumeText, { structurer: geminiStructurer }).
   - Validate structuredResume against the StructuredResume schema via validators.ts;
     on failure throw AppError("INTERNAL_ERROR").
   - Respond 200 with { targetRole, structuredResume, rawResumeText }.
   - rawResumeText is a SIBLING — never place it inside structuredResume.

Generate complete TypeScript. Keep the controller thin.
```
