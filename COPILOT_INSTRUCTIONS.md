# CareerPilot — GitHub Copilot Instructions

**Author:** Principal Engineer
**Version:** 1.0
**Purpose:** Maximize GitHub Copilot code quality and consistency during implementation. These are **binding rules** — Copilot and contributors must follow them exactly.
**Authoritative sources (never contradict):** `PRD.md` · `ARCHITECTURE.md` · `API_CONTRACTS.md` · `SCHEMAS.md` · `PROMPTS.md` · `UI.md`

> **How to use this file:** Place at repo root (and optionally copy to `.github/copilot-instructions.md`). When generating code, Copilot must treat `API_CONTRACTS.md` and `SCHEMAS.md` as the source of truth for all shapes, and `ARCHITECTURE.md` for all structure. If this file and a source doc ever conflict, the source doc wins.

---

## 0. Golden Rules (read first)

1. **No authentication. No database. No accounts. Session-only.** Never generate auth middleware, JWT, login, cookies-for-sessions, Mongoose/Prisma/SQL, or any persistence layer. Client state lives in `AppContext`; the only allowed persistence is a `sessionStorage` demo-safety mirror.
2. **The backend is stateless.** Every request carries all context it needs. No server-side session store, no in-memory user maps.
3. **Deterministic grounding before AI.** Skill matching (`matchObject.have/.missing`) is computed in plain JS by `matchService` against `roles.json` **before** any Gemini call. AI never decides which skills are missing.
4. **Match the contracts exactly.** Every request/response shape must match `API_CONTRACTS.md` and `SCHEMAS.md` field-for-field. No extra keys, no renamed fields.
5. **Evidence-based only.** Never generate code or prompts that produce generic advice. Recommendations must reference `missing[]` and resume evidence.
6. **Validate at every boundary.** Inbound requests AND AI outputs are validated with Ajv against `SCHEMAS.md`.
7. **Errors use the standard envelope.** Every error response is `{ error: { code, message, retryable, details } }`. Never leak stack traces to clients.
8. **TypeScript-style JSDoc on JS.** Use the shared types from `SCHEMAS.md` Appendix A as JSDoc `@typedef` references for editor intellisense even in plain JS.
9. **MENTOR IS NON-STREAMING.** `/api/mentor` returns one complete `MentorResponse` JSON, validated by Ajv. Never implement SSE, ReadableStream, `res.write` chunks, or token streaming. The "typing indicator" is a cosmetic loader only.
10. **NO EXPORT ENDPOINT.** There is no `/api/export` and no PDF generation. "Copy Summary" is client-only: serialize `analysisResult` to plain text and call `navigator.clipboard`.
11. **NO USER NAME.** `StructuredResume` has no name/contact field. Never add one. The mentor greets generically ("Hi! I've reviewed your resume for {role}…"). Never invent a name.
12. **DETERMINISTIC `/api/analyze`.** `/api/analyze` is computed by the deterministic services (`analyzeResumeHealth`+`toSchemaHealth`, `computeReadiness`, `generateRoadmap`). **Gemini is used ONLY for `/parse` structuring and the mentor.** Do NOT implement analyze as a Gemini/LLM call.
13. **ROADMAP IS A BARE ARRAY, 24 WEEKS FIXED.** `roadmap` is `RoadmapMilestone[]` (`phase`, `skill`, `gapAddressed`, `project`, `resource`). No `durationWeeks` request field, no `{durationWeeks, milestones}` wrapper, no duration selector.
14. **READINESS HAS 5 WEIGHTED COMPONENTS, NO `skillGaps`.** `scoreBreakdown = technicalSkills(35)+projects(25)+experience(20)+resumeHealth(10)+roleAlignment(10) = 100`. Skill coverage is counted ONCE (technicalSkills). Field is `scoreBreakdown`, not `breakdown`.
15. **MATCHING USES `skillAliases.json`.** `matchService` lowercases/trims and resolves aliases to canonical skills BEFORE comparing to `roles.json`. Never let Gemini decide `have`/`missing`. `MatchObject` is the full 7-field shape (`role`, `requiredSkills`, `niceToHaveSkills`, `have`, `missing`, `matchedNiceToHave`, `coveragePercentage`).
16. **RAW TEXT IS A SIBLING.** `rawResumeText` (≤ 8000 chars) is a top-level sibling of `structuredResume` on `/parse` and `/analyze` — never inside `StructuredResume`. It is used only for the Formatting + Impact health dimensions; absent → those two default to 60.
17. **NO `skillGap` OBJECT.** `AnalysisResult` has no `skillGap` field. The ✅/❌ UI derives from `matchObject` (`requiredSkills` + `have`/`missing`) and `readiness.nextActions`.

---

## 1. Folder Structure Rules

Follow `ARCHITECTURE.md §2` **exactly**. Do not invent new top-level folders.

```
CareerPilot/
├── client/   (React + Vite + Tailwind)
└── server/   (Node + Express)
```

**Client structure (enforced):**
```
client/src/
├── main.jsx, App.jsx, index.css
├── context/      → AppContext.jsx (the ONLY global store)
├── api/          → client.js (the ONLY place fetch() is called)
├── hooks/        → useAnalysis.js, useMentorChat.js (orchestration only)
├── pages/        → LandingPage, UploadPage, DashboardPage
├── components/   → common/ upload/ dashboard/ mentor/ (presentational)
└── utils/        → constants.js, format.js
```

**Server structure (enforced):**
```
server/src/
├── routes/       → index.js (mounts /api/*)
├── controllers/  → parse/analyze/mentor — thin, no business logic
├── services/     → parser, match, analysis, mentor, promptBuilder, geminiClient
├── data/         → roles.json
├── middleware/   → errorHandler.js, upload.js
└── utils/        → jsonGuard.js, logger.js, validators.js (Ajv)
```

**Rules:**
- Components are **presentational** — never call `fetch` inside a component. Only `api/client.js` (via hooks) talks to the network.
- Controllers are **thin** — parse request, call a service, return. No Gemini calls, no matching logic in controllers.
- Business logic lives in `services/`. Prompt strings live ONLY in `promptBuilder.js`. Gemini calls live ONLY in `geminiClient.js`.
- `roles.json` is the single grounding dataset. Never hardcode role skills elsewhere.

---

## 2. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| React components & files | PascalCase | `ScoreGauge.jsx`, `SkillGapMatrix.jsx` |
| Hooks | camelCase, `use` prefix | `useAnalysis.js` |
| Non-component JS files (server) | camelCase | `matchService.js`, `geminiClient.js` |
| Functions / variables | camelCase | `buildMatchObject()`, `targetRole` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `SUPPORTED_ROLES` |
| Types / interfaces (JSDoc/TS) | PascalCase | `AnalysisResult`, `MatchObject` |
| Error codes | UPPER_SNAKE_CASE (from contracts) | `PARSE_FAILED`, `AI_BAD_JSON` |
| API routes | kebab/lower, plural nouns | `/api/roles`, `/api/analyze` |
| Tailwind custom tokens | from `UI.md` Appendix A | `bg-surface`, `text-ink-soft` |
| Env vars | UPPER_SNAKE_CASE | `GEMINI_API_KEY`, `VITE_API_BASE_URL` |

**Field names must match the implemented services + `SCHEMAS.md` verbatim:** `matchObject` (with `role`, `requiredSkills`, `niceToHaveSkills`, `have`, `missing`, `matchedNiceToHave`, `coveragePercentage`), `resumeHealth` (`overall`, `dimensions[].tip`), `readiness` (`score`, `strengths`, `weaknesses`, `nextActions`, `scoreBreakdown` with `technicalSkills`/`projects`/`experience`/`resumeHealth`/`roleAlignment`), `roadmap` (bare array of `{phase, skill, gapAddressed, project, resource}`), `rawResumeText` (sibling), `usedGrounding`, `suggestedFollowups`. **Do NOT use** `breakdown`, `skillGaps`, `skillGap`, `quickWins`, `longTerm`, `durationWeeks`, `week`, `gap`, `milestones` (these are deprecated/removed). Never pluralize/singularize or camelCase-differently.

**File extensions:** the project is TypeScript. Use `.ts` (server, hooks, utils, context, api) and `.tsx` (React components/pages). Ignore any `.jsx`/`.js` references in older folder-tree snippets.

---

## 3. React Component Standards

1. **Functional components only**, with hooks. No class components.
2. **One component per file**, default export the component; named export for sub-parts only if essential.
3. **Presentational components receive data via props** — no data fetching, no context mutation. They may read context for display but must not call the API.
4. **Props shape mirrors `SCHEMAS.md`.** E.g., `ReadinessCard` takes a `readiness: CareerReadiness` prop; `DimensionRow` takes a `dimension: ResumeHealthDimension`.
5. **Add a JSDoc `@param` typedef** referencing the schema type:
   ```jsx
   /**
    * @param {{ dimension: import('../../types').ResumeHealthDimension }} props
    */
   export default function DimensionRow({ dimension }) { ... }
   ```
6. **Derive, don't duplicate.** Compute score-band color from the value via a shared `utils/format.js` helper (`scoreBand(score) => 'success'|'warning'|'danger'`). Never hardcode color logic per component.
7. **Accessibility built-in:** semantic elements, `aria-label` on icon-only buttons, focus rings, color never the sole signal (pair with icon/label per `UI.md` Appendix C).
8. **Loading/empty/error are first-class:** every data-driven component handles all three states per its `UI.md` section. Prefer skeletons over spinners where layout is known.
9. **No inline business logic in JSX.** Extract to small pure helpers.
10. **Keep components < ~150 lines.** Split when larger.

**Component → screen mapping is fixed** — build the components named in `UI.md` Appendix B; do not rename.

---

## 4. State Management Rules

**Use `AppContext` + `useReducer`. No Redux, Zustand, or other libraries.**

1. **Single store:** `context/AppContext.jsx` exposes state + dispatch via a custom `useApp()` hook. This is the only global state.
2. **Reducer shape** (mirror `ARCHITECTURE.md §6`):
   ```js
   const initialState = {
     file: null,
     targetRole: null,
     structuredResume: null,   // StructuredResume | null (parsed data only)
     rawResumeText: null,      // string | null  (source text sibling, <= 8000 chars)
     analysisResult: null,     // AnalysisResult | null
     chatHistory: [],          // MentorMessage[]
     status: 'idle',           // 'idle'|'parsing'|'analyzing'|'ready'|'error'
     error: null,              // { code, message, retryable } | null
   };
   ```
3. **Action types are UPPER_SNAKE constants:** `SET_FILE`, `SET_ROLE`, `SET_DURATION`, `PARSE_START`, `PARSE_SUCCESS`, `ANALYZE_START`, `ANALYZE_SUCCESS`, `SET_ERROR`, `ADD_MESSAGE`, `RESET`. The reducer is a pure switch; no side effects inside it.
4. **Side effects live in hooks**, not the reducer. `useAnalysis` orchestrates parse→analyze and dispatches actions. `useMentorChat` manages chat turns.
5. **`status` drives global UI** (Loader / ErrorBanner). Components read `status`, never manage their own duplicate loading booleans for global flows.
6. **Session-safety mirror (optional, allowed):** persist `analysisResult` to `sessionStorage` on `ANALYZE_SUCCESS`, hydrate on load, clear on `RESET`. This is the ONLY persistence permitted. Never use `localStorage` as a database.
7. **Chat history is client-owned.** Send `chatHistory` (≤ 20 turns) with each `/api/mentor` call — the server is stateless.
8. **Never store secrets or the Gemini key client-side.**

---

## 5. API Development Rules

Follow `API_CONTRACTS.md` exactly. Endpoints: `GET /api/health`, `GET /api/roles`, `POST /api/parse`, `POST /api/analyze`, `POST /api/mentor`.

1. **Layering:** `route → controller → service(s) → geminiClient`. Controllers are thin; never put matching/prompt/Gemini logic in controllers.
2. **Validate inbound requests with Ajv** (compiled from `SCHEMAS.md`) at the controller entry. On failure → `400 VALIDATION_ERROR` with `details[]`.
3. **`targetRole` must be in the role enum** (6 roles). Invalid → `400 INVALID_ROLE`.
4. **`/api/parse`:** multer **memory storage**, 5MB limit, accept only `application/pdf` and DOCX MIME. File discarded after parse (privacy — never write to disk). Extracted text < 50 chars → `422 PARSE_FAILED`.
5. **`/api/analyze`:** call `matchService` FIRST (deterministic), then build prompts, then Gemini, then validate AI output against `AnalysisResult`. Server assembles final result by injecting `targetRole` + `matchObject` (never trust AI for these).
6. **`/api/mentor`:** stateless; require `grounding` + `question`; truncate `history` to 20 turns server-side; validate output against `MentorResponse`.
7. **Response shapes:** return the resource object directly (success) per contracts. Always set `X-Request-Id` header.
8. **Status codes exactly as in contracts:** 200/400/413/415/422/429/500/502/504. Map each error `code` to its documented HTTP status.
9. **Limits from `API_CONTRACTS.md` Appendix C** are constants in one config module (`MAX_FILE_SIZE=5MB`, `MAX_BODY=1MB`, `MIN_TEXT=50`, `GEMINI_TIMEOUT`, `RETRIES=2`, `MAX_HISTORY=20`, `QUESTION_MAX=500`).
10. **CORS** locked to `ALLOWED_ORIGIN` (client origin). JSON body limit 1MB.

---

## 6. Error Handling Rules

1. **Standard envelope everywhere:**
   ```json
   { "error": { "code": "STRING", "message": "user-safe", "retryable": true, "details": null } }
   ```
   Implement `ApiError` matching `SCHEMAS.md #16`.
2. **Central `errorHandler.js` middleware** (mounted last) catches all thrown errors, maps to envelope + correct HTTP status, logs full detail server-side, sends only safe `message` to client.
3. **Use a typed error factory:** `throw new AppError('PARSE_FAILED', 'message', { retryable: true, status: 422 })`. Never `throw new Error('raw')` in services.
4. **Error codes are exactly the 12 from contracts** — `VALIDATION_ERROR, MISSING_FILE, UNSUPPORTED_FILE_TYPE, FILE_TOO_LARGE, BODY_TOO_LARGE, PARSE_FAILED, INVALID_ROLE, AI_TIMEOUT, AI_BAD_JSON, AI_UNAVAILABLE, RATE_LIMITED, INTERNAL_ERROR`.
5. **`retryable` is honest:** AI/timeout/network → `true`; validation/file-type → `false`. Drives the client Retry button.
6. **Frontend:** every API call wrapped in try/catch inside hooks → dispatch `SET_ERROR`. `ErrorBanner` shows `message` + Retry when `retryable`. Never show a stack trace or blank screen.
7. **Demo-safety net:** a `DEMO_MODE` flag may load a pre-baked `analysisResult.json` if live calls fail (per `ARCHITECTURE.md §8`). Keep it isolated and clearly labeled.
8. **No silent failures:** every catch either recovers or surfaces a user-visible, recoverable state.

---

## 7. Prompt Integration Rules

Follow `PROMPTS.md` exactly. This is where hallucination is prevented.

1. **All prompt strings live in `promptBuilder.js`.** Never inline prompt text in controllers/services elsewhere.
2. **All Gemini calls go through `geminiClient.js`** with: `responseMimeType: "application/json"`, the documented temperature per prompt, timeout, and **retries ×2 with exponential backoff**.
3. **Inject deterministic grounding** (`have`, `missing`, `requiredSkills`, `roleKeywords`) into prompts. The AI must never be asked to decide membership of `have`/`missing`.
4. **Skill Gap uses the pre-built skeleton technique** (`PROMPTS.md §4`): server passes `required[]` with `have` set and `recommendation:null`; AI only fills recommendations for `have:false`. After return, **server overwrites `skill` and `have` from `matchObject`** regardless of AI output.
5. **Validate every AI output with Ajv** before use. On schema failure → `jsonGuard.repair()` → re-parse → if still bad, one re-prompt → else `AI_BAD_JSON` (502).
6. **Run the anti-hallucination checklist** (`PROMPTS.md Appendix B`) server-side after every analysis: enforce `required` == role required; `have` matches `matchObject`; `recommendation` null⇔have; every `quickWins/longTerm/milestone.gap ∈ missing`; exactly 5 health dimensions; readiness breakdown within bounds. Auto-correct or re-prompt on violation.
7. **`/api/analyze` is DETERMINISTIC — no Gemini.** Compute it with the implemented services: `matchService.generateMatchObject` → `analyzeResumeHealth`+`toSchemaHealth` → `computeReadiness` → `generateRoadmap`, then assemble `{ targetRole, matchObject, resumeHealth, readiness, roadmap }`. Gemini is used ONLY for `/parse` structuring and the mentor. The analyze prompts in `PROMPTS.md` §2–§5 + Appendix A are **reference only**, NOT a runtime path.
8. **Never log full resume text or Gemini keys.** Log lengths/ids only.

---

## 8. Styling Rules

Use Tailwind utility classes per `UI.md`.

1. **Use design tokens from `UI.md` Appendix A** (extend `tailwind.config.js`): `bg-surface`, `text-ink`, `text-ink-soft`, `border-border`, `bg-brand-600`, semantic `success/warning/danger/info`. Never hardcode hex in JSX.
2. **Score colors via `scoreBand()` helper** → maps to `success/warning/danger`. Bands: 0–49 danger, 50–79 warning, 80–100 success. Always pair color with an icon/label (colorblind-safe).
3. **Cards:** `rounded-2xl border border-border bg-surface shadow-card` + `hover:shadow-cardHover hover:-translate-y-0.5 transition`. Featured Readiness card gets the gradient border.
4. **Spacing:** 8px grid only (Tailwind `p-6`/`p-8` cards, `gap-8`/`gap-12` sections). Content max-width `max-w-[1120px]`, reading sections `max-w-3xl`.
5. **Typography:** `font-sans` (Inter) for UI, `font-mono` (JetBrains Mono) + `tabular-nums` for all scores/numbers. Use the type scale from `UI.md §0.2`.
6. **Responsive:** mobile-first; stack columns, full-width CTAs, sticky bottom CTA on Upload, sheet-style Mentor on mobile (per each `UI.md` section's Mobile Design).
7. **Animations** per `UI.md §0.5` using Framer Motion or CSS; **respect `prefers-reduced-motion`** (opacity-only fallback).
8. **No arbitrary one-off values** unless unavoidable; prefer tokens. No inline `style={}` except dynamic gauge/bar widths.

---

## 9. Reusable Component Guidelines

Build these **global** components in `components/common/` first; reuse everywhere:

| Component | Props (typed) | Reuse |
|-----------|---------------|-------|
| `Button` | `variant` (primary/secondary/ghost), `size`, `loading`, `disabled` | all CTAs |
| `Card` | `title?`, `badge?`, `featured?`, `children` | every section |
| `Loader` | `variant` (skeleton/spinner), `lines?` | all loading states |
| `ErrorBanner` | `error: {message, retryable}`, `onRetry` | all error states |
| `ScoreGauge` | `value` (0–100), `label`, `size` | Readiness, Health overall |
| `ProgressBar` | `value`, `band` | Health dimensions |
| `SkillChip` | `skill`, `have: boolean` | Skill Gap |
| `Badge` | `tone` (semantic), `children` | scores, tags |

**Rules:**
- A pattern used **2+ times must be a shared component** — never copy-paste UI.
- Shared components are **pure and presentational**; they take typed props, emit callbacks, hold no global state.
- Score/format logic lives in `utils/format.js` (`scoreBand`, `scoreLabel`, `formatWeekRange`) and is imported, never duplicated.
- Keep a `constants.js` for `SUPPORTED_ROLES`, `DURATIONS`, `SUGGESTED_QUESTIONS` — single source for UI lists.

---

## 10. Testing Guidelines

Scope is hackathon-pragmatic: **test the logic that must not break**, skip exhaustive UI tests.

1. **Priority 1 — `matchService` (the core):** unit tests proving `have ∪ missing == role.required`, disjoint sets, case/alias-insensitive matching (e.g., "node" → "Node.js"). This is the most important test in the repo.
2. **Priority 2 — validators & jsonGuard:** Ajv accepts valid schema objects from `SCHEMAS.md` examples; rejects malformed; `jsonGuard.repair()` fixes common LLM JSON issues (trailing commas, code fences).
3. **Priority 3 — anti-hallucination enforcement:** given a deliberately wrong AI output (skill not in `missing`, wrong `have`), the post-processing corrects/drops it.
4. **Contract smoke tests:** each endpoint returns the documented success shape (mock Gemini) and the standard error envelope on failure.
5. **Tooling:** `vitest` (works for both client and server), `supertest` for Express routes. **Mock Gemini** — never hit the real API in tests.
6. **Frontend:** light tests for `appReducer` (pure function) transitions and `scoreBand()`. Component tests optional.
7. **Definition of done for a service:** has at least one happy-path and one failure-path test.

---

## 11. Documentation Standards

1. **JSDoc every exported function/service** with `@param`/`@returns` referencing schema typedefs:
   ```js
   /**
    * Compare resume skills to a role's required skills (deterministic).
    * @param {string[]} skills
    * @param {string} targetRole
    * @returns {import('../types').MatchObject}
    */
   ```
2. **Maintain `client/src/types.js`** (or `.d.ts`) with the JSDoc `@typedef`s from `SCHEMAS.md` Appendix A so editors get full intellisense without TypeScript.
3. **Each service file starts with a 1–3 line header comment** stating its single responsibility and which doc section it implements (e.g., `// Implements PROMPTS.md §4 + Appendix B enforcement`).
4. **README per app** (`client/`, `server/`) with: setup, env vars, run/build commands, and a one-paragraph architecture note linking to `ARCHITECTURE.md`.
5. **Reference, don't restate:** code comments cite the authoritative doc + section rather than duplicating spec prose.
6. **Keep `.env.example`** files listing every required variable (no secrets committed).

---

## 12. Deployment Standards

Follow `ARCHITECTURE.md §9`.

1. **Frontend → Vercel** (static SPA). **Backend → Render/Railway** (Node service). No DB to provision.
2. **Secrets server-side only.** `GEMINI_API_KEY` lives in the backend host's env. Never in client bundle, never committed. Client only knows `VITE_API_BASE_URL`.
3. **Env files:**
   - `server/.env`: `GEMINI_API_KEY`, `PORT`, `ALLOWED_ORIGIN`
   - `client/.env`: `VITE_API_BASE_URL`
   Provide `.env.example` for both.
4. **CORS** restricted to the deployed client origin.
5. **`GET /api/health`** used for uptime + **pre-warming** the free-tier dyno before a demo (returns `geminiConfigured`).
6. **Build commands:** client `vite build` → static; server `node server.js` (or `node src/...`). No build step that requires a DB.
7. **Demo-day safeguards (must implement):** `DEMO_MODE` pre-baked result, `sessionStorage` mirror, and a documented local `npm run dev` fallback for both apps in case of network failure.
8. **No secrets in logs.** Logger redacts keys and never logs full resume text.

---

## Appendix A — Quick "Do / Don't" for Copilot

| ✅ Do | ❌ Don't |
|------|---------|
| Compute `matchObject` in `matchService` before Gemini | Ask Gemini to decide `have`/`missing` |
| Use `AppContext` + `useReducer` | Add Redux/Zustand/MobX |
| Return `{ error: { code, message, retryable, details } }` | Send raw error strings / stack traces |
| Validate AI output with Ajv against `SCHEMAS.md` | Trust Gemini JSON blindly |
| Put prompts in `promptBuilder.js`, calls in `geminiClient.js` | Inline prompts or fetch Gemini from controllers |
| Keep components presentational; fetch in hooks | `fetch()` inside a component |
| Use Tailwind tokens from `UI.md` | Hardcode hex colors in JSX |
| Discard uploaded file after parse | Write resume to disk or DB |
| Session-only state (+ optional sessionStorage mirror) | Add auth, accounts, or a database |
| Match field names from the implemented services | Rename/re-case schema fields |
| Compute `/api/analyze` with deterministic services | Build analyze as a Gemini/LLM call |
| Non-streaming mentor + cosmetic typing dots | SSE / token streaming for the mentor |
| Client-only Copy Summary via clipboard | `/api/export` or server PDF generation |
| Generic mentor greeting (role + score) | Greet the user by name / add a name field |
| Readiness `scoreBreakdown` (5 parts, no `skillGaps`) | A `breakdown`/`skillGaps` term (double-count) |
| Roadmap = bare `RoadmapMilestone[]`, fixed 24 weeks | `{durationWeeks, milestones}` wrapper / duration selector |
| `rawResumeText` as a top-level sibling | Put `rawText` inside `StructuredResume` |
| Build ✅/❌ UI from `matchObject` + `nextActions` | A `skillGap` object (deprecated, not produced) |

## Appendix B — File Generation Order (mirrors implementation plan)
1. `server`: scaffold, `roles.json`, `geminiClient.js`, `jsonGuard.js`, `errorHandler.js`, validators.
2. `server`: `parserService` + `/api/parse`; `matchService` (+ tests); `promptBuilder` + `analysisService` + `/api/analyze`; `mentorService` + `/api/mentor`.
3. `client`: Tailwind config + tokens, `AppContext` + reducer, `api/client.js`, hooks.
4. `client`: common components, Upload page, Dashboard sections, Mentor chat.
5. Hardening: error layers, `DEMO_MODE`, `sessionStorage` mirror, deploy.

## Appendix C — Definition of Done (every PR/feature)
- [ ] Shapes match `API_CONTRACTS.md` + `SCHEMAS.md` exactly (no extra keys).
- [ ] Inbound + AI output validated; errors use the standard envelope.
- [ ] No auth/DB/persistence introduced (except `sessionStorage` mirror).
- [ ] Prompts only in `promptBuilder.js`; Gemini only via `geminiClient.js`.
- [ ] Components presentational; state via `AppContext`/`useReducer`.
- [ ] Tailwind tokens used; loading/empty/error states implemented.
- [ ] Core logic (`matchService`, validators) has tests.
- [ ] JSDoc + doc references present; no secrets/PII logged.

*End of Document.*
