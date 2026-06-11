# SECTION 7 — Test Dataset (10 Cases)

> Readiness values and missing skills marked **(verified)** were produced by running the actual engine. Use these as regression fixtures and to sanity-check the build. The 3 Backend variants reuse Section 1/2 resumes.

| # | Case | Role | Verified readiness | Verified missing |
|---|------|------|--------------------|------------------|
| 1 | Strong Frontend | Frontend Developer | **77** | none |
| 2 | Weak Frontend | Frontend Developer | **32** | JavaScript, React, Responsive Design, Git |
| 3 | Strong Backend | Backend Developer | **87** | none |
| 4 | Weak Backend | Backend Developer | **40** | Node.js, Express.js, REST APIs, MongoDB |
| 5 | Full Stack | Full Stack Developer | **86** | none |
| 6 | React | React Developer | **79** | none |
| 7 | Node | Node.js Developer | **79** | none |
| 8 | SWE Intern | Software Engineer Intern | **64** | none |
| 9 | Career Switcher | Full Stack Developer | **48** | Node.js, Express.js, REST APIs, MongoDB, Git |
| 10 | Fresh Graduate | Backend Developer | **40** | Express.js, REST APIs, MongoDB |

---

### 1. Strong Frontend → Frontend Developer
- **Summary:** HTML, CSS, JS, React, Responsive, Git, TypeScript, Tailwind; responsive portfolio; 5-mo frontend internship.
- **Expected missing:** none.
- **Readiness range:** 75–85 *(verified 77)*.
- **Roadmap direction:** none — "ready, polish & interview prep."

### 2. Weak Frontend → Frontend Developer
- **Summary:** Only HTML, CSS; one static page; no experience.
- **Expected missing:** JavaScript, React, Responsive Design, Git.
- **Readiness range:** 25–40 *(verified 32)*.
- **Roadmap direction:** JavaScript → Responsive Design → Git → React (foundations first).

### 3. Strong Backend → Backend Developer
- **Summary:** Aisha (Section 1 #1). Full backend stack + bonuses; quantified projects; internship.
- **Expected missing:** none.
- **Readiness range:** 82–90 *(verified 87)*.
- **Roadmap direction:** none — "apply now."

### 4. Weak Backend → Backend Developer
- **Summary:** Bilal (Section 1 #2). JS + Git only; portfolio site; no experience.
- **Expected missing:** Node.js, Express.js, REST APIs, MongoDB.
- **Readiness range:** 35–45 *(verified 40)*.
- **Roadmap direction:** Node.js → Express.js → REST APIs → MongoDB (16 weeks).

### 5. Full Stack → Full Stack Developer
- **Summary:** Chen (Section 1 #3). MERN + TS + Tailwind; 2 projects; 6-mo internship.
- **Expected missing:** none.
- **Readiness range:** 82–90 *(verified 86)*.
- **Roadmap direction:** none — "ready."

### 6. React → React Developer
- **Summary:** JS, React, HTML, CSS, State Management, Git, Redux; Redux+Router SPA; internship.
- **Expected missing:** none.
- **Readiness range:** 75–85 *(verified 79)*.
- **Roadmap direction:** none — deepen TypeScript/testing (nice-to-haves).

### 7. Node → Node.js Developer
- **Summary:** JS, Node, Express, REST, Git, Async, MongoDB; Node/Express API; internship.
- **Expected missing:** none.
- **Readiness range:** 75–85 *(verified 79)*.
- **Roadmap direction:** none — add testing/Docker (nice-to-haves).

### 8. SWE Intern → Software Engineer Intern
- **Summary:** JS, Data Structures, Algorithms, OOP, Problem Solving, Git, Python; 150 DSA solutions; no internship.
- **Expected missing:** none (fundamentals covered).
- **Readiness range:** 58–70 *(verified 64)*.
- **Roadmap direction:** none required; nudge toward a shipped project + experience (experience component is the drag).

### 9. Career Switcher → Full Stack Developer
- **Summary:** Marketing grad, 2 yrs non-tech; HTML/CSS/JS/React; one React app.
- **Expected missing:** Node.js, Express.js, REST APIs, MongoDB, Git.
- **Readiness range:** 42–55 *(verified 48)*.
- **Roadmap direction:** Git → Node.js → Express.js → REST APIs → MongoDB (20 weeks); emphasize transferable strengths.

### 10. Fresh Graduate → Backend Developer
- **Summary:** New CS grad; JS, Node, Git, HTML, CSS; one tiny Todo API; no experience.
- **Expected missing:** Express.js, REST APIs, MongoDB.
- **Readiness range:** 35–48 *(verified 40)*.
- **Roadmap direction:** Express.js → REST APIs → MongoDB (12 weeks).

---
## Regression rule
If any **verified** readiness value drifts by more than ±3 or any **missing** set changes after a code edit, treat it as a regression and investigate before the demo.
