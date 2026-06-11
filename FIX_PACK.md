# CareerPilot — FIX PACK v1.0

**Author:** Principal Engineer / Hackathon CTO
**Purpose:** Apply all critical and medium-priority fixes from the Build Readiness Report. This is a **surgical change list** — not a rewrite. Apply each change to the named file. After applying, the suite is internally consistent and buildable by a solo developer in 38 hours.

**Legend:** 🔴 critical · 🟠 medium · ✅ new deliverable

---

# Section 1: Required Document Changes

## Fix 1 — Remove Streaming Conflicts 🔴
**Decision:** Mentor is **non-streaming** (single validated JSON response). Keep the typing indicator as a *purely cosmetic* loader. Remove all stream/SSE references.

### 1a. `PRD.md` (line 338 — Performance NFR)
**Current:**
```
| **Performance** | Analysis < 15 sec; UI interactions < 200 ms; Mentor responses stream. |
```
**Replace with:**
```
| **Performance** | Full analysis < 30 sec; UI interactions < 200 ms; Mentor replies < 8 sec (non-streaming). |
```
**Why:** Removes the stream promise the API can't keep (JSON-mode responses are returned whole) and sets a realistic latency (see Fix 4).

### 1b. `PRD.md` (line 355 — Risk R3)
**Current:**
```
| R3 | **Slow/failed LLM during demo** | High | Medium | Stream responses; cache a demo resume's full results; pre-recorded fallback. |
```
**Replace with:**
```
| R3 | **Slow/failed LLM during demo** | High | Medium | Pre-warm dyno; cache a demo resume's full results (DEMO_MODE); typing indicator for perceived speed. |
```
**Why:** Drops "stream responses"; replaces with the fallbacks that actually exist.

### 1c. `ARCHITECTURE.md` (line 102)
**Current:**
```
│       │   └── useMentorChat.js     # chat state + streaming
```
**Replace with:**
```
│       │   └── useMentorChat.js     # chat state (non-streaming request/response)
```
**Why:** The hook does a single POST and awaits the full JSON; no streaming.

### 1d. `UI.md` (line 465 — Mentor User Flow)
**Current:**
```
Open via FAB / sidebar / section deep-links (pre-seeds a question). Type or tap a chip → optimistic user bubble → typing indicator → streamed `answer` → new `suggestedFollowups` chips appear. History kept in `AppContext` (sent each turn per stateless API).
```
**Replace with:**
```
Open via FAB / sidebar / section deep-links (pre-seeds a question). Type or tap a chip → optimistic user bubble → typing indicator (cosmetic, shown while awaiting) → full `answer` rendered when the response resolves → new `suggestedFollowups` chips appear. History kept in `AppContext` (sent each turn per stateless API).
```
**Why:** Keeps the typing indicator UX but clarifies it is a loader for a single non-streamed response.

> **No changes needed** in `API_CONTRACTS.md`/`SCHEMAS.md` — `/api/mentor` was already non-streaming JSON. The conflict existed only in PRD/UI/ARCH wording.

---

## Fix 2 — Resolve Export Conflict (Export PDF → Copy Summary) 🔴
**Decision:** Cut "Export PDF" from MVP entirely. Replace with a client-only **"Copy Summary"** (formats the `analysisResult` into plain text and writes to clipboard). No new endpoint, no schema.

### 2a. `PRD.md` (line 87 — User Journey diagram)
**Current:** `[Chat with AI Career Mentor] → Save / Export Plan`
**Replace with:** `[Chat with AI Career Mentor] → Copy Summary`

### 2b. `PRD.md` (line 99 — Journey table, Retain row)
**Current:** `| 8. Retain | Exports plan | Shareable summary | Committed |`
**Replace with:** `| 8. Retain | Copies summary to clipboard | Plain-text plan copied | Committed |`

### 2c. `PRD.md` (line 187 — Stretch table)
**Current:** `| Export plan as PDF | Tangible takeaway | Low |`
**Replace with:** `| Export plan as PDF (post-MVP) | Tangible takeaway | Low |`
**Why:** Keeps PDF explicitly as future, not MVP.

### 2d. `PRD.md` (line 294 — User Story US-09)
**Current:** `- **US-09:** As a user, I can export my plan so I can revisit it later.`
**Replace with:** `- **US-09:** As a user, I can copy a plain-text summary of my plan to the clipboard so I can paste it anywhere.`

### 2e. `PRD.md` (lines 328–330 — FR-7)
**Current:**
```
### FR-7: Dashboard & Export
- FR-7.1 Single dashboard shows all outputs.
- FR-7.2 Allow export/copy of the plan (PDF or text).
```
**Replace with:**
```
### FR-7: Dashboard & Copy Summary
- FR-7.1 Single dashboard shows all outputs.
- FR-7.2 "Copy Summary" button serializes analysisResult to plain text and writes it to the clipboard (client-only; no backend call).
```

### 2f. `UI.md` (line 220 — Dashboard header diagram)
**Current:** `│  ◆ CareerPilot     Backend Developer ▾    [⤓ Export] [↺ New] │  ← sticky header`
**Replace with:** `│  ◆ CareerPilot     Backend Developer    [⧉ Copy Summary] [↺ New] │  ← sticky header`
**Why:** Removes the Export button AND the role-switcher dropdown caret (see Fix 9).

### 2g. `UI.md` (line 236 — Dashboard Components)
**Current:** ``DashboardHeader` (role switcher re-runs `/analyze`, Export, "Start New"), ...``
**Replace with:** ``DashboardHeader` (static role label, "Copy Summary", "Start New"), ...``

### 2h. `UI.md` (line 242 — Dashboard User Flow)
**Current:** `Lands post-analysis. Scroll or click nav to jump. Switch role → confirm → re-analyze (loading overlay on content, sidebar persists). Export → PDF/clipboard. Mentor reachable anytime.`
**Replace with:** `Lands post-analysis. Scroll or click nav to jump. "Copy Summary" writes a plain-text plan to the clipboard (toast confirms). "Start New" resets to Upload. Mentor reachable anytime.`
**Why:** Removes role re-analysis (Fix 9) and PDF export in one edit.

---

## Fix 3 — Remove Name Personalization 🟠
**Decision:** The mentor never assumes a user name (none exists in `StructuredResume`). Use a generic greeting.

### 3a. `UI.md` (line 439 — Mentor intro bubble)
**Current:**
```
│  ◆ Mentor:  Hi Aisha — I've reviewed your     │  ← intro, left bubble
│   resume. Your readiness is 68. Ask me         │
│   anything about your path.                    │
```
**Replace with:**
```
│  ◆ Mentor:  Hi! I've reviewed your resume for  │  ← intro, left bubble
│   Backend Developer. Your readiness is 68.     │
│   Ask me anything about your path.             │
```

### 3b. `UI.md` (line ~488 — Mentor Empty State)
**Current (find this sentence):** `Warm mentor greeting referencing their data (name if available, readiness score) + 3 suggested questions.`
**Replace with:** `Warm mentor greeting referencing their data (target role + readiness score; never a name) + 3 suggested questions.`

### 3c. `PROMPTS.md` (§6 Example Output — mentor answer begins "Realistically, yes...")
No name appears in the example answer, so no change needed there. **Add one line** to the Mentor System Prompt rules block (`PROMPTS.md §6`, after rule 4):
**Insert:**
```
4b. NEVER address the user by name or invent personal details. The resume is parsed to
    skills/projects/experience/education only — there is no name field. Use neutral
    second-person ("you", "your resume").
```
**Why:** Hard-stops Copilot/Gemini from fabricating a name. Aligns with `StructuredResume` having no name field.

---

## Fix 4 — Realistic Performance Targets 🟠
**Decision:** Align all latency targets to the real pipeline: 2 sequential Gemini calls + possible cold start.

### 4a. `PRD.md` — already corrected in Fix 1a (`Full analysis < 30 sec … Mentor replies < 8 sec`).

### 4b. `PRD.md` (line ~211 — MVP Success Criteria "under 60 seconds")
No change required — "< 60 seconds" end-to-end remains the user-facing promise and is consistent with < 30s analysis + reading time.

### 4c. `ARCHITECTURE.md` (§7.2 geminiClient contract — timeouts) & `API_CONTRACTS.md` Appendix C
**Confirm both read:** parse/analyze timeout **20s**, mentor timeout **15s**, retries **2**. These already match. **Add a note** under `API_CONTRACTS.md` Appendix C:
```
| End-to-end analysis budget | ~30s (parse ≤ 20s + analyze ≤ 20s, typically < 15s combined) |
```
**Why:** Makes the 30s PRD target traceable to the timeout math. PRD and Architecture now agree.

---

## Fix 5 — Complete All Six Role Definitions ✅
**Decision:** Author the full `roles.json` (all 6 roles). This is the grounding backbone and must be 100% specified, not 33%.

**Action:** Create `server/src/data/roles.json` with the content below. (Also delivered as a standalone file alongside this FIX_PACK.)

```json
{
  "roles": [
    {
      "id": "frontend-developer",
      "name": "Frontend Developer",
      "required": ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive Design"],
      "niceToHave": ["TypeScript", "Tailwind CSS", "Redux", "Testing", "Accessibility", "Webpack"],
      "keywords": ["UI", "component", "responsive", "accessibility", "SPA", "DOM", "state"]
    },
    {
      "id": "backend-developer",
      "name": "Backend Developer",
      "required": ["Node.js", "Express.js", "REST APIs", "MongoDB", "SQL", "Authentication", "Git"],
      "niceToHave": ["Docker", "Redis", "Unit Testing", "CI/CD", "AWS", "TypeScript"],
      "keywords": ["API", "database", "server", "microservices", "JWT", "endpoint", "schema"]
    },
    {
      "id": "full-stack-developer",
      "name": "Full Stack Developer",
      "required": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
      "niceToHave": ["TypeScript", "SQL", "Authentication", "Docker", "Testing", "CI/CD", "Tailwind CSS"],
      "keywords": ["frontend", "backend", "API", "database", "component", "server", "end-to-end"]
    },
    {
      "id": "react-developer",
      "name": "React Developer",
      "required": ["JavaScript", "React", "HTML", "CSS", "State Management", "Git"],
      "niceToHave": ["TypeScript", "Redux", "React Router", "Tailwind CSS", "Testing", "Next.js"],
      "keywords": ["component", "hooks", "state", "props", "JSX", "SPA", "render"]
    },
    {
      "id": "nodejs-developer",
      "name": "Node.js Developer",
      "required": ["Node.js", "Express.js", "JavaScript", "REST APIs", "Git", "Asynchronous Programming"],
      "niceToHave": ["MongoDB", "SQL", "TypeScript", "Authentication", "Unit Testing", "Docker"],
      "keywords": ["API", "server", "async", "middleware", "npm", "event loop", "endpoint"]
    },
    {
      "id": "software-engineer-intern",
      "name": "Software Engineer Intern",
      "required": ["Data Structures", "Algorithms", "Git", "JavaScript", "Problem Solving", "OOP"],
      "niceToHave": ["React", "Node.js", "SQL", "Unit Testing", "Python", "REST APIs"],
      "keywords": ["coding", "project", "internship", "debugging", "version control", "teamwork"]
    }
  ]
}
```
**Why:** Removes M1 (only 2/6 roles existed). Copilot can no longer fabricate skill lists. Skills are chosen to be detectable from typical student resumes and to produce satisfying ✅/❌ demo contrasts.

---

## Fix 6 — First-Class Skill Alias Dictionary ✅
**Decision:** Matching is only as deterministic as its alias map. Ship `server/src/data/skillAliases.json` as a first-class deliverable. `matchService` lowercases/trims both sides and resolves aliases → canonical skill before comparing to `roles.json`.

**Action:** Create `server/src/data/skillAliases.json`:

```json
{
  "Node.js": ["node", "nodejs", "node js", "node.js"],
  "Express.js": ["express", "expressjs", "express js", "express.js"],
  "React": ["react", "reactjs", "react.js", "react js"],
  "MongoDB": ["mongo", "mongodb", "mongo db"],
  "JavaScript": ["js", "javascript", "ecmascript", "es6", "es2015"],
  "TypeScript": ["ts", "typescript"],
  "REST APIs": ["rest", "rest api", "rest apis", "restful", "restful api", "restful apis", "rest-api"],
  "SQL": ["sql", "mysql", "postgresql", "postgres", "sqlite", "relational database", "rdbms"],
  "HTML": ["html", "html5"],
  "CSS": ["css", "css3"],
  "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
  "Redux": ["redux", "redux toolkit", "rtk"],
  "React Router": ["react router", "react-router", "react-router-dom"],
  "Next.js": ["next", "nextjs", "next.js", "next js"],
  "Git": ["git", "github", "gitlab", "version control", "vcs"],
  "Authentication": ["auth", "authentication", "jwt", "json web token", "oauth", "login system", "passport.js"],
  "Responsive Design": ["responsive", "responsive design", "responsive web design", "mobile-first", "media queries"],
  "State Management": ["state management", "state", "context api", "useReducer", "global state"],
  "Asynchronous Programming": ["async", "asynchronous", "async/await", "promises", "callbacks", "event loop"],
  "Unit Testing": ["unit testing", "testing", "jest", "mocha", "vitest", "react testing library", "rtl"],
  "Docker": ["docker", "containers", "containerization"],
  "Redis": ["redis", "cache", "in-memory store"],
  "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment", "github actions", "pipeline"],
  "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
  "Webpack": ["webpack", "bundler", "module bundler"],
  "Accessibility": ["accessibility", "a11y", "wcag", "aria"],
  "Data Structures": ["data structures", "ds", "arrays", "linked list", "trees", "graphs", "hash maps"],
  "Algorithms": ["algorithms", "algo", "dsa", "sorting", "searching", "dynamic programming"],
  "Problem Solving": ["problem solving", "problem-solving", "leetcode", "competitive programming", "hackerrank"],
  "OOP": ["oop", "object oriented", "object-oriented programming", "object oriented programming"],
  "Python": ["python", "py", "python3"]
}
```

**Add to `COPILOT_INSTRUCTIONS.md` §5 (API rules) and §10 (Testing):**
```
- matchService MUST resolve skills via skillAliases.json: lowercase+trim the resume skill,
  look it up against each canonical skill's alias list, map to the canonical name, THEN
  compare to roles.json required[]. Unknown skills pass through unchanged (still usable as evidence).
- Test (Priority 1): "node", "NODE.JS", "Express JS" all resolve to canonical "Node.js"/"Express.js".
```
**Why:** Removes M3/T2/D1 — the single biggest demo risk (a wrong ❌ on a skill the resume clearly lists). Determinism is now backed by a concrete, testable dictionary.

---

## Fix 7 — Resume Health Hallucination Risk 🔴
**Decision: OPTION A — pass raw resume text into analysis.**

### Why Option A beats Option B for a hackathon MVP
| | Option A (pass raw text) | Option B (reduce to 3 deterministic dims) |
|--|--------------------------|-------------------------------------------|
| Demo impact | **Keeps all 5 dimensions** → richer, more impressive Health card | Loses Formatting + Impact Metrics → weaker visual |
| Doc churn | **Small** — add one `rawText` field + 1 prompt input line | **Large** — edit SCHEMAS (dim count), UI (5 bars→3), PROMPTS, API_CONTRACTS |
| Effort | Pass a string through 2 endpoints | Re-thread the whole Health feature |
| Accuracy | Formatting/Impact become **real, evidence-based** | Eliminates the risk by removing the feature |

Option A is **less work AND a better demo**. We add the raw text (truncated) to the resume object so the AI can actually *see* bullets, dates, and formatting it is scoring.

### 7a. `SCHEMAS.md #4 StructuredResume` — add optional `rawText`
**Current (properties block):**
```json
    "education": { "type": "array", "items": { "$ref": "Education" }, "maxItems": 20 },
    "rawTextLength": { "type": "integer", "minimum": 0 }
```
**Replace with:**
```json
    "education": { "type": "array", "items": { "$ref": "Education" }, "maxItems": 20 },
    "rawTextLength": { "type": "integer", "minimum": 0 },
    "rawText": { "type": "string", "maxLength": 8000 }
```
And in the TS interface, add: `rawText?: string;`
**Why:** Carries truncated raw text (≤ 8000 chars) with the resume so Formatting/Impact can be scored from real evidence. Optional so older payloads still validate.

### 7b. `API_CONTRACTS.md` — `/api/parse` success returns `rawText`
In the `structuredResume` success example, **add** `"rawText": "AISHA KHAN\nComputer Science Student ...<truncated to 8000 chars>"` alongside `rawTextLength`. Note in field reference: `rawText` = first 8000 chars of extracted text, used by `/analyze` for formatting/impact scoring.

### 7c. `API_CONTRACTS.md` — `/api/analyze` request accepts `structuredResume.rawText`
No new top-level field needed (it travels inside `structuredResume`). Add a validation note: `structuredResume.rawText` optional, ≤ 8000 chars.

### 7d. `PROMPTS.md §2` (Resume Health) — add `rawText` as an input and instruct its use
**Current (Input Variables table, add row):**
```
| `structuredResumeJson` | JSON | `/parse` output |
```
**Add row beneath:**
```
| `rawResumeText` | string | `structuredResume.rawText` (≤8000 chars) — REQUIRED for formatting & impactMetrics |
```
**And in the System Prompt**, append rule:
```
9. Score `formatting` and `impactMetrics` ONLY from the provided raw resume text (bullets,
   dates, layout). If raw text is empty, set those two scores to a neutral 60 and say
   "Raw text unavailable; structural review limited." Never fabricate bullet counts.
```
**And in the User Prompt Template**, add: `RAW RESUME TEXT:\n"""{{rawResumeText}}"""`
**Why:** Formatting/Impact are now grounded in text the model can actually see; the empty-text fallback prevents hallucinated "1 of 8 bullets" claims.

### 7e. `ARCHITECTURE.md §7.1` — note raw text flow
Add one line to the pipeline notes: *"`/parse` returns `rawText` (truncated 8000 chars); the client passes it inside `structuredResume` to `/analyze`, where the combined prompt uses it for the formatting & impactMetrics dimensions only."*

---

## Fix 8 — Readiness Score Double-Counting 🔴
**Problem:** `technicalSkills = (have/required)×30` and `skillGaps = (1 − missing/required)×20` are the **same ratio** (since `have/required = 1 − missing/required`). 50 of 100 points measured one signal twice.

**Decision:** Remove the `skillGaps` component. Redistribute into 4 **distinct** signals.

### New weights (sum = 100)
| Component | Old | **New** | Signal (now distinct) |
|-----------|-----|---------|-----------------------|
| `technicalSkills` | 30 | **35** | Skill coverage (have/required) — the ONLY skill-coverage term |
| `projects` | 25 | **30** | Project depth, relevance, tech-stack signal |
| `experience` | 15 | **20** | Internships/work/relevant experience |
| `roleAlignment` | 10 | **15** | Holistic fit (seniority, project↔role match, keyword presence) |
| ~~`skillGaps`~~ | ~~20~~ | **removed** | (was duplicate of technicalSkills) |

### 8a. `PRD.md §5.2` (Career Readiness weights table, lines ~122–127)
**Current:**
```
| Technical Skills | 30% | Skills matched vs role dataset |
| Projects | 25% | Project quality & relevance |
| Experience | 15% | Internships/work/extracurriculars |
| Skill Gaps | 20% | % of required skills missing (inverse) |
| Role Alignment | 10% | Fit between resume and selected role |
```
**Replace with:**
```
| Technical Skills | 35% | Skill coverage (have ÷ required) — single skill-coverage signal |
| Projects | 30% | Project depth, relevance, and tech-stack signal |
| Experience | 20% | Internships/work/extracurriculars |
| Role Alignment | 15% | Holistic fit (seniority, project↔role match, keywords) |
```
**Why:** Eliminates the double-count; four orthogonal signals.

### 8b. `PROMPTS.md §3` (SCORING block, lines 246–251)
**Current:**
```
- technicalSkills (0-30): proportion of required skills present (have / required) * 30.
- projects (0-25): relevance, depth, and role-fit of listed projects.
- experience (0-15): internships/work/relevant experience present.
- skillGaps (0-20): inverse of missing ratio = (1 - missing/required) * 20.
- roleAlignment (0-10): overall fit between the resume and the target role.
"score" = technicalSkills + projects + experience + skillGaps + roleAlignment (0-100).
```
**Replace with:**
```
- technicalSkills (0-35): proportion of required skills present = (have / required) * 35. THIS IS THE ONLY skill-coverage term.
- projects (0-30): depth, relevance, and role-fit of listed projects (NOT skill coverage).
- experience (0-20): internships/work/relevant experience present.
- roleAlignment (0-15): holistic fit — seniority, project↔role match, keyword presence (NOT skill coverage).
"score" = technicalSkills + projects + experience + roleAlignment (0-100). Do NOT add a skill-gap term.
```

### 8c. `PROMPTS.md §3` Combined prompt rule (line ~626) — mirror the same change
**Current:** `5. readiness: breakdown technicalSkills(0-30)+projects(0-25)+experience(0-15)+skillGaps(0-20)+roleAlignment(0-10) = score.`
**Replace with:** `5. readiness: breakdown technicalSkills(0-35)+projects(0-30)+experience(0-20)+roleAlignment(0-15) = score. No skillGaps term.`

### 8d. `SCHEMAS.md #8 CareerReadiness` — update breakdown schema + bounds
**Current (breakdown properties):**
```json
        "technicalSkills": { "type": "integer", "minimum": 0, "maximum": 30 },
        "projects": { "type": "integer", "minimum": 0, "maximum": 25 },
        "experience": { "type": "integer", "minimum": 0, "maximum": 15 },
        "skillGaps": { "type": "integer", "minimum": 0, "maximum": 20 },
        "roleAlignment": { "type": "integer", "minimum": 0, "maximum": 10 }
```
**Replace with:**
```json
        "technicalSkills": { "type": "integer", "minimum": 0, "maximum": 35 },
        "projects": { "type": "integer", "minimum": 0, "maximum": 30 },
        "experience": { "type": "integer", "minimum": 0, "maximum": 20 },
        "roleAlignment": { "type": "integer", "minimum": 0, "maximum": 15 }
```
**Also** change the `required` array from `["technicalSkills", "projects", "experience", "skillGaps", "roleAlignment"]` to `["technicalSkills", "projects", "experience", "roleAlignment"]`, update the TS interface (remove `skillGaps`), the validation-rule rows, and the example object to:
```json
  "breakdown": { "technicalSkills": 18, "projects": 22, "experience": 15, "roleAlignment": 13 }
```
(18+22+15+13 = **68**, preserving the headline score used across all docs — no ripple to the many "68" references.)

### 8e. `API_CONTRACTS.md` `/api/analyze` example — update the same breakdown
Replace `"breakdown": { "technicalSkills": 21, "projects": 17, "experience": 9, "skillGaps": 13, "roleAlignment": 8 }` with `"breakdown": { "technicalSkills": 18, "projects": 22, "experience": 15, "roleAlignment": 13 }` (everywhere it appears: contracts + SCHEMAS examples + PROMPTS example).
**Why:** Keeps every example consistent and summing to 68 with the new 4-signal model.

---

## Fix 9 — Simplify Architecture for a Solo Dev 🟠
**Decision:** Cut optionality. One flow path, no duration selector, no dashboard re-analysis, two fallback layers (not three).

### 9a. Duration selector → hardcode 24 weeks
- `API_CONTRACTS.md` `/api/analyze` request: **remove** the `durationWeeks` request field and its validation row. Roadmap output is always 24 weeks.
- `SCHEMAS.md`: keep `Roadmap.durationWeeks` in the **output** (fixed value `24`); change `DurationWeeks` type usage in `AnalyzeRequest` — remove the optional `durationWeeks?` request field.
- `PROMPTS.md §5`: replace `{{durationWeeks}}` with a fixed `24`; remove `durationWeeks` from input variables.
- `UI.md §2` (Upload) and `§7` (Roadmap): **remove** the `DurationSegmented [4][8][12][24]` control from both Upload and Roadmap. Roadmap header reads `Your Roadmap · 24 weeks` (static).
- `COPILOT_INSTRUCTIONS.md §4` reducer: remove `durationWeeks` from state.

### 9b. Dashboard role re-analysis → removed (done in Fix 2f/2g/2h)
Role is selected once on Upload. Dashboard shows a **static** role label. No role dropdown, no re-run.

### 9c. Single AI flow path
- **Declare the Combined Analyze Prompt (`PROMPTS.md Appendix A`) as THE production path** for `/api/analyze` (one Gemini call → `resumeHealth + readiness + skillGap + roadmap`). The separate per-feature prompts (§2–§5) are **reference/debug only** — add a banner at the top of §2: *"Reference spec. Production uses the Combined Analyze Prompt (Appendix A) in a single call."*
- Pipeline = **2 Gemini calls total**: `/parse` (structure + rawText) → `/analyze` (combined).
- `COPILOT_INSTRUCTIONS.md §7`: change rule 7 to: *"Always use the Combined Analyze Prompt for `/api/analyze`. Never implement the split per-feature prompts as the runtime path."*

### 9d. Fallbacks → keep two, cut one
Keep **DEMO_MODE pre-baked result** + **sessionStorage mirror**. Cut the "pre-recorded 90-sec video" from the *required* list (move to optional in `ARCHITECTURE.md §9.4` / `§10 Phase 6`).
**Why:** Less surface area = fewer ways to break. The two software fallbacks already cover live failure.

---

# Section 2: Final Architecture Decisions

### ✅ KEEP (MVP — the winning core)
1. Resume upload + parse (`/api/parse`) returning `structuredResume` **+ `rawText`**.
2. Deterministic `matchService` grounded by **complete `roles.json` (6 roles)** + **`skillAliases.json`**.
3. **Combined `/api/analyze`** (single Gemini call) → Resume Health (5 dims, raw-text-grounded), Career Readiness (**new 4-signal score**), Evidence-Based Skill Gap, 24-week Roadmap.
4. **AI Career Mentor** (`/api/mentor`, non-streaming, grounded, generic greeting). ← the wow factor.
5. Single dashboard (static role label) + **Copy Summary** (clipboard).
6. Two demo fallbacks: DEMO_MODE + sessionStorage mirror.
7. Polished UI (animated gauge, skill-gap chips, typing indicator).

### ✂️ CUT (not in MVP)
1. Export to PDF → replaced by Copy Summary.
2. Duration selector (4/8/12/24) → hardcoded 24 weeks.
3. Dashboard role-switcher re-analysis → role chosen once.
4. `skillGaps` readiness component → removed (double-count).
5. Streaming mentor / SSE → non-streaming.
6. Name personalization.
7. Split per-feature analysis prompts as a runtime path → reference only.
8. Pre-recorded video as a *required* fallback → optional.
9. Dark-mode tokens → optional polish.

### 🕒 POSTPONE (future scope, post-hackathon)
1. AI mock interview (full simulation + scoring).
2. PDF export, accounts/auth, saved history, progress tracking.
3. Live job-board integration; LinkedIn import.
4. Expanded role dataset (data, design, PM, DevOps, mobile).
5. Voice input for mentor; resume rewrite; cover letters; multi-language.

---

# Section 3: Copilot Safety Rules (append to COPILOT_INSTRUCTIONS.md §0 Golden Rules)

Add these as Golden Rules **9–16** so Copilot cannot regenerate the resolved conflicts:

```
9.  MENTOR IS NON-STREAMING. /api/mentor returns one complete MentorResponse JSON,
    validated by Ajv. Never implement SSE, ReadableStream, res.write chunks, or
    token streaming. The "typing indicator" is a cosmetic loader only.

10. NO EXPORT ENDPOINT. There is no /api/export and no PDF generation. "Copy Summary"
    is client-only: serialize analysisResult to plain text and call navigator.clipboard.

11. NO USER NAME. StructuredResume has no name/contact field. Never add one. The mentor
    greets generically ("Hi! I've reviewed your resume for {role}…"). Never invent a name.

12. SINGLE ANALYSIS CALL. /api/analyze uses the Combined Analyze Prompt (PROMPTS.md
    Appendix A) — ONE Gemini call producing resumeHealth+readiness+skillGap+roadmap.
    Do not implement the split per-feature prompts at runtime.

13. ROADMAP IS 24 WEEKS, FIXED. No durationWeeks request field, no duration selector UI.
    roadmap.durationWeeks output is always 24.

14. READINESS HAS 4 COMPONENTS ONLY: technicalSkills(35)+projects(30)+experience(20)
    +roleAlignment(15)=100. There is NO skillGaps component. Skill coverage is counted
    exactly ONCE (in technicalSkills).

15. MATCHING USES skillAliases.json. matchService lowercases/trims and resolves aliases
    to canonical skill names BEFORE comparing to roles.json. Never let Gemini decide
    have/missing. Load roles.json (6 roles) and skillAliases.json from server/src/data.

16. RAW TEXT FOR HEALTH ONLY. structuredResume.rawText (≤8000 chars) is used solely for
    the formatting and impactMetrics dimensions. If absent, those two scores default to
    60 with a stated limitation — never fabricate bullet counts.
```

**Also update `COPILOT_INSTRUCTIONS.md` Appendix A (Do/Don't):**
```
| ✅ Do | ❌ Don't |
| Non-streaming mentor + cosmetic typing dots | SSE / token streaming for mentor |
| Client-only Copy Summary via clipboard | /api/export or server PDF generation |
| Generic mentor greeting (role + score) | Greet the user by name |
| One combined /api/analyze Gemini call | Split per-feature analysis calls at runtime |
| Readiness = 4 components (no skillGaps) | A skillGaps readiness term (double-count) |
| Resolve skills via skillAliases.json | Raw string compare against roles.json |
| Fixed 24-week roadmap | durationWeeks selector / request field |
```

---

# Section 4: Updated Build Readiness Score

### Before fixes: **8.3 / 10**

### After applying this Fix Pack: **9.4 / 10**

| Dimension | Before | After | Change |
|-----------|--------|-------|--------|
| Internal consistency | 7.5 | **9.5** | Streaming/export/name/perf conflicts resolved |
| Grounding integrity | 7.0 | **9.5** | 6/6 roles + alias dictionary + raw-text health |
| Scoring soundness | 6.5 | **9.5** | Double-count removed; 4 orthogonal signals |
| Solo-build feasibility | 8.5 | **9.5** | One flow path; selectors/re-analysis cut |
| Copilot safety | 8.0 | **9.5** | 8 new hard rules block regenerating conflicts |
| Demo robustness | 8.0 | **9.0** | Alias map kills the #1 demo risk; fallbacks intact |

**Why not 10:** Residual execution risk remains inherent to any 38h solo build — live Gemini latency/quota on demo day and the quality of the (now-complete but unbattle-tested) `roles.json` against real resumes. These are *operational* risks mitigated by DEMO_MODE + pre-warming, not documentation gaps.

### Net effect
The suite is now **lean, internally consistent, and unambiguous**. Every cross-document conflict the report found is closed, the grounding backbone is 100% specified, the readiness score is defensible to a CTO, and Copilot has explicit guardrails. A solo developer can build this reliably in 38 hours and demo it without the credibility-killing failure modes.

*End of Fix Pack.*
