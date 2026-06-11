# Phase 7 — Mentor Chat

## Objective
Implement the grounded, **non-streaming** `/api/mentor` endpoint using `mentorPromptBuilder.ts` + `geminiClient`.

## Files to create
```
server/src/services/mentorService.ts
server/src/controllers/mentorController.ts
server/tests/mentorPromptBuilder.test.ts
```

## Acceptance criteria
- [ ] "What should I learn next?" cites top missing skill + roadmap[0].
- [ ] "Am I ready?" cites readiness.score + breakdown + have/missing.
- [ ] Off-plan skill (Kubernetes) → declined; fake certification → refused.
- [ ] Single validated `MentorResponse` JSON (no streaming).
- [ ] Empty/oversized question → `400 VALIDATION_ERROR`.

## Exact Copilot prompt
```
Build CareerPilot's Mentor Chat. NON-STREAMING. Existing builder (do NOT modify):
  mentorPromptBuilder.ts -> default buildMentorSystemPrompt(input: MentorPromptInput): string
  where MentorPromptInput = { structuredResume, matchObject, resumeHealthReport,
  careerReadiness, roadmap }.
Also available (do NOT modify): analysisService.ts (analyzeResumeHealth),
  readinessService.ts (computeReadiness), roadmapService.ts (generateRoadmap), roles.json.
Follow API_CONTRACTS.md §5 and SCHEMAS.md #13/#14. COPILOT_INSTRUCTIONS Golden Rule: no SSE.

CRITICAL — GROUNDING SHAPE:
  The client only sends DETERMINISTIC inputs it actually has:
    grounding = { targetRole, structuredResume, matchObject, rawResumeText }.
  The client does NOT send resumeHealthReport, careerReadiness, or roadmap (it never received
  the internal resumeHealthReport shape from /analyze). mentorService MUST reconstruct the
  full MentorPromptInput SERVER-SIDE from these four inputs before building the prompt.
  Do not require the client to supply internal analysis shapes.

Create:

1) server/src/services/mentorService.ts
   - export async function answerMentor({ question, history, grounding }):
       Promise<{ answer, usedGrounding, suggestedFollowups }>.
   - grounding = { targetRole, structuredResume, matchObject, rawResumeText }.
   - RECONSTRUCT the internal shapes deterministically (no Gemini, no network):
       const selectedRole = roles.json role whose name === grounding.targetRole
         (or grounding.matchObject.role).
       const resumeHealthReport = analyzeResumeHealth({
         structuredResume: grounding.structuredResume,
         matchObject: grounding.matchObject,
         rawResumeText: grounding.rawResumeText });
       const careerReadiness = computeReadiness({
         structuredResume: grounding.structuredResume,
         matchObject: grounding.matchObject,
         resumeHealthReport, selectedRole });
       const roadmap = generateRoadmap({ matchObject: grounding.matchObject });
   - const mentorInput = { structuredResume: grounding.structuredResume,
       matchObject: grounding.matchObject, resumeHealthReport, careerReadiness, roadmap };
   - const system = buildMentorSystemPrompt(mentorInput).
   - Build the user turn from history (truncate to CONFIG.MAX_HISTORY) + the new question.
   - Instruct Gemini to return ONLY JSON: { "answer": string, "usedGrounding": boolean,
     "suggestedFollowups": string[0..3] }.
   - call callGemini({ system, prompt, jsonMode:true, temperature:0.6,
     timeoutMs: CONFIG.GEMINI_TIMEOUT_MENTOR }).
   - Parse with jsonGuard; validate against MentorResponse schema; on failure repair+retry once,
     else throw AppError("AI_BAD_JSON", {status:502, retryable:true}).

2) server/src/controllers/mentorController.ts
   - export async function postMentor(req, res, next).
   - Validate: question is string, 1..CONFIG.QUESTION_MAX chars (else VALIDATION_ERROR 400);
     grounding present with { targetRole, structuredResume, matchObject, rawResumeText };
     grounding.targetRole (or grounding.matchObject.role) in SUPPORTED_ROLES (else INVALID_ROLE);
     grounding.structuredResume.skills is a non-empty array (else VALIDATION_ERROR);
     history (if present) is an array of {role:'user'|'mentor', text}.
   - const result = await answerMentor({ question, history: history ?? [], grounding }).
   - Respond 200 with result. Stateless — server stores no chat state.
   - NOTE: this leaves the public API contract unchanged — grounding still carries deterministic
     fields only; the internal resumeHealthReport/careerReadiness/roadmap are rebuilt server-side.

3) Wire POST /api/mentor in routes/index.ts.

4) server/tests/mentorPromptBuilder.test.ts (vitest):
   - Build a sample grounding (Bilal: missing Node.js/Express.js/REST APIs/MongoDB, readiness 40).
   - Assert the system prompt string CONTAINS: "MISSING", "MongoDB", "40/100",
     "NEVER invent skills", and the roadmap phase "Week 1-4".
   - Assert it does NOT contain a user name.

Generate complete TypeScript. Never stream; always return one validated JSON object.
```
