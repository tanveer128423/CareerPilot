# CareerPilot — Hackathon Preparation Pack

Everything needed to **build fast** and **demo to win** once the hackathon starts (Friday 8:30 PM). Nothing here is app code — these are preparation assets.

## Contents
| File | Section | Use it to… |
|------|---------|-----------|
| `01-DEMO-RESUMES.md` | 1 | 4 ready-to-upload resumes (strong/weak × backend/full-stack) |
| `02-EXPECTED-RESULTS.md` | 2 | **Engine-verified** expected outputs — validate build + pre-bake DEMO_MODE |
| `03-MENTOR-CONVERSATIONS.md` | 3 | 20 grounded mentor Q&A (also the canned demo answers) |
| `04-DEMO-SCRIPT.md` | 4 | The 3-minute winning demo, minute-by-minute |
| `05-JUDGE-QA.md` | 5 | 50 judge questions: why asked, best answer, mistake to avoid |
| `06` → `copilot-prompts/` | 6 | 9 phase files with exact Copilot prompts |
| `07-TEST-DATASET.md` | 7 | 10 verified test cases (regression fixtures) |
| `08-FAILURE-RECOVERY.md` | 8 | What to do when Gemini/upload/Render/Wi-Fi fails |
| `09-WINNING-STRATEGY.md` | 9 | Brutally honest judge analysis + Top-3 probability |

## Copilot Prompt Library (Section 6)
Build **in order**; don't start a phase until the previous passes acceptance.
```
copilot-prompts/01-phase1-backend.md      Backend foundation, /health, /roles
copilot-prompts/02-phase2-upload.md       Upload + text extraction
copilot-prompts/03-phase3-parser.md       /api/parse -> StructuredResume
copilot-prompts/04-phase4-match-engine.md /api/analyze -> matchObject ⭐
copilot-prompts/05-phase5-analysis.md     + Resume Health + Readiness
copilot-prompts/06-phase6-roadmap.md      + Roadmap (full AnalysisResult)
copilot-prompts/07-phase7-mentor.md       /api/mentor (grounded, non-streaming)
copilot-prompts/08-phase8-ui.md           React UI (full flow)
copilot-prompts/09-phase9-demo.md         Demo Mode + warm script
```

## Golden numbers to memorize (engine-verified)
- **Bilal (Weak Backend): 40/100** — missing Node.js, Express.js, REST APIs, MongoDB.
- **Aisha (Strong Backend): 87/100** — 6/6 skills, no roadmap.
- **Chen (Full Stack): 86/100** — 9/9 skills.
- **Dana (Weak Full Stack): 45/100** — missing Node/Express/REST/MongoDB/Git.

## The three words to say repeatedly
**deterministic · grounded · evidence-based**

## Pre-demo checklist (do before 8:30 PM Friday isn't enough — do day-of)
- [ ] Demo PDFs (Bilal, Aisha) tested on the **deployed** build.
- [ ] `DEMO_MODE` pre-baked JSON loads instantly with no network.
- [ ] Backend pre-warmed (`npm run warm`) 5 min before.
- [ ] Localhost fallback configured + tested.
- [ ] 90-sec backup recording saved locally.
- [ ] 3-min script + top 10 judge answers rehearsed 5×.
