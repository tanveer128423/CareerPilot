# CareerPilot — Judge One-Pager

> **Your AI career copilot — from resume to dream role.**
> `deterministic · grounded · evidence-based`

---

## The problem
Students and fresh grads get **generic, un-actionable advice** ("network more,"
"improve your resume") and can't afford career mentors ($75–$250/session). They
don't know three things: **Am I ready? What do I learn next? What do I build?**

## The insight
LLMs *can* give personalized career guidance — but only if you stop them from
hallucinating. **CareerPilot computes the truth in code, then lets the AI explain
it.** The score, skill gaps, and roadmap are deterministic; the AI mentor may
**only** reason over those verified facts — it literally cannot invent a skill,
project, or certification you don't have.

> This is the moat: it's the difference between *"ChatGPT for careers"* (confident
> and often wrong) and *an evidence-based copilot that earns trust.*

---

## What it does (the Analyze → Understand → Ask loop)
1. **Upload** a resume (PDF/DOCX), pick a target role.
2. **Resume Health Report** — 5 evidence-based dimensions, each with a concrete fix.
3. **Career Readiness Score** (0–100) — transparent weighted breakdown, no black box.
4. **Skill Gap analysis** — matched / missing / nice-to-have, computed deterministically.
5. **24-Week Roadmap** — each milestone closes one missing skill, with a project + resource.
6. **AI Career Mentor** — chat that cites *your* numbers, or declines when ungrounded.

**11 supported roles** across web, **data, ML, DevOps, mobile, and product** — so
almost any judge can run it on their own resume.

---

## Why it's believable (the demo proof points)
- **Robust matching:** skills are detected from the whole resume (even prose like
  *"built REST endpoints in Express"*), not just a skills list — so it won't
  embarrassingly miss a skill a judge knows they have.
- **Contrast demo:** Bilal (40 / "On track") vs Aisha (87 / "Interview-ready"),
  same role, same engine — visible, honest scoring.
- **Grounded refusal:** ask the mentor something off-topic or about a skill not in
  your plan, and it *declines* and redirects — proving it doesn't hallucinate.
- **Never blanks:** Demo Mode serves pre-baked, engine-verified results with zero
  network — the live demo can't crash.

---

## The retention loop (what happens after the demo)
CareerPilot is built to be **re-used, not one-and-done**:

```
Upload → See score & gaps → Follow roadmap (weeks) → Re-upload → Score climbs → Repeat
```

- **Measurable progress:** re-uploading after closing a gap visibly raises the
  readiness score — a dopamine loop tied to real skill growth.
- **Roadmap as a habit:** each milestone is a concrete, checkable next action,
  bringing users back weekly.
- **Natural expansion:** same engine extends to interview prep, more roles, and
  cohort/university dashboards — without changing the grounded architecture.

## Impact & who it's for
- **Primary:** final-year students & fresh grads (0–1 yr) targeting tech roles.
- **Why it matters:** replaces $75–$250/session mentoring with free, instant,
  evidence-based guidance — and is honest enough to actually trust.
- **North-star metric:** users who complete a full **Analyze → Understand → Ask**
  loop (and come back to watch their score rise).

---

## Tech (built for a flawless solo demo)
React + TypeScript + Vite + Tailwind + Framer Motion · Node/Express + AJV ·
Google Gemini (parsing + mentor only) · **stateless backend, no stored user data.**
The differentiating logic (match / readiness / roadmap) is **100% deterministic,
dependency-free, and unit-tested.**
