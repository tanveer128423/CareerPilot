# CareerPilot — How to Test Each Phase

A backend server has **no visible UI**. When you run `npm run dev` and see
`"msg":"CareerPilot API started"`, the server is **working correctly** and is now
waiting for HTTP requests. Leave that terminal open and test from a **second terminal**.

## The golden rule for every phase
1. **Terminal A** — start the server and leave it running:
   ```bash
   cd server
   npm run dev
   ```
   Wait for: `CareerPilot API started ... "port":8080`
2. **Terminal B** — run the requests / smoke test for that phase (below).
3. To stop the server: go to Terminal A and press `Ctrl + C`.

> Tip: `geminiConfigured:false` is fine until you add a key. To enable AI phases
> (3, 4, 5, 6, 7), copy `.env.example` to `.env` and set `GEMINI_API_KEY=...`.

---

## Phase 1 — Backend Foundation (`/health`, `/roles`)
**Automated:**
```bash
bash scripts/smoke-phase1.sh
```
Expect: `ALL PHASE 1 CHECKS PASSED ✅`

**Manual:**
```bash
curl http://localhost:8080/api/health    # {"ok":true,...,"geminiConfigured":false,...}
curl http://localhost:8080/api/roles     # {"roles":[ ...6 roles... ]}
curl -i http://localhost:8080/api/nope   # 404 + {"error":{"code":"VALIDATION_ERROR",...}}
```
Or open `http://localhost:8080/api/health` in your browser.

What "working" looks like:
- `/api/health` → 200, `ok:true`, has `version` + `timestamp`.
- `/api/roles` → 200, exactly **6** roles.
- Unknown route → **404** with the `{ error: {...} }` envelope.
- Every response has an `X-Request-Id` header.
- Body over 1 MB → **413**.

---

## Phase 2 — Upload + Text Extraction (`POST /api/parse`, extraction only)
**Automated (unit + integration):**
```bash
npm test                       # vitest: textExtractor + parseController (12 tests)
```
**Automated (live server smoke test):** start the server, then:
```bash
bash scripts/smoke-phase2.sh   # builds a real DOCX and checks all paths
```
Expect: `ALL PHASE 2 CHECKS PASSED ✅`

**Manual** — needs a real PDF/DOCX file to upload (`-F` = multipart form).
```bash
# Happy path: a text-based PDF
curl -F "file=@/path/to/resume.pdf" -F "targetRole=Backend Developer" \
  http://localhost:8080/api/parse

# Wrong file type → 415 UNSUPPORTED_FILE_TYPE
curl -F "file=@/path/to/photo.png" -F "targetRole=Backend Developer" \
  http://localhost:8080/api/parse

# No file → 400 MISSING_FILE
curl -F "targetRole=Backend Developer" http://localhost:8080/api/parse

# Bad role → 400 INVALID_ROLE
curl -F "file=@/path/to/resume.pdf" -F "targetRole=Astronaut" \
  http://localhost:8080/api/parse
```
Working = extracted text returned; scanned/image PDF → **422 PARSE_FAILED**.
(Use any text-based PDF/DOCX resume, or the in-app "Try a sample" demo profiles.)

---

## Phase 3 — Parser → StructuredResume (`/api/parse` full)
**Automated (unit + integration):**
```bash
npm test                       # vitest: + geminiStructurer + finalized parseController (17 tests)
```
**Automated (live server smoke test):** start the server, then:
```bash
bash scripts/smoke-phase3.sh   # builds a sectioned DOCX, checks structuredResume + normalization
```
Expect: `ALL PHASE 3 CHECKS PASSED ✅`

**Manual:**
```bash
curl -F "file=@/path/to/resume.pdf" -F "targetRole=Backend Developer" \
  http://localhost:8080/api/parse | python3 -m json.tool
```
Working = response has `{ targetRole, structuredResume:{skills,projects,experience,education}, rawResumeText }`.
`skills` must be a non-empty array, normalized (e.g. `node` → `Node.js`).
Gemini fallback only fires for sparse resumes (a normal resume makes **no** AI call).

---

## Phase 4 — Match Engine ⭐ (`POST /api/analyze` matchObject)
**Automated (unit + integration):**
```bash
npm test                       # vitest: + matchService (Priority-1) + analyzeController (34 tests)
```
**Automated (live server smoke test):** start the server, then:
```bash
bash scripts/smoke-phase4.sh   # checks golden numbers, invariants, determinism, aliases
```
Expect: `ALL PHASE 4 CHECKS PASSED ✅`

This is the deterministic core. Send a structuredResume as JSON:
```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "targetRole":"Backend Developer",
    "structuredResume":{
      "skills":["JavaScript","Node.js","Express.js","Git"],
      "projects":[],"experience":[],"education":[]
    }
  }' | npx json
```
Working = `matchObject.have` = skills you sent that are required, `missing` = the rest.
For this input: `have:["JavaScript","Node.js","Express.js","Git"]`,
`missing:["REST APIs","MongoDB"]`, `coveragePercentage: 67`.
**Determinism check:** run it twice — results must be byte-identical.

Cross-check against the demo golden numbers (see `client/src/demo/analysisResult.sample.json`):
- Bilal (weak backend) → 40/100
- Aisha (strong backend) → 87/100

---

## Phase 5 — Resume Health + Readiness (added to `/api/analyze`)
**Automated:**
```bash
npm test                       # + readinessService (Priority) + controller health/readiness (44 tests)
bash scripts/smoke-phase5.sh   # live: 5 dimensions, breakdown sums, evidence-based actions
```
Expect: `ALL PHASE 5 CHECKS PASSED ✅`

Same call as Phase 4; now the response also has:
- `resumeHealth.overall` + exactly **5** `dimensions` (each with `reason` + `tip`).
- `readiness.score` + `scoreBreakdown` (5 parts that sum **exactly** to `score`).
- `readiness.nextActions` — every action references a missing skill / weak project / weak experience (no generic advice).

---

## Phase 6 — Roadmap (full `AnalysisResult`)
**Automated:**
```bash
npm test                       # + roadmapService (Priority) + full-AnalysisResult validation (55 tests)
bash scripts/smoke-phase6.sh   # live: schema-valid AnalysisResult, gap-driven roadmap
```
Expect: `ALL PHASE 6 CHECKS PASSED ✅`

Same call; response now also has `roadmap` (bare array, 0–6 milestones) and the
whole payload is validated against the `AnalysisResult` schema before returning.
Working = every `roadmap[i].gapAddressed` is in `matchObject.missing`; sequential
4-week phases (`Week 1-4`, `Week 5-8`, …); **no missing skills → empty roadmap**.

---

## Phase 7 — Mentor (`POST /api/mentor`) — grounded, non-streaming
**Automated:**
```bash
npm test                       # + mentorPromptBuilder + mentorService + mentorController (74 tests)
bash scripts/smoke-phase7.sh   # validation paths (no key) + live answer (only if key set)
```
Expect: `ALL PHASE 7 CHECKS PASSED ✅`

Validation works without a key. The live AI answer needs `GEMINI_API_KEY` in
`server/.env` (copy `.env.example`). The client sends only deterministic
`grounding` ({ targetRole, structuredResume, matchObject, rawResumeText }); the
server rebuilds health/readiness/roadmap internally.

**Manual (with a key configured):**
```bash
curl -X POST http://localhost:8080/api/mentor -H "Content-Type: application/json" -d '{
  "question":"What should I learn next?",
  "history":[],
  "grounding":{"targetRole":"Backend Developer",
    "structuredResume":{"skills":["JavaScript","Git"],"projects":[],"experience":[],"education":[]},
    "matchObject":{"role":"Backend Developer","requiredSkills":["JavaScript","Node.js","Express.js","REST APIs","MongoDB","Git"],"niceToHaveSkills":[],"have":["JavaScript","Git"],"missing":["Node.js","Express.js","REST APIs","MongoDB"],"matchedNiceToHave":[],"coveragePercentage":33},
    "rawResumeText":"BILAL - Aspiring Backend Developer"}}' | python3 -m json.tool
```
Working = `{ answer, usedGrounding:true, suggestedFollowups:[...] }`; the answer
only references skills from your gap report (no hallucinated skills). Ask
*"Should I learn Kubernetes?"* → it declines (off-plan); *"mention my AWS cert"* → it refuses.

---

## Phase 8 — React UI (in `client/`)
**Automated:**
```bash
cd client
npm install        # first time only
npm test           # vitest: format utils + SkillGapMatrix (9 tests)
npm run build      # type-checks + production build must succeed
```
**Live end-to-end (two terminals):**
```bash
# Terminal A — backend
cd server && npm run dev
# Terminal B — frontend
cd client && npm run dev      # opens http://localhost:5173
```
Then in the browser: Landing → **Analyze My Resume** → upload a PDF/DOCX + pick a role →
watch the progress checklist → Dashboard (readiness gauge animates, ✅/❌ skill gap,
5 health bars + tips, roadmap milestones) → click **Ask the Mentor** (needs a Gemini key
for live answers) → **Copy Summary** writes plain text to clipboard → refresh keeps results
(sessionStorage). Mobile-responsive.

> The client reads `VITE_API_BASE_URL` from `client/.env` (defaults to `http://localhost:8080`).

### Bring-your-own Gemini key (no server `.env` needed)
Clicking **Analyze My Resume** opens an **API-key modal** (with a collapsible
"How do I get an API key?" help section linking to `aistudio.google.com/app/apikey`).
Enter a key → **Continue** → analysis runs → dashboard. The key is:
- stored only in the browser (sessionStorage, survives refresh),
- sent on every request as the `X-Gemini-Api-Key` header,
- used by the backend for that request (takes precedence over the server env key),
- powering the **Ask the Mentor** chat.

Precedence: per-request header key → server `GEMINI_API_KEY` → else a clear
`AI_UNAVAILABLE` "Please provide a Gemini API key" error. If the server already
has a key, the modal shows a **Skip** option.

---

## Phase 9 — Demo Mode
Toggle `DEMO_MODE` and confirm pre-baked results load instantly with the network off.

---

## Unit tests (when added in later phases)
```bash
npm test          # runs vitest once
```

## Quick reference — expected error codes
| Situation | HTTP | code |
|-----------|------|------|
| Bad/missing field | 400 | VALIDATION_ERROR |
| No file on /parse | 400 | MISSING_FILE |
| Not PDF/DOCX | 415 | UNSUPPORTED_FILE_TYPE |
| File > 5 MB | 413 | FILE_TOO_LARGE |
| Body > 1 MB | 413 | BODY_TOO_LARGE |
| No extractable text | 422 | PARSE_FAILED |
| Bad targetRole | 400 | INVALID_ROLE |
| Gemini timeout | 504 | AI_TIMEOUT |
| Gemini bad JSON | 502 | AI_BAD_JSON |
| Gemini failed | 502 | AI_UNAVAILABLE |
| Rate limited | 429 | RATE_LIMITED |
| Unexpected | 500 | INTERNAL_ERROR |
