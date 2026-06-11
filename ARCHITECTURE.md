# CareerPilot — Technical Architecture

**Author:** Senior Software Architect
**For:** Solo developer, 38-hour MVP build
**Stack:** React + Tailwind (frontend) · Node.js/Express (backend) · Gemini API (AI)
**Constraints:** No auth · No database · No accounts · Session-only · Stateless backend

> **Design philosophy:** Optimize for *speed of build*, *demo reliability*, and *zero moving parts*. The backend is a thin, stateless AI-orchestration layer. All "memory" lives in the browser session. The role-skill dataset (`roles.json`) is the deterministic grounding layer that keeps AI output evidence-based.

---

## 1. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          BROWSER (Client)                          │
│                                                                    │
│  React SPA (Vite) + Tailwind                                       │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐      │
│  │ Upload View  │  │ Dashboard View│  │  AI Mentor Chat      │      │
│  └──────┬───────┘  └──────┬────────┘  └─────────┬───────────┘      │
│         │                 │                     │                  │
│         └──────────┬──────┴─────────────────────┘                  │
│                    ▼                                               │
│        ┌────────────────────────────┐                             │
│        │  AppContext (React Context) │  ← session-only state       │
│        │  resume, analysis, gaps,    │     (in-memory + optional   │
│        │  roadmap, readiness, chat   │      sessionStorage cache)  │
│        └────────────┬───────────────┘                             │
│                     │ fetch (JSON / multipart)                     │
└─────────────────────┼──────────────────────────────────────────────┘
                      │  HTTPS
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND (Express)                       │
│                     Stateless · No DB · No sessions                │
│                                                                    │
│   Routes ──► Controllers ──► Services ──► Gemini Client            │
│                                                                    │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ /api/parse │  │ /api/analyze │  │ /api/mentor (chat)         │ │
│  └─────┬──────┘  └──────┬───────┘  └─────────────┬──────────────┘ │
│        ▼                ▼                        ▼                 │
│  ┌──────────┐   ┌──────────────────┐   ┌──────────────────────┐   │
│  │ parser   │   │ matchService     │   │ promptBuilder        │   │
│  │ (pdf/    │   │ (resume skills   │   │ (injects grounding   │   │
│  │  docx)   │   │  vs roles.json)  │   │  object into prompts)│   │
│  └──────────┘   └────────┬─────────┘   └──────────┬───────────┘   │
│                          │                        │               │
│                   ┌──────▼────────────────────────▼──────┐        │
│                   │           roles.json                  │        │
│                   │  (curated role-skill dataset)         │        │
│                   └───────────────────────────────────────┘        │
│                          │                                         │
│                          ▼                                         │
│                  ┌────────────────┐                                │
│                  │  geminiClient  │ ── retry + timeout + JSON guard│
│                  └───────┬────────┘                                │
└──────────────────────────┼─────────────────────────────────────────┘
                          │ HTTPS
                          ▼
                ┌──────────────────────┐
                │   Google Gemini API   │
                │  (gemini-1.5-flash)   │
                └──────────────────────┘
```

**Key principles**
- **Stateless backend:** every request carries all context it needs. No server-side session. This means it survives restarts, scales trivially, and is dead-simple to deploy.
- **Deterministic grounding first, AI second:** skill matching is done in plain JS against `roles.json` *before* calling Gemini. The AI only *explains/recommends*, never *decides* what's missing → eliminates hallucinated gaps.
- **Client owns state:** the browser holds the full result object and passes the relevant slice to the Mentor endpoint on each chat turn.

---

## 2. Folder Structure

```
CareerPilot/
├── PRD.md
├── ARCHITECTURE.md
│
├── client/                          # React + Vite + Tailwind
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── .env                         # VITE_API_BASE_URL
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  # router + layout
│       ├── index.css                # tailwind directives
│       │
│       ├── context/
│       │   └── AppContext.jsx       # session state provider
│       │
│       ├── api/
│       │   └── client.js            # fetch wrappers (parse/analyze/mentor)
│       │
│       ├── hooks/
│       │   ├── useAnalysis.js       # orchestrates parse→analyze flow
│       │   └── useMentorChat.ts     # chat state (non-streaming request/response)
│       │
│       ├── pages/
│       │   ├── LandingPage.jsx      # hook + "Analyze My Resume" CTA
│       │   ├── UploadPage.jsx       # file upload + role select
│       │   └── DashboardPage.jsx    # all results + mentor
│       │
│       ├── components/
│       │   ├── common/
│       │   │   ├── Button.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Loader.jsx
│       │   │   ├── ErrorBanner.jsx
│       │   │   └── ScoreGauge.jsx        # animated circular gauge
│       │   ├── upload/
│       │   │   ├── FileDropzone.jsx
│       │   │   └── RoleSelector.jsx
│       │   ├── dashboard/
│       │   │   ├── ResumeHealthReport.jsx   # 5 dimension bars + reasons
│       │   │   ├── ReadinessScore.jsx       # gauge + strengths/weaknesses
│       │   │   ├── SkillGapMatrix.jsx       # ✅/❌ grid + recommendations
│       │   │   └── RoadmapTimeline.jsx      # milestones
│       │   └── mentor/
│       │       ├── MentorChat.jsx           # chat window
│       │       ├── MessageBubble.jsx
│       │       └── SuggestedQuestions.jsx   # starter chips
│       │
│       └── utils/
│           ├── constants.js          # roles list, durations
│           └── format.js             # display helpers
│
└── server/                          # Node.js + Express
    ├── package.json
    ├── .env                         # GEMINI_API_KEY, PORT
    ├── server.js                    # entry, middleware, route mount
    └── src/
        ├── routes/
        │   └── index.js             # mounts /api/* routes
        ├── controllers/
        │   ├── parseController.js
        │   ├── analyzeController.js
        │   └── mentorController.js
        ├── services/
        │   ├── parserService.js     # pdf/docx → raw text
        │   ├── matchService.js      # skills vs roles.json (deterministic)
        │   ├── analysisService.js   # builds health + readiness + gap + roadmap
        │   ├── mentorService.js     # grounded chat
        │   ├── promptBuilder.js     # all prompt templates
        │   └── geminiClient.js      # Gemini wrapper: retry/timeout/JSON parse
        ├── data/
        │   └── roles.json           # curated role-skill dataset (6 roles)
        ├── middleware/
        │   ├── errorHandler.js      # central error → friendly JSON
        │   └── upload.js            # multer (memory storage, 5MB limit)
        └── utils/
            ├── jsonGuard.js         # safe-parse + repair LLM JSON
            └── logger.js
```

---

## 3. Data Flow

### 3.1 Primary flow (Upload → Full Analysis)
```
1. User selects PDF/DOCX + target role on UploadPage
2. POST /api/parse  (multipart)
       → parserService extracts raw text
       → Gemini structures text into { skills, projects, experience, education }
       ← returns structuredResume JSON
3. Client stores structuredResume in AppContext
4. POST /api/analyze  { structuredResume, targetRole }
       → matchService compares skills vs roles.json  → matchObject {have, missing}
       → analysisService + Gemini produce:
            • resumeHealth (5 dims + reasons)
            • careersReadiness (score + strengths/weaknesses/actions)
            • skillGap (uses deterministic matchObject + AI recommendations)
            • roadmap (milestones tied to missing skills)
       ← returns full `analysisResult` object
5. Client stores analysisResult in AppContext → renders DashboardPage
```

### 3.2 Mentor chat flow (grounded)
```
1. User types question in MentorChat
2. POST /api/mentor  { question, history, grounding }
       grounding = { structuredResume, matchObject, readiness, roadmap }
       → promptBuilder injects grounding as system context
       → Gemini answers, constrained to cite user's own data
       ← returns answer text
3. Client appends Q + A to chat history in AppContext
```

### 3.3 The "grounding object" (single source of truth passed around)
```json
{
  "targetRole": "Backend Developer",
  "structuredResume": { "skills": [...], "projects": [...], "experience": [...] },
  "matchObject": { "have": ["Node.js","Express.js"], "missing": ["MongoDB","Auth"] },
  "readiness": { "score": 68, "strengths": [...], "weaknesses": [...] },
  "roadmap": [ { "milestone": "...", "gap": "MongoDB", "project": "..." } ]
}
```
This object is computed once, stored client-side, and re-sent (relevant slices) to the Mentor so every chat answer stays evidence-based **without** a database.

---

## 4. Component Architecture (Frontend)

```
App
├── AppProvider (context)
└── Router
    ├── LandingPage
    │   └── Button("Analyze My Resume")
    │
    ├── UploadPage
    │   ├── FileDropzone        → sets file in context
    │   ├── RoleSelector        → sets targetRole
    │   └── Button("Analyze")   → useAnalysis().run()
    │
    └── DashboardPage  (gated: requires analysisResult)
        ├── ReadinessScore
        │   ├── ScoreGauge (animated)
        │   └── Strengths / Weaknesses / NextActions lists
        ├── ResumeHealthReport
        │   └── DimensionBar × 5  (score + reason + tip)
        ├── SkillGapMatrix
        │   └── SkillChip ✅/❌ × N  + RecommendationCard
        ├── RoadmapTimeline
        │   └── MilestoneCard × N
        └── MentorChat
            ├── SuggestedQuestions (chips)
            ├── MessageBubble × N
            └── input + send (useMentorChat)
```

**Component rules**
- **Presentational components are dumb** — they receive data via props, no fetching inside.
- **Pages/hooks own orchestration** — `useAnalysis` and `useMentorChat` are the only places that call the API.
- **Loader & ErrorBanner are global** — driven by context `status` flags so every async action is covered consistently.

---

## 5. Backend API Design

Stateless. JSON in, JSON out. All errors return a consistent shape.

### 5.1 Endpoints

| Method | Endpoint | Purpose | Body | Returns |
|--------|----------|---------|------|---------|
| `GET` | `/api/health` | Liveness check | — | `{ ok: true }` |
| `GET` | `/api/roles` | List supported roles | — | `{ roles: [...] }` |
| `POST`| `/api/parse` | Resume → structured JSON | multipart: `file`, `targetRole` | `structuredResume` |
| `POST`| `/api/analyze`| Full analysis | `{ structuredResume, targetRole }` | `analysisResult` |
| `POST`| `/api/mentor` | Grounded chat turn | `{ question, history, grounding }` | `{ answer }` |

> **Design choice:** `/parse` and `/analyze` are split so the slow parsing step can show its own progress, and so `/analyze` can be re-run for a *different target role* without re-uploading. (Stretch: merge into one call if time-constrained.)

### 5.2 Response shapes

**`structuredResume`**
```json
{
  "skills": ["Node.js", "Express.js", "React", "JavaScript", "Git"],
  "projects": [{ "name": "E-commerce API", "tech": ["Node.js","Express.js"], "summary": "..." }],
  "experience": [{ "title": "Intern", "org": "X", "summary": "..." }],
  "education": [{ "degree": "BS CS", "year": "2026" }],
  "rawTextLength": 4210
}
```

**`analysisResult`**
```json
{
  "targetRole": "Backend Developer",
  "matchObject": { "have": ["Node.js","Express.js"], "missing": ["MongoDB","Authentication","Unit Testing"] },
  "resumeHealth": {
    "overall": 64,
    "dimensions": [
      { "key": "formatting",   "score": 82, "reason": "...", "tip": "..." },
      { "key": "impactMetrics","score": 45, "reason": "...", "tip": "..." },
      { "key": "skillsCoverage","score": 70, "reason": "...", "tip": "..." },
      { "key": "keywordCoverage","score": 60, "reason": "...", "tip": "..." },
      { "key": "projectQuality","score": 55, "reason": "...", "tip": "..." }
    ]
  },
  "readiness": {
    "score": 70,
    "strengths": ["Solid JS fundamentals"],
    "weaknesses": ["No database experience"],
    "nextActions": ["Build a MongoDB CRUD project to close the MongoDB gap."],
    "scoreBreakdown": { "technicalSkills": 29, "projects": 21, "experience": 11, "resumeHealth": 6, "roleAlignment": 3 }
  },
  "roadmap": [
    { "phase": "Week 1-4", "skill": "MongoDB", "gapAddressed": "MongoDB", "project": "Build a MongoDB-backed CRUD API.", "resource": "MongoDB University M001" }
  ]
}
```

> Analysis is **deterministic** (no `skillGap` object; `readiness.scoreBreakdown`; roadmap is a bare array). `/api/analyze` calls `matchService` + `analysisService` + `readinessService` + `roadmapService`; Gemini is used only for `/parse` and the mentor.

**Error shape (all endpoints)**
```json
{ "error": { "code": "PARSE_FAILED", "message": "We couldn't read that file. Try a text-based PDF.", "retryable": true } }
```

### 5.3 Middleware stack (order matters)
```
cors() → express.json({limit:'1mb'}) → multer(memory,5MB) [parse route only]
  → route handlers → errorHandler (last)
```

---

## 6. State Management Strategy

**Decision: React Context + a reducer. No Redux, no DB, no localStorage-as-DB.** Session-only is a feature, not a limitation — it keeps the build small.

### 6.1 AppContext shape
```js
{
  // inputs
  file: File | null,
  targetRole: string | null,

  // results
  structuredResume: object | null,   // parsed data only
  rawResumeText: string | null,      // source text sibling (<= 8000 chars)
  analysisResult: object | null,

  // mentor
  chatHistory: [{ role: 'user'|'mentor', text }],

  // ui
  status: 'idle' | 'parsing' | 'analyzing' | 'ready' | 'error',
  error: { message, retryable } | null,

  // actions
  setFile, setTargetRole, runAnalysis, sendMentorMessage, reset
}
```

### 6.2 Rules
- **Single source of truth** lives in context; pages read from it.
- **`sessionStorage` mirror (optional, 30 min):** persist `analysisResult` so an accidental refresh during the demo doesn't wipe results. Cleared on `reset`. *This is the only "persistence" — and it's purely a demo-safety net.*
- **No prop-drilling of results** — components consume context directly.
- **`status` drives global Loader/ErrorBanner**, so async UX is consistent everywhere.

### 6.3 Demo-safety cache (important)
A small client-side flag `DEMO_MODE` can load a **pre-baked `analysisResult.json`** instantly if the network/API fails live. This guarantees the dashboard + mentor always have data to show. (See §8 and §10.)

---

## 7. AI Processing Pipeline

```
                          ┌─────────────────────────┐
   raw file ─► parser ──► │ raw resume text          │
                          └───────────┬─────────────┘
                                      ▼
                    ┌───────────────────────────────────┐
   GEMINI CALL #1   │ STRUCTURE: text → JSON resume      │  (low temp, JSON mode)
                    └───────────────────┬───────────────┘
                                        ▼
                    ┌───────────────────────────────────┐
   DETERMINISTIC    │ matchService: resume.skills        │  (plain JS — NO AI)
   (anti-hallucin.) │   ∩ roles.json[role].required      │
                    │   → { have[], missing[] }           │
                    └───────────────────┬───────────────┘
                                        ▼
                    ┌───────────────────────────────────┐
   GEMINI CALL #2   │ ANALYZE: given resume + matchObject │  (one structured call
                    │ produce health + readiness +        │   returning the whole
                    │ gap recommendations + roadmap       │   analysisResult JSON)
                    └───────────────────┬───────────────┘
                                        ▼
                              analysisResult  ─────► client

   ── later, per chat turn ──
                    ┌───────────────────────────────────┐
   GEMINI CALL #3   │ MENTOR: grounding object + history  │  (conversational,
   (per message)    │ + question → evidence-based answer  │   cites user data)
                    └───────────────────────────────────┘
```

### 7.1 Why this shape
- **Two structured calls** for the main flow (structure, then analyze) keeps each prompt focused and the JSON reliable. Combining everything into one mega-prompt risks malformed JSON and timeouts.
- **Deterministic match between the AI calls** is the core innovation: gaps are computed in code, so the AI can never invent or miss a required skill. The AI only *writes the reasoning and recommendations* around facts it's been handed.
- **Mentor reuses the grounding object** — no new computation, just a focused prompt.

### 7.2 Gemini client contract (`geminiClient.js`)
```
callGemini({ prompt, jsonMode=true, timeoutMs=20000, retries=2 })
  - sets responseMimeType: "application/json" when jsonMode
  - temperature: 0.3 for analysis, 0.6 for mentor
  - on timeout/5xx: exponential backoff retry (×2)
  - on malformed JSON: jsonGuard.repair() then re-parse; if still bad → throw AI_BAD_JSON
  - model: gemini-1.5-flash  (fast + cheap; ideal for demo latency)
```

### 7.3 Prompt strategy (in `promptBuilder.js`)
- **System preamble (shared):** "You are CareerPilot. NEVER give generic advice. Every recommendation MUST reference a specific skill in `missing` or a specific project/bullet. Output ONLY valid JSON matching the schema."
- **Schema is embedded** in each prompt so Gemini returns the exact shape the frontend expects (no post-mapping).
- **Mentor prompt** receives the grounding object + the rule: "If asked about readiness, cite the readiness score and the specific missing skills."

---

## 8. Error Handling Strategy

**Goal: the demo never shows a stack trace or a blank screen.**

### 8.1 Layered defense
| Layer | Failure | Handling |
|-------|---------|----------|
| **Upload** | Wrong type / >5MB | Reject client-side before request; inline message |
| **Parser** | Scanned/image PDF, no text | `PARSE_FAILED` → friendly "use a text-based PDF" + retry |
| **Gemini** | Timeout / 5xx / rate limit | Retry ×2 w/ backoff in `geminiClient` |
| **Gemini JSON** | Malformed output | `jsonGuard.repair()`; if fail → retry once; else `AI_BAD_JSON` |
| **Network** | Backend unreachable | Client catch → ErrorBanner + "Retry" button |
| **Demo last resort** | Anything fails live | `DEMO_MODE` loads pre-baked `analysisResult.json` |

### 8.2 Central backend handler (`errorHandler.js`)
- Catches all thrown errors, maps to `{ error: { code, message, retryable } }`.
- Logs full detail server-side; sends **safe friendly message** to client.
- Always HTTP 200-with-error-body for AI failures? **No** — use proper codes (400 client, 422 parse, 502 AI, 500 unknown) so the client can branch, but always with the friendly shape.

### 8.3 Frontend handling
- Every API call wrapped in try/catch inside hooks; sets `status='error'` + `error`.
- `<ErrorBanner>` shows message + conditional **Retry** (if `retryable`).
- A global **timeout guard** (25s) flips a long-running call into a friendly "taking longer than usual…" then offers DEMO_MODE fallback.

---

## 9. Deployment Strategy

**Optimize for "deploy once, demo from anywhere, near-zero config."**

### 9.1 Recommended setup
```
Frontend (client/)  →  Vercel  (static SPA, instant deploys, free)
Backend (server/)   →  Render  (Node web service, free tier) 
                        or Railway
Gemini API          →  Google AI Studio key (server-side ONLY)
```

### 9.2 Why this split
- **Frontend on Vercel:** fastest static hosting, automatic HTTPS, great for a polished SPA.
- **Backend on Render/Railway:** simplest Node deploy; the API key stays server-side (never shipped to the browser).
- **No DB to provision** → nothing else to configure.

### 9.3 Config
```
client/.env   VITE_API_BASE_URL=https://careerpilot-api.onrender.com
server/.env   GEMINI_API_KEY=***   PORT=8080   ALLOWED_ORIGIN=https://careerpilot.vercel.app
```
- CORS locked to the Vercel origin.
- `GET /api/health` for uptime checks (and to warm the free-tier dyno before demo).

### 9.4 Demo-day safeguards
- **Pre-warm the backend** 5 min before (free tiers cold-start).
- **Local fallback:** keep `npm run dev` for both apps runnable offline; if Wi-Fi dies, demo on `localhost`.
- **Pre-baked result JSON** committed for `DEMO_MODE`.
- **Record a 90-sec backup screen capture** of the full flow as the absolute last resort.

---

## 10. Detailed Implementation Order (38 Hours)

> Build the **happy path end-to-end first**, then harden, then polish. Never leave the core loop broken overnight.

### Phase 0 — Scaffold (Hrs 0–3)
1. `client` (Vite + React + Tailwind) and `server` (Express) skeletons.
2. `GET /api/health` + a button on Landing that pings it → **proves the pipe works end-to-end.**
3. Commit `roles.json` with all 6 roles (required / nice-to-have / keywords).

### Phase 1 — Parsing (Hrs 3–8)
4. `multipart` upload (multer memory, 5MB) + `FileDropzone` + `RoleSelector`.
5. `parserService` (pdf-parse / mammoth) → raw text.
6. Gemini Call #1 (structure) + `jsonGuard`. `POST /api/parse` returns `structuredResume`.
7. Store in context; show raw structured JSON on screen (temporary debug view).

### Phase 2 — Grounding + Analysis (Hrs 8–18)
8. `matchService` — deterministic skills vs `roles.json` → `matchObject`. **(Core innovation — test thoroughly.)**
9. `promptBuilder` + Gemini Call #2 → full `analysisResult` (health + readiness + gap + roadmap).
10. `POST /api/analyze`; wire `useAnalysis` to run parse→analyze in sequence with `status` updates.

### Phase 3 — Dashboard UI (Hrs 18–26)
11. `ReadinessScore` + `ScoreGauge`, `ResumeHealthReport`, `SkillGapMatrix`, `RoadmapTimeline`.
12. Global `Loader` + `ErrorBanner` wired to `status`.
13. **Checkpoint: full Upload → Dashboard works.** Commit + tag `v0-core`.

### Phase 4 — AI Mentor (Hrs 26–32)
14. `mentorService` + `POST /api/mentor` (grounding + history).
15. `MentorChat`, `MessageBubble`, `SuggestedQuestions` chips, `useMentorChat`.
16. Rehearse the 4 demo questions; tune the mentor prompt for crisp, grounded answers.

### Phase 5 — Hardening + Demo Safety (Hrs 32–36)
17. Error layers (§8), retries, timeouts, `DEMO_MODE` + pre-baked `analysisResult.json`.
18. `sessionStorage` mirror so refresh doesn't wipe the demo.
19. Deploy frontend (Vercel) + backend (Render); set CORS + env; warm the dyno.

### Phase 6 — Polish + Rehearse (Hrs 36–38)
20. Visual polish: animated gauge, consistent spacing, empty/loading states, mobile check.
21. Run the **3-minute demo script** 3× end-to-end (incl. a live judge-style question).
22. Record the 90-sec backup video. Final commit `v1-demo`.

### Cut-line rules (if behind)
- **Behind at Hr 26?** Skip the parse/analyze split — do one combined `/api/analyze` that accepts the file directly.
- **Behind at Hr 32?** Drop `/api/parse` debug view, drop roadmap durations selector (hardcode 24 weeks).
- **Never cut:** matchService grounding, the Mentor, and visual polish on Readiness + Skill Gap (these win the demo).

---

## Appendix — Technology Choices (Rationale)

| Choice | Why |
|--------|-----|
| **Vite (not CRA)** | Instant HMR, faster builds — saves time over 38h. |
| **Express (not Nest)** | Minimal ceremony; a thin orchestration layer is all that's needed. |
| **gemini-1.5-flash** | Low latency + cost; JSON mode; ideal for live demo responsiveness. |
| **Context + reducer (not Redux)** | Session-only state is small; Redux is overkill. |
| **No DB** | Per constraints; eliminates an entire failure surface and deploy step. |
| **multer memory storage** | No disk writes; file discarded after parse → privacy + simplicity. |
| **Deterministic matchService** | The single most important design decision: makes AI output evidence-based and hallucination-resistant. |

*End of Document.*
