# CareerPilot — Product Requirements Document (PRD)

**Product Name:** CareerPilot
**Tagline:** Your AI-powered career copilot — from resume to dream role.
**Document Owner:** Solo Founder / Developer
**Version:** 2.0 (Hackathon-Optimized — Solo, 38 Hours)
**Status:** Build-Ready
**Last Updated:** June 2026

---

## 0. Executive Summary

CareerPilot is an **evidence-based AI career copilot** for students and fresh graduates. Users upload their resume and instantly receive a **Resume Health Report**, a **Career Readiness Score**, an **evidence-backed Skill Gap analysis** (grounded in a curated role-skill dataset), a **personalized Career Roadmap**, and access to an **AI Career Mentor** they can chat with about their next steps.

What makes CareerPilot different from "ChatGPT for careers": **every recommendation is backed by concrete evidence** drawn from the user's resume compared against real role requirements. No vague advice — only specific, actionable next steps like *"You have Node.js and Express but are missing MongoDB. Build one MongoDB CRUD project to close this gap."*

This v2.0 PRD is deliberately scoped for **one developer to ship a polished, fully working product in 38 hours.** Polish and a flawless demo are prioritized over feature count.

**North Star Metric:** Number of users who complete a full **Analyze → Understand → Ask the Mentor** loop.

---

## 1. Problem Statement

### 1.1 The Core Problem
Students and fresh graduates struggle to translate their education into employable career paths. They face three compounding gaps:

1. **Knowledge gap** — They don't know which skills they're missing for the roles they want.
2. **Direction gap** — They don't know what to learn next, what to build, or whether they're "ready."
3. **Guidance gap** — Personalized career mentoring is expensive ($75–$250/session) and inaccessible.

### 1.2 Why This Matters Now
- Generic advice ("network more," "improve your resume") is not actionable.
- Existing tools do **one** thing (resume scan **or** interview prep) and rarely ground advice in the user's real profile.
- LLMs now make **personalized, evidence-based, conversational guidance** feasible — but only if grounded in structured data to avoid hallucination.

### 1.3 Problem Statement (One Sentence)
> Fresh graduates lack an affordable, personalized system that tells them — with evidence — exactly where they stand, what to learn next, and whether they're ready, instead of generic advice.

---

## 2. Target Users

| Segment | Description | Why CareerPilot |
|--------|-------------|---------------------------|
| **Final-year students** | Preparing for internships/placements | Need to know if they're "ready" and what to fix |
| **Fresh graduates (0–1 yr)** | Actively job hunting | Need direction and evidence-based next steps |
| **Early career switchers** | Pivoting into web/software dev | Need a grounded skill-gap map and roadmap |
| **Self-taught / bootcamp learners** | Non-traditional backgrounds | Need to validate readiness vs. real role requirements |

**Primary target for MVP:** Students and fresh grads targeting **web/software developer roles** (Frontend, Backend, Full Stack, React, Node.js, SWE Intern) — chosen because the role-skill dataset is well-defined and demoable.

---

## 3. User Personas

### Persona 1 — "Anxious Aisha" (Primary)
- **22 | Final-year CS student** targeting a backend/full-stack internship.
- **Goal:** Know if her resume is "good enough" and what to fix.
- **Frustration:** Applied to 40 jobs, zero callbacks — doesn't know why.
- **Needs:** Honest evidence-based feedback, a clear "am I ready?" answer.
- **Success:** *"I know exactly what to learn and build next."*

### Persona 2 — "Switcher Sami"
- **26 | Marketing grad** moving into web development.
- **Goal:** Understand what backend roles need and how far he is.
- **Frustration:** Overwhelmed by courses; no clear sequence.
- **Needs:** Grounded skill-gap map + 6-month roadmap.
- **Success:** *"I have a 6-month plan instead of 50 open tabs."*

### Persona 3 — "First-Gen Fatima"
- **21 | First-generation student**, no professional network.
- **Goal:** Get mentor-quality guidance she can't get at home or afford.
- **Needs:** A trustworthy "career mentor in your pocket" she can ask anything.
- **Success:** *"I finally have someone to ask 'what next?'"*

---

## 4. User Journey

```
Land → Upload Resume → Pick Target Role →
AI Parses & Compares vs Role Dataset →
[Resume Health Report] + [Career Readiness Score] →
[Evidence-Based Skill Gap] → [Personalized Roadmap] →
[Chat with AI Career Mentor] → Copy Summary
```

| Stage | User Action | System Response | Emotion |
|------|-------------|-----------------|---------|
| 1. Discover | Lands on homepage | Clear value prop + "Analyze My Resume" CTA | Curious |
| 2. Onboard | Uploads resume, selects target role | Parses + grounds against role dataset | Hopeful |
| 3. Health | Reviews Resume Health Report | 5-dimension scorecard **with reasons** | Enlightened |
| 4. Readiness | Sees Career Readiness Score | Score + strengths + weaknesses + next actions | Motivated |
| 5. Gap | Views Skill Gap | ✅/❌ matrix vs role, **with evidence** | Directed |
| 6. Plan | Gets Roadmap | Milestones tied directly to missing skills | Empowered |
| 7. Mentor | Asks the AI Mentor questions | Grounded, personalized answers | Confident |
| 8. Retain | Copies summary to clipboard | Plain-text plan copied | Committed |

---

## 5. Core Features

### 5.1 Resume Health Report ⭐ (Replaces ATS Score)
Evaluates the resume across **five dimensions**, each scored 0–100 **with a written explanation of why**:

| Dimension | What It Measures | Example Reasoning |
|-----------|------------------|-------------------|
| **Formatting Quality** | Structure, consistency, readability, sections present | *"82 — Clear sections, but inconsistent date formats and no dedicated Projects header."* |
| **Impact Metrics** | Use of quantified, results-driven bullets | *"45 — Only 1 of 8 bullets includes a metric. Add numbers (e.g., 'reduced load time by 40%')."* |
| **Skills Coverage** | Breadth/relevance of listed skills vs target role | *"70 — Strong frontend skills listed; backend skills underrepresented for your target role."* |
| **Keyword Coverage** | Presence of role-relevant keywords from dataset | *"60 — Missing 'REST API', 'MongoDB', 'unit testing' that backend roles expect."* |
| **Project Quality** | Depth, relevance, and tech-stack signal of projects | *"55 — Projects are tutorial-level. Add one full-stack project with a database."* |

Each dimension shows the score, the **reason**, and a **fix-it tip**. Includes an overall Resume Health summary.

### 5.2 Career Readiness Score ⭐ (Replaces ATS Score)
A single **0–100 score** answering *"How ready am I for my target role?"*, computed from five weighted inputs:

| Input | Weight | Source |
|-------|--------|--------|
| Technical Skills | 35% | Skill coverage (have ÷ required) — single skill-coverage signal |
| Projects | 25% | Project depth, relevance, and tech-stack signal |
| Experience | 20% | Internships/work/extracurriculars |
| Resume Health | 10% | Overall resume health score |
| Role Alignment | 10% | Holistic fit (keywords, nice-to-have, project relevance) |

**Output:** Score + **Strengths** + **Weaknesses** + **Recommended Next Actions** (each action evidence-backed).
> *Example: "Career Readiness: 68/100. Strengths: Solid JS fundamentals, 2 React projects. Weaknesses: No backend/database experience. Next action: Build one Node + MongoDB CRUD API to raise readiness to ~80."*

### 5.3 Evidence-Based Skill Gap Detection ⭐
Compares the user's skills against the **curated role-skill dataset** (Section 6.4). **No generic output allowed** — every gap maps to a concrete recommendation.

```
Target Role: Backend Developer
✅ Node.js          (found in resume)
✅ Express.js       (found in "E-commerce API" project)
✅ REST APIs        (found in resume)
❌ MongoDB          (not found)
❌ Authentication   (not found)
❌ Unit Testing     (not found)

→ Recommendation: Build ONE MongoDB-based CRUD project with JWT auth
   and Jest tests. This closes 3 gaps and raises readiness by ~12 points.
```

Gaps are prioritized as **Quick Wins** vs **Long-Term**.

### 5.4 Personalized Career Roadmap
A time-bound plan (4 / 8 / 12 / 24 weeks) where **every milestone is tied to a specific detected gap**. Each milestone includes: skill to learn, a concrete project to build, and a recommended resource. No milestone exists without evidence justifying it.

### 5.5 AI Career Mentor ⭐ (THE WOW FACTOR)
A conversational mentor **grounded in the user's own Resume Analysis + Skill Gap Report + Roadmap** (injected as context). Users ask natural questions and get **specific, evidence-based answers** — not generic chatbot replies.

**Example interactions:**
| User Question | Grounded Mentor Answer |
|---------------|------------------------|
| *"What should I learn next?"* | *"Based on your gap report, MongoDB is your highest-impact missing skill for Backend Developer. Learn it next — it unlocks 2 other gaps."* |
| *"Am I ready for internships?"* | *"Your Readiness Score is 68. You're ready to apply for frontend internships now, but for backend roles, close the MongoDB + Auth gaps first."* |
| *"Can I become a Backend Developer in 6 months?"* | *"Yes — realistically. You already have Node + Express. In 6 months: months 1–2 MongoDB + Auth, 3–4 testing + deployment, 5–6 two portfolio projects. This matches your roadmap."* |
| *"What project should I build next?"* | *"A full-stack task manager with Node, Express, MongoDB, and JWT. It closes your top 3 gaps and demonstrates end-to-end ability."* |

**Why it's realistic in 38h:** It's a single LLM chat endpoint with a well-engineered system prompt that injects the already-computed JSON (analysis + gaps + roadmap) as grounding context. No new heavy infrastructure — it **reuses** outputs the system already produced.

---

## 6. MVP Scope (38-Hour Solo Build)

> **Guiding principle:** A *polished, fully working* core beats a half-broken feature buffet. Ship the loop, then polish, then stretch.

### 6.1 ✅ MUST HAVE (MVP — non-negotiable)
| # | Feature | Definition of Done |
|---|---------|--------------------|
| M1 | Resume upload + parsing | PDF/DOCX → structured JSON (LLM-assisted) |
| M2 | Target role selection | Dropdown of 6 supported roles |
| M3 | **Resume Health Report** | 5 dimensions, each scored **with reasons** |
| M4 | **Career Readiness Score** | Score + strengths + weaknesses + next actions |
| M5 | **Evidence-Based Skill Gap** | ✅/❌ vs role dataset, each gap → recommendation |
| M6 | **Career Roadmap** | Milestones tied to detected gaps |
| M7 | **AI Career Mentor (chat)** | Grounded Q&A using M3–M6 outputs |
| M8 | Results dashboard | Single polished page showing everything |

### 6.2 🔶 STRETCH GOALS (only if MVP is solid & polished)
| Feature | Value | Effort |
|---------|-------|--------|
| Export plan as PDF (post-MVP) | Tangible takeaway | Low |
| "Suggested questions" chips in Mentor | Guides demo + UX | Low |
| Animated readiness gauge / progress bars | Demo wow polish | Low |
| Job role recommendations (top 3 fit %) | Discovery | Medium |
| Voice input for Mentor (speech-to-text) | Wow factor | Medium |
| One-click improved-resume rewrite | Tangible value | Medium |

### 6.3 🔭 FUTURE SCOPE (post-hackathon)
- AI mock interview (full simulation with scoring)
- User accounts, saved history, progress tracking & streaks
- Live job-board API integration (apply to real listings)
- Expanded role dataset (data, design, PM, DevOps, mobile)
- LinkedIn import & optimization
- Peer benchmarking, cover letter generator, multi-language

### 6.4 Curated Role-Skill Dataset (Grounding Layer)
A hand-curated JSON file mapping each supported role to **required** and **nice-to-have** skills + keywords. The system compares parsed resume skills against this **before** generating any recommendation. This is the anti-hallucination backbone.

**Initially supported roles:**
1. Frontend Developer
2. Backend Developer
3. Full Stack Developer
4. React Developer
5. Node.js Developer
6. Software Engineer Intern

**Example entry:**
```json
{
  "Backend Developer": {
    "required": ["Node.js", "Express.js", "REST APIs", "MongoDB",
                 "SQL", "Authentication", "Git"],
    "nice_to_have": ["Docker", "Redis", "Unit Testing", "CI/CD", "AWS"],
    "keywords": ["API", "database", "server", "microservices", "JWT"]
  }
}
```

### 6.5 MVP Success Criteria
- A judge uploads a real resume → sees Health Report, Readiness Score, Skill Gap, and Roadmap in **< 60 seconds**.
- The judge can **chat with the Mentor** and get a clearly personalized answer.
- The full flow runs **without crashing**, on a **polished UI**.

---

## 7. Evidence-Based Analysis (Design Principle)

**Rule: No recommendation without evidence.** Every output must cite *where the evidence came from* (a skill found/missing, a project, a metric absent).

❌ **Banned (generic):** *"Improve your backend skills and build more projects."*
✅ **Required (evidence-based):** *"You list Node.js and Express but no database skill. Backend Developer requires MongoDB (missing). Build one MongoDB CRUD project to close this gap."*

**How it's enforced technically:**
1. Parse resume → structured skills/projects/experience JSON.
2. Compare against role dataset → produce a deterministic **match object** (`have` / `missing`).
3. Feed that match object into the LLM with a strict instruction: *"Only recommend actions that address an item in `missing`. Reference the specific skill or project."*
4. The Mentor receives the same grounding object, so chat answers stay evidence-based.

---

## 8. Success Metrics

### 8.1 Hackathon Judging Metrics
- **Demo completion:** End-to-end flow works flawlessly.
- **Wow moment:** Judges react to the grounded AI Mentor answering "Can I become a Backend Developer in 6 months?"
- **Differentiation clarity:** Judges can articulate *why* CareerPilot ≠ ChatGPT (evidence + grounding).

### 8.2 Product KPIs (Post-Hackathon)
| Metric | Target |
|--------|--------|
| % users who view full analysis | ≥ 80% |
| % users who ask the Mentor ≥ 1 question | ≥ 50% |
| Avg. self-reported usefulness (1–5) | ≥ 4.3 |
| Avg. analysis time | < 15 sec |
| % reporting improved clarity/confidence | ≥ 65% |

### 8.3 North Star Metric
> Number of users who complete a full **Analyze → Understand → Ask the Mentor** loop.

---

## 9. Competitive Advantages

| Differentiator | Why It Wins |
|----------------|-------------|
| **Evidence-based, not generic** | Every recommendation cites specific resume evidence. |
| **Grounded in a role dataset** | Reduces hallucination; advice maps to real role requirements. |
| **Career Readiness Score** | One number that answers "am I ready?" — highly demoable. |
| **AI Career Mentor** | Conversational, personalized, grounded — the emotional hook. |
| **Closed loop** | Analysis → gaps → roadmap → mentor all share one grounding context. |
| **Accessible** | Free alternative to $100+/session career counseling. |

**vs. ChatGPT:** Structured, grounded, opinionated workflow with scores and evidence — not a blank prompt box.
**vs. Resume scanners (Jobscan):** Adds readiness, roadmap, and a conversational mentor, not just keyword matching.

---

## 10. User Stories

- **US-01:** As a student, I upload my resume so the system can analyze it automatically.
- **US-02:** As a user, I see a Resume Health Report with **reasons** so I know what's weak and why.
- **US-03:** As a user, I get a Career Readiness Score so I know if I'm ready for my target role.
- **US-04:** As a user, I see exactly which required skills I have (✅) and lack (❌) for a chosen role.
- **US-05:** As a user, every gap comes with a specific recommendation so my next step is unambiguous.
- **US-06:** As a user, I get a roadmap where each milestone ties to a real gap.
- **US-07:** As a user, I can **ask the AI Mentor** questions like "What should I learn next?" and get grounded answers.
- **US-08:** As a user, I can ask "Am I ready for internships?" and get an evidence-based yes/no.
- **US-09:** As a user, I can copy a plain-text summary of my plan to the clipboard so I can paste it anywhere.
- **US-10:** As a user, I see everything on one dashboard so I'm not lost.

---

## 11. Functional Requirements

### FR-1: Resume Ingestion
- FR-1.1 Accept PDF/DOCX up to 5 MB.
- FR-1.2 Extract and parse into structured fields (skills, projects, experience, education).
- FR-1.3 Handle parse failure with a clear, friendly error + retry.

### FR-2: Resume Health Report
- FR-2.1 Score 5 dimensions (Formatting, Impact Metrics, Skills Coverage, Keyword Coverage, Project Quality), 0–100 each.
- FR-2.2 Each dimension includes a **written reason** and a fix-it tip.

### FR-3: Career Readiness Score
- FR-3.1 Compute 0–100 from Technical Skills, Projects, Experience, Skill Gaps, Role Alignment (weighted).
- FR-3.2 Output Strengths, Weaknesses, and Recommended Next Actions.

### FR-4: Evidence-Based Skill Gap
- FR-4.1 Compare parsed skills to the selected role in the dataset.
- FR-4.2 Output ✅ have / ❌ missing per required skill.
- FR-4.3 Each missing skill → a specific, evidence-backed recommendation.

### FR-5: Career Roadmap
- FR-5.1 Generate milestones over a selectable duration.
- FR-5.2 Each milestone references a specific detected gap + project + resource.

### FR-6: AI Career Mentor
- FR-6.1 Chat endpoint grounded with the user's analysis + gaps + roadmap JSON.
- FR-6.2 Answers must stay evidence-based and reference the user's data.
- FR-6.3 Provide suggested starter questions.

### FR-7: Dashboard & Copy Summary
- FR-7.1 Single dashboard shows all outputs.
- FR-7.2 "Copy Summary" serializes `analysisResult` to plain text and writes it to the clipboard (client-only; no backend call, no PDF).

---

## 12. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Full analysis < 30 sec; UI interactions < 200 ms; Mentor replies < 8 sec (non-streaming). |
| **Reliability** | Graceful degradation on LLM failure (retry + friendly error). |
| **Usability** | Clean, single-flow, mobile-responsive UI; no manual needed. |
| **Polish** | Demo-grade visual quality (gauges, progress bars, consistent design). |
| **Security/Privacy** | Resumes processed in-memory / auto-deleted; clear data notice; no PII stored without consent. |
| **Accessibility** | WCAG-AA contrast; keyboard navigable. |
| **Maintainability** | Prompt templates + role dataset are config-driven JSON. |
| **Cost** | Optimize tokens; cache repeated calls; cap Mentor context length. |

---

## 13. Risks and Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|-----------|-----------|
| R1 | **LLM hallucination** | High | Medium | Ground all output in role dataset + match object; ban non-evidenced recommendations in prompt. |
| R2 | **Resume parsing fails** | High | Medium | Robust parser + LLM raw-text fallback; validate before scoring. |
| R3 | **Slow/failed LLM during demo** | High | Medium | Pre-warm dyno; cache a demo resume's full results (DEMO_MODE); typing indicator for perceived speed. Analysis is deterministic so it works even if Gemini is down. |
| R4 | **Scope creep (solo, 38h)** | High | High | Lock MVP (6.1); stretch only after polish; future scope parked. |
| R5 | **Generic-feeling output** | Medium | Medium | Evidence-based design principle (Section 7) enforced in prompts. |
| R6 | **Over-engineering the Mentor** | Medium | Medium | Keep it as ONE grounded chat endpoint reusing existing JSON. |
| R7 | **Privacy concerns** | Medium | Low | Don't persist data by default; clear messaging. |
| R8 | **Time sink on auth/accounts** | Medium | Medium | No accounts in MVP — session-only. |

---

## 14. Strongest 3-Minute Demo Flow

> **Strategy:** Use one carefully chosen, realistic resume (Aisha's) targeting **Backend Developer** so the gaps and Mentor answers are crisp. Pre-cache results as a fallback.

| Time | Action | Judge Wow Moment |
|------|--------|------------------|
| **0:00–0:20** | Hook: *"Every grad asks 3 questions — Am I ready? What do I learn next? What do I build? CareerPilot answers all three with evidence."* | Framing |
| **0:20–0:50** | Upload Aisha's resume, select **Backend Developer** → instant **Resume Health Report** with reasons | 🔥 "It explains *why* each score" |
| **0:50–1:20** | Reveal **Career Readiness Score: 68/100** with strengths/weaknesses | 🔥🔥 Single number = "am I ready?" |
| **1:20–1:50** | Show **Evidence-Based Skill Gap**: ✅ Node ✅ Express ❌ MongoDB → recommendation appears | 🔥 "Not generic — it's specific" |
| **1:50–2:10** | Show **Roadmap** where milestones map to those exact gaps | Coherence |
| **2:10–2:50** | **THE CLIMAX** — type into the **AI Mentor**: *"Can I become a Backend Developer in 6 months?"* → grounded, personal, month-by-month answer | 🔥🔥🔥 BIGGEST WOW |
| **2:50–3:00** | Close: *"Evidence-based career mentoring, accessible to every student."* | Vision + impact |

**Biggest wow = the Mentor giving a grounded, evidence-based answer the judges can clearly tell ChatGPT couldn't, because it cites the user's actual skills and gaps.**

---

## 15. Hackathon Judge Review (Self-Critique)

> Reviewed as a hackathon judge scoring on **Innovation, Technical Execution, Impact, Completeness, and Presentation.**

### 15.1 Strengths
- **Clear, real problem** with an emotional hook ("am I ready?").
- **Strong differentiation** via evidence-based, dataset-grounded recommendations.
- **The AI Mentor is a genuine wow factor** and reuses existing outputs (smart, low-risk).
- **Realistically scoped** for a solo dev in 38h.

### 15.2 Weaknesses & Fixes
| Weakness a judge would flag | Fix |
|-----------------------------|-----|
| "How is this not just ChatGPT?" | Lead the pitch with the **role dataset + evidence object**; show the ✅/❌ comparison on screen. |
| Scores could feel arbitrary | Show the **weighting + the reason text** so scoring feels principled, not magic. |
| Only 6 roles | Frame as **deliberate depth over breadth**; mention dataset is extensible (future scope). |
| Solo-build risk of looking unpolished | Invest stretch time in **visual polish** (gauges, animations) — judges score presentation heavily. |
| No proof of accuracy | Demo with a **real resume** and let a judge ask the Mentor their own question live. |

### 15.3 Highest-Scoring Version (Judge's Recommendation)
1. **Nail the core loop flawlessly** (M1–M8) — never let the demo break.
2. **Make the Mentor the centerpiece** — rehearse 3 grounded questions; allow a live judge question.
3. **Show the evidence visibly** — the ✅/❌ matrix + reason text is your "not-ChatGPT" proof.
4. **Polish the readiness gauge and skill-gap visuals** — these are the screenshots judges remember.
5. **Tell a one-person story** — "I built a personal career mentor solo in 38 hours" is itself impressive; lean into it.

**Predicted scoring impact:** This version maximizes Innovation (evidence-grounding + Mentor), Completeness (full working loop), and Presentation (polished, rehearsed demo) — the three categories where hackathons are usually won.

---

## Appendix A — Suggested Tech Approach (Non-Binding)
- **Frontend:** React / Next.js + Tailwind (fast, polished UI; gauges via a chart lib).
- **Backend:** Lightweight API (FastAPI / Node) orchestrating LLM calls.
- **AI Layer:** One LLM with structured JSON prompts; a shared "grounding object" for all features incl. Mentor.
- **Parsing:** PDF/DOCX text extraction + LLM structuring.
- **Grounding:** `roles.json` curated role-skill dataset (Section 6.4).
- **State:** Session-only (no DB needed for MVP).

## Appendix B — 38-Hour Build Plan (Solo)
| Phase | Hours | Focus |
|-------|-------|-------|
| 1. Setup & parsing | 0–6 | Project scaffold, upload, resume → JSON |
| 2. Dataset + matching | 6–12 | `roles.json`, deterministic ✅/❌ match object |
| 3. Health + Readiness | 12–20 | Two scoring features with reasons |
| 4. Gap + Roadmap | 20–26 | Evidence-based gap & milestone generation |
| 5. AI Mentor | 26–32 | Grounded chat endpoint + UI |
| 6. Polish & demo | 32–38 | Visuals, caching, fallback, rehearse 3-min demo |

*Buffer rule: if behind at hour 30, cut stretch goals — never cut polish on M1–M8.*

---

*End of Document.*
