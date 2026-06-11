# Phase 9 — Demo Mode

## Objective
Guarantee a flawless demo even if the network/Gemini fails: pre-baked result, sessionStorage mirror, and a backend warm script.

## Files to create
```
client/src/demo/analysisResult.sample.json     (pre-baked full AnalysisResult — Bilal + Aisha)
client/src/demo/mentorAnswers.sample.json       (canned grounded mentor answers)
client/src/demo/demoMode.ts                      (DEMO_MODE flag + loaders + fallback)
server/scripts/warm.ts                           (pings /api/health to pre-warm)
```

## Acceptance criteria
- [ ] Toggling `DEMO_MODE` renders the full dashboard + mentor instantly, no network.
- [ ] If a live `/api/analyze` fails, the UI falls back to the pre-baked result (no blank screen).
- [ ] The 3-minute demo runs flawlessly twice in a row.
- [ ] `warm.ts` returns ok:true.

## Exact Copilot prompt
```
Add Demo Mode safety to CareerPilot. Two fallback layers only: DEMO_MODE pre-baked result
and the existing sessionStorage mirror. Follow ARCHITECTURE.md §8/§9 and the Fix Pack.

1) client/src/demo/analysisResult.sample.json
   - Two full AnalysisResult objects keyed by resume id: "bilal-backend" and "aisha-backend",
     matching SCHEMAS.md #15 and the numbers in prep/02-EXPECTED-RESULTS.md
     (Bilal: readiness 40, missing Node.js/Express.js/REST APIs/MongoDB, 16-week roadmap;
      Aisha: readiness 87, 6/6 skills, empty roadmap).

2) client/src/demo/mentorAnswers.sample.json
   - A map of question -> grounded answer using prep/03-MENTOR-CONVERSATIONS.md (include
     "Can I become a backend developer in 6 months?", "Why is my readiness score low?",
     "Should I learn Kubernetes?").

3) client/src/demo/demoMode.ts
   - export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true".
   - export function getDemoAnalysis(resumeId): AnalysisResult (from the sample JSON).
   - export function getDemoMentorAnswer(question): MentorResponse | null (fuzzy-match the
     question against the canned map; return a sensible default if no match).
   - In useAnalysis.run(): if DEMO_MODE, short-circuit to getDemoAnalysis() with a brief
     simulated delay so the progress checklist still animates.
   - In useAnalysis/useMentorChat: wrap live calls in try/catch; on failure AND a demo sample
     exists, fall back to the demo data instead of showing an error (log to console only).

4) server/scripts/warm.ts
   - export async function warm(baseUrl): fetch `${baseUrl}/api/health`; log ok + geminiConfigured;
     retry 3x with 2s backoff. Add npm script "warm": "tsx scripts/warm.ts".

5) Add VITE_DEMO_MODE=false to client/.env.example with a comment: set true for offline demo.

Generate complete TypeScript + JSON. Keep DEMO_MODE isolated and clearly labeled.
Never let a live failure show a blank screen when a demo sample exists.
```
