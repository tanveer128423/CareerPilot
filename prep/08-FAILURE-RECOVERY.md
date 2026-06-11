# SECTION 8 — Demo Failure Recovery

> Rule #1: **Never go silent and never show a stack trace.** Keep narrating; switch to a fallback without announcing "it broke."

---

## If Gemini fails (timeout / quota / 5xx)
**What still works:** Resume Health, Readiness, Skill Gap, and Roadmap are **100% deterministic** — they run with no LLM. Only resume *structuring* (if deterministic parsing is sparse) and the *mentor* need Gemini.
**Recovery:**
1. The dashboard still loads fully — keep demoing the scores and roadmap; they're the differentiator anyway.
2. For the mentor, fall back to `DEMO_MODE` canned answers (`mentorAnswers.sample.json`).
3. **Say:** "The entire scoring engine is deterministic, so it works even without the AI — that's by design."
**Pre-empt:** pre-warm + a fresh API key; keep `VITE_DEMO_MODE` one toggle away.

## If upload fails (bad file / parse error)
**Recovery:**
1. Use a **known-good demo resume** (Bilal / Aisha `.pdf` already on the desktop) — never upload a judge's file first.
2. If a judge insists on their file and it fails: "That looks like a scanned image PDF — our parser needs text. Here's a text-based one," then continue.
3. Worst case, flip `DEMO_MODE=true` → instant pre-baked dashboard.
**Pre-empt:** test the exact demo PDFs on the deployed build before judging.

## If Render (backend) is down
**Recovery:**
1. **Run the backend locally** (`npm run dev` in `server/`) and point the deployed/local frontend at `http://localhost:8080` via `VITE_API_BASE_URL`. Have this configured and tested beforehand.
2. If networking to localhost is blocked, flip `DEMO_MODE=true` — the frontend serves pre-baked results with zero backend.
**Pre-empt:** keep both apps runnable offline on the laptop; `npm run warm` 5 min before.

## If internet is slow
**Recovery:**
1. The progress checklist + mentor typing indicator **cover latency** — keep talking through them.
2. Lead with the **deterministic dashboard** (instant) and treat the mentor as the finale; if it's slow, use a pre-typed question whose `DEMO_MODE` answer is cached.
3. Reduce risk: run the whole demo on **localhost** (no round-trips) if Wi-Fi is unreliable.
**Pre-empt:** phone hotspot as backup; pre-load the app so assets are cached.

## If judges ask unexpected questions
**Recovery:**
1. **Bridge to your strength:** "Great question — what's relevant here is that our matching is deterministic and grounded, so…" then answer.
2. If you genuinely don't know: "We haven't validated that yet — our current focus was making the advice trustworthy. I'd test it by [concrete method]." Honesty + a method beats bluffing.
3. Offer to **show code or upload their resume live** — proof ends most doubt.
4. Keep answers to **one sentence + an offer to demonstrate.**
**Pre-empt:** rehearse `prep/05-JUDGE-QA.md`; keep `matchService.ts` open in a tab for the "show me" asks.

---
## Universal fallback ladder (memorize)
1. Live deployed app →
2. Live **localhost** app →
3. **DEMO_MODE** (pre-baked JSON, no backend) →
4. **Screenshots / 90-sec recording** of a clean run.

Have all four ready before 8:30 PM Friday.
