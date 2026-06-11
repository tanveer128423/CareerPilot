# SECTION 2 — Expected Analysis Results

> **These are the ACTUAL outputs of the CareerPilot engine** (parser → matchService → analysisService → readinessService → roadmapService) run on the 4 demo resumes. Use them to validate the build and to pre-bake `DEMO_MODE`. Numbers will match if skill spellings stay as written.

---

## Resume #1 — Aisha Khan (Strong Backend) → Backend Developer

**Resume Health Report — Overall 88/100**
| Dimension | Score | Note |
|-----------|-------|------|
| Formatting Quality | 90 | All 4 sections, contact present |
| Impact Metrics | 100 | Every bullet quantified (30%, 1,200+, 500+) |
| Skills Coverage | 100 | 6/6 required skills |
| Keyword Coverage | 50 | Some role keywords missing |
| Project Quality | 99 | 2 relevant projects with tech + summaries |

**Career Readiness Score — 87/100**
`technicalSkills 35/35 · projects 25/25 · experience 11/20 · resumeHealth 9/10 · roleAlignment 7/10`

**Skill Gap Analysis** — Coverage **100%**
- ✅ Have: JavaScript, Node.js, Express.js, REST APIs, MongoDB, Git
- ❌ Missing: **(none)**
- ⭐ Bonus matched: SQL, Authentication, Unit Testing

**Roadmap:** *(empty — no required gaps; show "You've closed all required gaps — focus on interviews & polish")*

**Mentor Summary:** "You're interview-ready for Backend Developer at **87/100** with 6/6 required skills and bonus skills (SQL, Auth, Testing). Your only growth area is more professional experience — apply now and prep for technical interviews."

---

## Resume #2 — Bilal Ahmed (Weak Backend) → Backend Developer

**Resume Health Report — Overall 37/100**
| Dimension | Score | Note |
|-----------|-------|------|
| Formatting Quality | 59 | Short resume, no Experience section |
| Impact Metrics | 0 | No quantified bullets |
| Skills Coverage | 28 | 2/6 required |
| Keyword Coverage | 13 | Few backend keywords |
| Project Quality | 87 | Has a relevant project (skewed high — single project) |

**Career Readiness Score — 40/100**
`technicalSkills 12/35 · projects 21/25 · experience 0/20 · resumeHealth 4/10 · roleAlignment 3/10`

**Skill Gap Analysis** — Coverage **33%**
- ✅ Have: JavaScript, Git
- ❌ Missing: **Node.js, Express.js, REST APIs, MongoDB**

**Roadmap (16 weeks):** Week 1-4 Node.js · Week 5-8 Express.js · Week 9-12 REST APIs · Week 13-16 MongoDB

**Mentor Summary:** "You're at **40/100** for Backend Developer. You have JavaScript and Git, but you're missing the core backend stack: Node.js, Express.js, REST APIs, MongoDB. Follow your 16-week roadmap — start with Node.js — and add an internship/OSS project to build experience."

---

## Resume #3 — Chen Wei (Strong Full Stack) → Full Stack Developer

**Resume Health Report — Overall 85/100**
| Dimension | Score | Note |
|-----------|-------|------|
| Formatting Quality | 88 | All sections, contact present |
| Impact Metrics | 100 | 200+ users, 35% load-time cut |
| Skills Coverage | 100 | 9/9 required |
| Keyword Coverage | 38 | Could add more role keywords |
| Project Quality | 99 | 2 strong full-stack projects |

**Career Readiness Score — 86/100**
`technicalSkills 35/35 · projects 25/25 · experience 11/20 · resumeHealth 9/10 · roleAlignment 6/10`

**Skill Gap Analysis** — Coverage **100%**
- ✅ Have: HTML, CSS, JavaScript, React, Node.js, Express.js, REST APIs, MongoDB, Git
- ❌ Missing: **(none)**
- ⭐ Bonus matched: TypeScript, Tailwind CSS, Authentication

**Roadmap:** *(empty — gaps closed)*

**Mentor Summary:** "Excellent — **86/100** for Full Stack with 9/9 required skills plus TypeScript, Tailwind, and Auth. Your MERN Task Manager proves end-to-end ability. Apply now; focus interview prep on system design and deepening experience."

---

## Resume #4 — Dana Iqbal (Weak Full Stack) → Full Stack Developer

**Resume Health Report — Overall 48/100**
| Dimension | Score | Note |
|-----------|-------|------|
| Formatting Quality | 57 | Short, no Experience section |
| Impact Metrics | 35 | No quantified achievements |
| Skills Coverage | 38 | 4/9 required |
| Keyword Coverage | 25 | Frontend-only keywords |
| Project Quality | 87 | One relevant React project |

**Career Readiness Score — 45/100**
`technicalSkills 15/35 · projects 21/25 · experience 0/20 · resumeHealth 5/10 · roleAlignment 4/10`

**Skill Gap Analysis** — Coverage **44%**
- ✅ Have: HTML, CSS, JavaScript, React
- ❌ Missing: **Node.js, Express.js, REST APIs, MongoDB, Git**

**Roadmap (20 weeks):** Week 1-4 Git · Week 5-8 Node.js · Week 9-12 Express.js · Week 13-16 REST APIs · Week 17-20 MongoDB

**Mentor Summary:** "You're at **45/100** — a solid frontend start (HTML, CSS, JS, React) but the backend half of full-stack is missing. Your 20-week roadmap takes you from Git fundamentals through the Node/Express/REST/MongoDB stack. Build the 'Full-stack blog with React frontend and Node API' to close multiple gaps at once."

---

## Demo selection guidance
- **Best contrast pair for judges:** Resume #2 (Weak Backend, 40) then Resume #1 (Strong Backend, 87) — same role, dramatically different verdict, proves the engine isn't generic.
- **Headline demo resume:** #1 Aisha (clean, all green, 87) for the "ready" story OR #2 Bilal for the "here's your exact plan" story. Recommended: **lead with #2 (the gap + roadmap + mentor), close with #1 (the success state).**
