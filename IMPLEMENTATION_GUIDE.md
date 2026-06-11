# CareerPilot — Implementation Guide (Copilot Build Order)

**Author:** Principal Software Architect
**Audience:** GitHub Copilot + the solo developer
**Stack:** React + TypeScript (Vite) · Express + Node.js + TypeScript · Gemini API
**Authoritative specs:** `API_CONTRACTS.md` · `SCHEMAS.md` · `COPILOT_INSTRUCTIONS.md` · `ARCHITECTURE.md` · `UI.md`

> **How to use this guide:** Build phases **in order**. Do not start a phase until the previous phase's acceptance criteria pass. The deterministic engine (parser, match, analysis, readiness, roadmap, mentor prompt) is **already complete** under `server/src/services/` — phases wire HTTP + UI around it. Copilot must follow `COPILOT_INSTRUCTIONS.md` Golden Rules at all times (no auth, no DB, session-only, stateless backend, standard error envelope, Ajv validation, deterministic match before AI).

### Already completed (do NOT regenerate)
```
server/src/data/roles.json
server/src/data/skillAliases.json
server/src/services/resumeParser.ts        (parseResume + extractors)
server/src/services/matchService.ts        (generateMatchObject — deterministic)
server/src/services/analysisService.ts     (analyzeResumeHealth + toSchemaHealth)
server/src/services/readinessService.ts    (computeReadiness)
server/src/services/roadmapService.ts      (generateRoadmap)
server/src/services/mentorPromptBuilder.ts (buildMentorSystemPrompt)
```

### Global dependencies (install once, Phase 1)
```
# server
express cors multer ajv ajv-formats @google/generative-ai dotenv
# server (dev)
typescript tsx @types/node @types/express @types/cors @types/multer vitest supertest
# pdf/docx text extraction
pdf-parse mammoth
# client (Phase 8)
react react-dom react-router-dom
# client (dev)
vite @vitejs/plugin-react typescript tailwindcss postcss autoprefixer
lucide-react framer-motion
```

### Build-order principle (risk-ordered)
Skill Gap (the differentiator) and the readiness/mentor core are built and hardened before the most-forgivable Resume Health surface. The engine already enforces this; phases below respect it.

---

## Phase 1 — Backend Foundation

**Goal:** A running, stateless Express server with config, error envelope, Gemini client, Ajv validators, and `/api/health` + `/api/roles`.

### Files to create
```
server/package.json                      # scripts: dev (tsx watch), build, start, test
server/tsconfig.json                     # resolveJsonModule:true, esModuleInterop:true, strict:true
server/.env.example                      # GEMINI_API_KEY, PORT, ALLOWED_ORIGIN
server/src/server.ts                     # entry: middleware + route mount + listen
server/src/config.ts                     # central constants from API_CONTRACTS Appendix C
server/src/middleware/errorHandler.ts    # central error -> standard envelope
server/src/middleware/upload.ts          # multer memory storage, 5MB, pdf/docx only
server/src/utils/AppError.ts             # typed error factory (code,message,retryable,status)
server/src/utils/logger.ts               # redacting logger (no PII / no keys)
server/src/utils/jsonGuard.ts            # safe-parse + repair LLM JSON
server/src/utils/validators.ts           # Ajv compiled validators from SCHEMAS.md
server/src/services/geminiClient.ts      # Gemini wrapper: timeout, retry x2, JSON mode
server/src/routes/index.ts               # mounts /api/*
server/src/controllers/healthController.ts
server/src/controllers/rolesController.ts
```

### APIs to create
| Method | Endpoint | Returns |
|--------|----------|---------|
| `GET` | `/api/health` | `{ ok, service, version, geminiConfigured, timestamp }` |
| `GET` | `/api/roles` | `{ roles: RoleEntry[] }` (from `roles.json`) |

### Dependencies
`express cors dotenv ajv ajv-formats @google/generative-ai` (+ dev: `typescript tsx @types/*`).

### Key rules
- Middleware order: `cors(ALLOWED_ORIGIN) → express.json({limit:'1mb'})` → routes → `errorHandler` (last).
- `config.ts` holds: `MAX_FILE_SIZE=5MB`, `MAX_BODY=1MB`, `MIN_TEXT=50`, `GEMINI_TIMEOUT_ANALYZE=20000`, `GEMINI_TIMEOUT_MENTOR=15000`, `RETRIES=2`, `MAX_HISTORY=20`, `QUESTION_MAX=500`, `RAW_TEXT_LIMIT=8000`, `SUPPORTED_ROLES`.
- `AppError` never leaks stack traces; `errorHandler` maps to `{ error:{code,message,retryable,details} }` with the right HTTP status.
- `geminiClient` sets `responseMimeType:"application/json"`, applies timeout + exponential-backoff retry, and routes malformed JSON through `jsonGuard.repair()`.

### Acceptance criteria
- [ ] `npm run dev` starts the server with no errors.
- [ ] `GET /api/health` → 200 with `geminiConfigured:true` when key set.
- [ ] `GET /api/roles` → 200 listing all 6 roles with `required/niceToHave/keywords`.
- [ ] Any thrown error returns the standard envelope (verify by forcing one).
- [ ] No DB, no auth, no session store anywhere.

---

## Phase 2 — Resume Upload

**Goal:** Accept a PDF/DOCX upload, extract raw text, and return it (no parsing yet). Establishes the multipart path + text-extraction.

### Files to create
```
server/src/services/textExtractor.ts     # buffer (pdf/docx) -> raw text via pdf-parse / mammoth
server/src/controllers/parseController.ts # (stub) validates file+role, extracts text
```
(Reuses `middleware/upload.ts` from Phase 1.)

### APIs to create
| Method | Endpoint | Body | Returns (this phase) |
|--------|----------|------|----------------------|
| `POST` | `/api/parse` | multipart: `file`, `targetRole` | `{ targetRole, rawResumeText }` (temporary) |

### Dependencies
`multer pdf-parse mammoth`.

### Validation (from API_CONTRACTS §3)
- Missing file → `400 MISSING_FILE`.
- Wrong MIME (not `application/pdf` / DOCX) → `415 UNSUPPORTED_FILE_TYPE`.
- > 5 MB → `413 FILE_TOO_LARGE`.
- `targetRole` not in enum → `400 INVALID_ROLE`.
- Extracted text < 50 chars → `422 PARSE_FAILED`.

### Key rules
- `textExtractor` chooses by MIME: `pdf-parse` for PDF, `mammoth` for DOCX.
- File is processed **in memory** and discarded immediately (privacy — never write to disk).
- `rawResumeText` is truncated to `RAW_TEXT_LIMIT` (8000) for downstream use, kept as a **sibling** of `structuredResume` (never inside it).

### Acceptance criteria
- [ ] Uploading a text-based PDF returns ≥ 50 chars of `rawResumeText`.
- [ ] Uploading a DOCX works via `mammoth`.
- [ ] A scanned/empty PDF → `422 PARSE_FAILED` with a friendly message.
- [ ] A `.png`/oversized file → `415` / `413` respectively.
- [ ] Uploaded buffer is never persisted to disk.

---

## Phase 3 — Resume Parsing

**Goal:** Turn raw text into a validated `StructuredResume` using the existing `resumeParser.ts` (deterministic-first, Gemini fallback), and finalize the `/api/parse` contract.

### Files to create / update
```
server/src/services/geminiStructurer.ts   # implements GeminiStructurer (Prompt 1) via geminiClient
server/src/controllers/parseController.ts  # FINALIZE: extract -> parseResume(text,{structurer}) -> validate
```
(Uses existing `resumeParser.ts`. Add the Resume-Structuring prompt from `PROMPTS.md §1` inside `geminiStructurer`.)

### APIs to finalize
| Method | Endpoint | Returns (final) |
|--------|----------|-----------------|
| `POST` | `/api/parse` | `{ targetRole, structuredResume, rawResumeText }` (matches `ParseResponse`) |

### Dependencies
None new (reuses `geminiClient`, `pdf-parse`, `mammoth`).

### Key rules
- Call `parseResume(rawText, { structurer })`; deterministic parsing runs first, Gemini only fills gaps when `isSufficient` is false.
- Validate output against `StructuredResume` (SCHEMAS #4) with Ajv before returning.
- Attach `rawResumeText` as a sibling; never mutate `StructuredResume` to hold it.

### Acceptance criteria
- [ ] `/api/parse` returns a schema-valid `structuredResume` for a real resume.
- [ ] Skills are normalized to canonical names (e.g., "node" → "Node.js").
- [ ] Projects/experience/education populate when present; empty arrays otherwise.
- [ ] Gemini fallback only triggers on sparse resumes (verify deterministic path runs without an API call on a normal resume).
- [ ] `rawResumeText` present and ≤ 8000 chars.

---

## Phase 4 — Skill Gap Analysis ⭐ (the differentiator — most test coverage)

**Goal:** Deterministically compute the `matchObject` and expose it. This is the trust-defining feature; it must be flawless and well-tested.

### Files to create
```
server/src/controllers/analyzeController.ts  # (begin) validates body, runs matchService FIRST
server/tests/matchService.test.ts            # Priority-1 unit tests (alias + coverage)
```
(Uses existing `matchService.ts` + `skillAliases.json` + `roles.json`.)

### APIs to begin
| Method | Endpoint | Body | Returns (this phase) |
|--------|----------|------|----------------------|
| `POST` | `/api/analyze` | `{ targetRole, structuredResume, rawResumeText? }` | partial: `{ targetRole, matchObject }` |

### Dependencies
`vitest` (tests). No runtime deps.

### Key rules
- `matchService.generateMatchObject(targetRole, structuredResume.skills)` runs **before any AI**.
- The server injects `targetRole` + `matchObject` into the final result; AI never decides `have`/`missing`.
- Alias resolution must be symmetric and case/punctuation-insensitive.

### Acceptance criteria (tests required)
- [ ] `have ∪ missing === role.required`; `have ∩ missing === ∅`.
- [ ] `"node"`, `"NODE.JS"`, `"Express JS"` resolve to `"Node.js"` / `"Express.js"`.
- [ ] `coveragePercentage` correct (e.g., 5/6 → 83).
- [ ] Unknown role → `400 INVALID_ROLE`.
- [ ] No skill the resume clearly lists is ever shown as ❌ (golden-resume test).

---

## Phase 5 — Readiness Score

**Goal:** Add the Resume Health + Career Readiness computation into `/api/analyze` using the existing services.

### Files to create / update
```
server/src/controllers/analyzeController.ts  # add health + readiness to the pipeline
server/tests/readinessService.test.ts        # breakdown sums to score; no double-count
```
(Uses existing `analysisService.ts` → `analyzeResumeHealth` + `toSchemaHealth`, and `readinessService.ts` → `computeReadiness`.)

### APIs to extend
`POST /api/analyze` now returns: `{ targetRole, matchObject, resumeHealth, readiness }`.

### Dependencies
None new.

### Key rules
- Order inside controller: `matchObject` → `analyzeResumeHealth({structuredResume, matchObject, rawResumeText})` → `computeReadiness({structuredResume, matchObject, resumeHealthReport, selectedRole})`.
- Readiness weights fixed: technicalSkills 35 / projects 25 / experience 20 / resumeHealth 10 / roleAlignment 10. **No `skillGaps` term** (no double-count).
- Map internal health to API shape via `toSchemaHealth` (5 dimensions `{key,label,score,reason,tip}`).
- Use `rawResumeText` for formatting + impactMetrics only; absent → neutral 60 with stated limitation.

### Acceptance criteria
- [ ] `resumeHealth` has exactly 5 dimensions, each with a non-empty `reason` + `tip`.
- [ ] `readiness.scoreBreakdown` sums exactly to `readiness.score`.
- [ ] Skill coverage appears once (technicalSkills only) — verified by test.
- [ ] Every `nextAction` references a missing skill / weak project / weak experience (no generic advice).
- [ ] Empty resume → low scores, never a crash or divide-by-zero.

---

## Phase 6 — Roadmap Generation

**Goal:** Add the 24-week roadmap to `/api/analyze`, completing the full `AnalysisResult`.

### Files to create / update
```
server/src/controllers/analyzeController.ts  # add roadmap; assemble final AnalysisResult
server/tests/roadmapService.test.ts          # every milestone maps to a missing skill
```
(Uses existing `roadmapService.ts` → `generateRoadmap`.)

### APIs to finalize
`POST /api/analyze` returns the complete result:
`{ targetRole, matchObject, resumeHealth, readiness, roadmap }` (validate against `AnalysisResult`, SCHEMAS #15).

### Dependencies
None new.

### Key rules
- `generateRoadmap({ matchObject })` — fixed 24 weeks, 4-week phases, ≤ 6 milestones.
- Every milestone's `gapAddressed` must be in `matchObject.missing`.
- No missing skills → empty roadmap (caller renders a "gaps closed" state).
- Validate the assembled `AnalysisResult` with Ajv before returning; on failure → `AI_BAD_JSON`/`INTERNAL_ERROR` per source.

### Acceptance criteria
- [ ] `/api/analyze` returns a schema-valid full `AnalysisResult` end-to-end in < 30s.
- [ ] Every roadmap milestone's gap ∈ `missing`.
- [ ] Roadmap ordering follows the deterministic learning sequence.
- [ ] `durationWeeks` is fixed at 24 (no request field, no selector).

---

## Phase 7 — Mentor Chat

**Goal:** Implement the grounded, **non-streaming** mentor endpoint using `mentorPromptBuilder.ts` + `geminiClient`.

### Files to create
```
server/src/services/mentorService.ts       # builds system prompt + calls Gemini + validates reply
server/src/controllers/mentorController.ts  # validates request, truncates history, returns MentorResponse
server/tests/mentorPromptBuilder.test.ts    # prompt contains grounding; never invents
```
(Uses existing `mentorPromptBuilder.ts` → `buildMentorSystemPrompt`.)

### APIs to create
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| `POST` | `/api/mentor` | `{ question, history?, grounding }` | `{ answer, usedGrounding, suggestedFollowups }` |

### Dependencies
`@google/generative-ai` (reused).

### Key rules
- **Stateless + non-streaming.** Client sends `history` (≤ 20 turns) each call; server returns ONE complete `MentorResponse` JSON. No SSE / token streaming.
- `grounding` = the analysis slices needed to rebuild the system prompt (or the controller recomputes the prompt from the provided analysis). System prompt comes from `buildMentorSystemPrompt`.
- Validate `question` (1–500 chars) and `grounding.targetRole` ∈ enum.
- Validate the model reply against `MentorResponse` (SCHEMAS #14) before returning; repair/retry once, else `AI_BAD_JSON`.

### Acceptance criteria
- [ ] "What should I learn next?" cites the top `missing` skill + roadmap[0].
- [ ] "Am I ready?" cites `readiness.score` + breakdown + have/missing.
- [ ] Asking about an off-plan skill (e.g., Kubernetes) → mentor declines and redirects.
- [ ] Asking about a non-existent certification → mentor refuses to invent it.
- [ ] Response is a single validated JSON object (no streaming).
- [ ] Empty/oversized question → `400 VALIDATION_ERROR`.

---

## Phase 8 — Frontend UI

**Goal:** Build the React SPA that drives the full flow: Landing → Upload → Dashboard (Readiness, Health, Skill Gap, Roadmap) → Mentor chat. Polished per `UI.md`.

### Files to create
```
client/ (Vite scaffold)  index.html, vite.config.ts, tailwind.config.ts, postcss.config.js, .env
client/src/main.tsx, App.tsx, index.css
client/src/types.ts                       # shared types from SCHEMAS.md Appendix A
client/src/context/AppContext.tsx          # useReducer store (session-only) + sessionStorage mirror
client/src/api/client.ts                   # the ONLY fetch layer (parse/analyze/mentor/roles/health)
client/src/hooks/useAnalysis.ts            # orchestrates parse -> analyze
client/src/hooks/useMentorChat.ts          # non-streaming chat turns
client/src/pages/LandingPage.tsx
client/src/pages/UploadPage.tsx
client/src/pages/DashboardPage.tsx
client/src/components/common/{Button,Card,Loader,ErrorBanner,ScoreGauge,ProgressBar,Badge,SkillChip}.tsx
client/src/components/upload/{FileDropzone,RoleSelector}.tsx
client/src/components/dashboard/{ReadinessScore,ResumeHealthReport,SkillGapMatrix,RoadmapTimeline}.tsx
client/src/components/mentor/{MentorChat,MessageBubble,TypingIndicator,SuggestedQuestions,ContextStrip}.tsx
client/src/utils/{constants.ts,format.ts}  # scoreBand(), SUPPORTED_ROLES, etc.
```

### Components to create (by screen)
- **Landing:** Hero + CTA → `/upload`.
- **Upload:** `FileDropzone` + `RoleSelector` → progress checklist while parse→analyze runs.
- **Dashboard:** `ReadinessScore` (animated `ScoreGauge`), `ResumeHealthReport` (5 `ProgressBar` rows + reason/tip), `SkillGapMatrix` (✅/❌ `SkillChip` + recommendations), `RoadmapTimeline` (milestones), `DashboardHeader` with **Copy Summary** (clipboard) + Start New.
- **Mentor:** slide-over `MentorChat` with `ContextStrip`, `MessageBubble`, `TypingIndicator` (cosmetic loader), `SuggestedQuestions`.

### Dependencies
`react react-dom react-router-dom` · `tailwindcss postcss autoprefixer vite @vitejs/plugin-react` · `lucide-react framer-motion`.

### Key rules
- State via `AppContext` + `useReducer` only (no Redux). Fetch only in `api/client.ts` (via hooks). Components are presentational.
- Non-streaming mentor: typing indicator shown while awaiting the single response.
- No Export PDF; **Copy Summary** is client-only (`navigator.clipboard`).
- Tailwind tokens + `scoreBand()` per `UI.md`; loading = skeletons; every error → `ErrorBanner` with Retry when `retryable`.

### Acceptance criteria
- [ ] Upload → Dashboard works end-to-end against the live API in < 60s.
- [ ] Readiness gauge animates; Skill Gap shows ✅/❌ with evidence; Health shows 5 bars + tips; Roadmap shows milestones.
- [ ] Mentor answers stream-free with a typing indicator and suggested-question chips.
- [ ] Copy Summary writes a readable plain-text plan to the clipboard.
- [ ] Mobile-responsive; refresh during demo doesn't wipe results (sessionStorage mirror).

---

## Phase 9 — Demo Mode

**Goal:** Guarantee a flawless demo even if the network/Gemini fails live.

### Files to create
```
client/src/demo/analysisResult.sample.json   # pre-baked full AnalysisResult (Aisha / Backend Developer)
client/src/demo/demoMode.ts                   # DEMO_MODE flag + loader
server/scripts/warm.ts                        # pings /api/health to pre-warm the dyno
docs or README note: demo runbook
```

### APIs/behavior
- No new endpoints. `demoMode.ts` short-circuits `useAnalysis`/`useMentorChat` to serve the pre-baked result + canned mentor answers when `DEMO_MODE` is on or a live call fails.

### Dependencies
None new.

### Key rules
- Two fallback layers only (per Fix Pack): **DEMO_MODE pre-baked result** + **sessionStorage mirror**. (Optional: a recorded backup video — not required.)
- Pre-warm `GET /api/health` ~5 min before demo (free-tier cold start).
- Demo resume's skill spellings must align with `skillAliases.json` so no false ❌ appears live.

### Acceptance criteria
- [ ] Toggling `DEMO_MODE` renders the full dashboard + mentor instantly with no network.
- [ ] If a live `/api/analyze` fails, the UI falls back to the pre-baked result without a blank screen.
- [ ] The 3-minute demo script runs flawlessly twice in a row.
- [ ] Backend pre-warm script returns `ok:true`.

---

## Cross-Phase Definition of Done (every phase)
- [ ] Shapes match `API_CONTRACTS.md` + `SCHEMAS.md` exactly (no extra keys).
- [ ] Inbound requests + AI outputs validated with Ajv; errors use the standard envelope.
- [ ] No auth / DB / persistence (except the `sessionStorage` demo mirror).
- [ ] Prompts only in prompt builders; Gemini only via `geminiClient`.
- [ ] `matchObject` computed deterministically before any AI; never overridden by the model.
- [ ] No secrets or PII logged; resume buffers discarded after extraction.

## Build-Order Summary
| Phase | Deliverable | Hard dependency |
|-------|-------------|-----------------|
| 1 | Server foundation + health/roles | — |
| 2 | Upload + text extraction | 1 |
| 3 | `/api/parse` (StructuredResume) | 2 |
| 4 | `/api/analyze` (matchObject) ⭐ | 3 |
| 5 | + Health + Readiness | 4 |
| 6 | + Roadmap (full AnalysisResult) | 5 |
| 7 | `/api/mentor` (grounded, non-streaming) | 6 |
| 8 | React UI (full flow) | 3–7 |
| 9 | Demo Mode + pre-warm | 8 |

*End of Implementation Guide.*
