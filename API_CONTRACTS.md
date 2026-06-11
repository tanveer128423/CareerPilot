# CareerPilot — API Contracts

**Author:** Senior Backend Architect
**Version:** 1.0
**Base URL (local):** `http://localhost:8080`
**Base URL (prod):** `https://careerpilot-api.onrender.com`
**Content-Type (default):** `application/json; charset=utf-8`
**API Style:** REST · Stateless · No auth · Session-only client state

> **Purpose:** This document is the single source of truth for all client/server communication. It is implementation-ready: every shape, field type, validation rule, and status code is specified so backend and frontend code can be generated directly from it.

---

## Conventions

### Standard Error Envelope
**Every** error response (4xx/5xx) uses this exact shape:
```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-friendly message safe to show users.",
    "retryable": true,
    "details": null
  }
}
```
- `code` — stable, SCREAMING_SNAKE_CASE, used for client branching.
- `message` — never leaks stack traces or internal details.
- `retryable` — `true` if the client should offer a "Retry" button.
- `details` — optional array of field-level validation errors, else `null`.

### Standard Success Envelope
Success responses return the resource object directly (no wrapper) to keep client code simple, **except** where noted. All success responses include header `X-Request-Id`.

### Global Status Codes
| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Successful GET/POST |
| `400` | Bad Request | Validation failed / missing fields |
| `413` | Payload Too Large | File or body exceeds limit |
| `415` | Unsupported Media Type | Wrong file type / content-type |
| `422` | Unprocessable Entity | File readable but no extractable text |
| `429` | Too Many Requests | Upstream (Gemini) rate limit |
| `500` | Internal Server Error | Unexpected error |
| `502` | Bad Gateway | Gemini call failed after retries |
| `504` | Gateway Timeout | Gemini exceeded timeout |

### Global Error Codes
| `code` | HTTP | retryable | Meaning |
|--------|------|-----------|---------|
| `VALIDATION_ERROR` | 400 | false | Request body/params invalid |
| `MISSING_FILE` | 400 | false | No file uploaded on `/parse` |
| `UNSUPPORTED_FILE_TYPE` | 415 | false | Not PDF/DOCX |
| `FILE_TOO_LARGE` | 413 | false | File > 5 MB |
| `BODY_TOO_LARGE` | 413 | false | JSON body > 1 MB |
| `PARSE_FAILED` | 422 | true | No text extractable (e.g., scanned PDF) |
| `INVALID_ROLE` | 400 | false | `targetRole` not in supported list |
| `AI_TIMEOUT` | 504 | true | Gemini timed out |
| `AI_BAD_JSON` | 502 | true | Gemini returned unparseable JSON |
| `AI_UNAVAILABLE` | 502 | true | Gemini failed after retries |
| `RATE_LIMITED` | 429 | true | Upstream rate limit |
| `INTERNAL_ERROR` | 500 | true | Unexpected server error |

### Supported Roles (enum)
Used by `targetRole` everywhere. Must match exactly (case-sensitive).
```
"Frontend Developer"
"Backend Developer"
"Full Stack Developer"
"React Developer"
"Node.js Developer"
"Software Engineer Intern"
```

### Common Headers
| Header | Direction | Notes |
|--------|-----------|-------|
| `Content-Type: application/json` | request | All JSON POSTs |
| `Content-Type: multipart/form-data` | request | `/api/parse` only |
| `Accept: application/json` | request | Recommended |
| `X-Request-Id` | response | UUID for tracing/logs |
| `Access-Control-Allow-Origin` | response | Locked to client origin |

---

## 1. GET /api/health

Liveness/readiness probe. Also used to warm the free-tier dyno before a demo.

### Endpoint
`GET /api/health`

### HTTP Method
`GET`

### Request Headers
| Header | Required | Value |
|--------|----------|-------|
| `Accept` | optional | `application/json` |

### Request Body
None.

### Validation Rules
None.

### Success Response (`200 OK`)
```json
{
  "ok": true,
  "service": "careerpilot-api",
  "version": "1.0.0",
  "geminiConfigured": true,
  "timestamp": "2026-06-09T10:15:00.000Z"
}
```
| Field | Type | Notes |
|-------|------|-------|
| `ok` | boolean | Always `true` when serving |
| `service` | string | Service identifier |
| `version` | string | Semver |
| `geminiConfigured` | boolean | `true` if `GEMINI_API_KEY` present |
| `timestamp` | string (ISO-8601) | Server time |

### Error Response
Only `500 INTERNAL_ERROR` if the process is broken (rare).

### Example Request
```bash
curl -s http://localhost:8080/api/health
```

### Example Response
```json
{
  "ok": true,
  "service": "careerpilot-api",
  "version": "1.0.0",
  "geminiConfigured": true,
  "timestamp": "2026-06-09T10:15:00.000Z"
}
```

### Status Codes
| Code | Meaning |
|------|---------|
| `200` | Healthy |
| `500` | Process error |

---

## 2. GET /api/roles

Returns the curated supported roles plus their required/nice-to-have skills, so the frontend can render the role selector and (optionally) preview requirements. Sourced from `server/src/data/roles.json`.

### Endpoint
`GET /api/roles`

### HTTP Method
`GET`

### Request Headers
| Header | Required | Value |
|--------|----------|-------|
| `Accept` | optional | `application/json` |

### Request Body
None.

### Validation Rules
None.

### Success Response (`200 OK`)
```json
{
  "roles": [
    {
      "id": "backend-developer",
      "name": "Backend Developer",
      "required": ["Node.js", "Express.js", "REST APIs", "MongoDB", "SQL", "Authentication", "Git"],
      "niceToHave": ["Docker", "Redis", "Unit Testing", "CI/CD", "AWS"],
      "keywords": ["API", "database", "server", "microservices", "JWT"]
    }
  ]
}
```
| Field | Type | Notes |
|-------|------|-------|
| `roles` | array | All supported roles |
| `roles[].id` | string | kebab-case stable id |
| `roles[].name` | string | Must match the role enum exactly |
| `roles[].required` | string[] | Required skills (used by matchService) |
| `roles[].niceToHave` | string[] | Bonus skills |
| `roles[].keywords` | string[] | Keyword-coverage terms |

### Error Response
`500 INTERNAL_ERROR` if `roles.json` cannot be read.

### Example Request
```bash
curl -s http://localhost:8080/api/roles
```

### Example Response
```json
{
  "roles": [
    {
      "id": "frontend-developer",
      "name": "Frontend Developer",
      "required": ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive Design"],
      "niceToHave": ["TypeScript", "Tailwind CSS", "Testing", "Redux"],
      "keywords": ["UI", "component", "responsive", "accessibility", "SPA"]
    },
    {
      "id": "backend-developer",
      "name": "Backend Developer",
      "required": ["Node.js", "Express.js", "REST APIs", "MongoDB", "SQL", "Authentication", "Git"],
      "niceToHave": ["Docker", "Redis", "Unit Testing", "CI/CD", "AWS"],
      "keywords": ["API", "database", "server", "microservices", "JWT"]
    }
  ]
}
```

### Status Codes
| Code | Meaning |
|------|---------|
| `200` | Roles returned |
| `500` | Dataset read failure |

---

## 3. POST /api/parse

Accepts a resume file (PDF/DOCX), extracts text, and uses Gemini to structure it into JSON. Returns `structuredResume`. The uploaded file is processed in memory and **discarded immediately** (privacy).

### Endpoint
`POST /api/parse`

### HTTP Method
`POST`

### Request Headers
| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | required | `multipart/form-data` (boundary auto-set) |
| `Accept` | optional | `application/json` |

### Request Body (multipart/form-data)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | file | yes | PDF or DOCX, ≤ 5 MB |
| `targetRole` | text | yes | Must be in role enum |

### Validation Rules
| Rule | On failure |
|------|-----------|
| `file` present | `400 MISSING_FILE` |
| MIME ∈ {`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`} | `415 UNSUPPORTED_FILE_TYPE` |
| File size ≤ 5 MB | `413 FILE_TOO_LARGE` |
| `targetRole` present and ∈ role enum | `400 INVALID_ROLE` |
| Extracted text length ≥ 50 chars | `422 PARSE_FAILED` |

### Success Response (`200 OK`)
```json
{
  "targetRole": "Backend Developer",
  "structuredResume": {
    "skills": ["Node.js", "Express.js", "JavaScript", "Git", "React"],
    "projects": [
      { "name": "E-commerce API", "tech": ["Node.js", "Express.js"], "summary": "REST API for product catalog and orders." }
    ],
    "experience": [
      { "title": "Software Intern", "org": "TechCorp", "duration": "3 months", "summary": "Built internal tooling." }
    ],
    "education": [
      { "degree": "BS Computer Science", "institution": "State University", "year": "2026" }
    ],
    "rawTextLength": 4210
  },
  "rawResumeText": "AISHA KHAN\nBackend Developer | ... (truncated to ≤ 8000 chars)"
}
```
| Field | Type | Notes |
|-------|------|-------|
| `targetRole` | string | Echoed back |
| `structuredResume.skills` | string[] | Normalized skill names |
| `structuredResume.projects` | object[] | `name`, `tech[]`, `summary` |
| `structuredResume.experience` | object[] | `title`, `org`, `duration`, `summary` |
| `structuredResume.education` | object[] | `degree`, `institution`, `year` |
| `structuredResume.rawTextLength` | number | Char count of extracted text |
| `rawResumeText` | string | **Sibling** of `structuredResume` (not inside it); first ≤ 8000 chars of extracted text; passed to `/analyze` for Formatting + Impact scoring |

### Error Response
```json
{
  "error": {
    "code": "PARSE_FAILED",
    "message": "We couldn't read text from that file. Please upload a text-based PDF or DOCX (not a scanned image).",
    "retryable": true,
    "details": null
  }
}
```

### Example Request
```bash
curl -s -X POST http://localhost:8080/api/parse \
  -F "file=@/path/to/aisha_resume.pdf" \
  -F "targetRole=Backend Developer"
```

### Example Response
```json
{
  "targetRole": "Backend Developer",
  "structuredResume": {
    "skills": ["Node.js", "Express.js", "JavaScript", "Git", "React"],
    "projects": [
      { "name": "E-commerce API", "tech": ["Node.js", "Express.js"], "summary": "REST API for product catalog and orders." }
    ],
    "experience": [
      { "title": "Software Intern", "org": "TechCorp", "duration": "3 months", "summary": "Built internal tooling." }
    ],
    "education": [
      { "degree": "BS Computer Science", "institution": "State University", "year": "2026" }
    ],
    "rawTextLength": 4210
  }
}
```

### Status Codes
| Code | Meaning |
|------|---------|
| `200` | Resume parsed |
| `400` | Missing file / invalid role |
| `413` | File too large |
| `415` | Unsupported file type |
| `422` | No extractable text |
| `502` / `504` | Gemini failure/timeout |
| `500` | Unexpected error |

---

## 4. POST /api/analyze

Core endpoint. Takes a `structuredResume` + `targetRole`, runs the **deterministic skill match** against `roles.json`, then calls Gemini to produce the full `analysisResult` (Resume Health Report, Career Readiness Score, Evidence-Based Skill Gap, Roadmap).

> Skill gaps (`have`/`missing`) are computed in code **before** the AI call. The AI only writes reasoning/recommendations around those facts → guarantees evidence-based output.

### Endpoint
`POST /api/analyze`

### HTTP Method
`POST`

### Request Headers
| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | required | `application/json` |
| `Accept` | optional | `application/json` |

### Request Body
```json
{
  "targetRole": "Backend Developer",
  "structuredResume": {
    "skills": ["Node.js", "Express.js", "JavaScript", "Git", "React"],
    "projects": [
      { "name": "E-commerce API", "tech": ["Node.js", "Express.js"], "summary": "REST API for product catalog." }
    ],
    "experience": [
      { "title": "Software Intern", "org": "TechCorp", "duration": "3 months", "summary": "Built internal tooling." }
    ],
    "education": [
      { "degree": "BS Computer Science", "institution": "State University", "year": "2026" }
    ]
  },
  "rawResumeText": "AISHA KHAN ... (optional, ≤ 8000 chars)"
}
```
| Field | Type | Required | Default |
|-------|------|----------|---------|
| `targetRole` | string (enum) | yes | — |
| `structuredResume` | object | yes | — |
| `structuredResume.skills` | string[] | yes | — |
| `structuredResume.projects` | object[] | no | `[]` |
| `structuredResume.experience` | object[] | no | `[]` |
| `structuredResume.education` | object[] | no | `[]` |
| `rawResumeText` | string | no | `""` — sibling of `structuredResume`, ≤ 8000 chars; used for Formatting + Impact scoring |

### Validation Rules
| Rule | On failure |
|------|-----------|
| `targetRole` ∈ role enum | `400 INVALID_ROLE` |
| `structuredResume` is object | `400 VALIDATION_ERROR` |
| `structuredResume.skills` is non-empty array of strings | `400 VALIDATION_ERROR` |
| `rawResumeText` (if present) is a string ≤ 8000 chars | `400 VALIDATION_ERROR` |
| Body ≤ 1 MB | `413 BODY_TOO_LARGE` |

> **Computed deterministically.** `/api/analyze` runs `matchService` then the deterministic services (`analyzeResumeHealth`+`toSchemaHealth`, `computeReadiness`, `generateRoadmap`). **No Gemini call** is made for analysis. The roadmap is fixed at 24 weeks; there is no `durationWeeks` field.

### Success Response (`200 OK`)
```json
{
  "targetRole": "Backend Developer",
  "matchObject": {
    "role": "Backend Developer",
    "requiredSkills": ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
    "niceToHaveSkills": ["SQL", "Authentication", "TypeScript", "Unit Testing", "Docker", "Error Handling"],
    "have": ["JavaScript", "Node.js", "Express.js", "Git"],
    "missing": ["REST APIs", "MongoDB"],
    "matchedNiceToHave": [],
    "coveragePercentage": 67
  },
  "resumeHealth": {
    "overall": 64,
    "dimensions": [
      { "key": "formatting", "label": "Formatting Quality", "score": 82, "reason": "Clear sections, but inconsistent date formats.", "tip": "Standardize all dates to MMM YYYY." },
      { "key": "impactMetrics", "label": "Impact Metrics", "score": 45, "reason": "Only 1 of 8 bullets has a metric.", "tip": "Add numbers, e.g., 'reduced load time by 40%'." },
      { "key": "skillsCoverage", "label": "Skills Coverage", "score": 70, "reason": "Strong JS skills; backend skills thin for target role.", "tip": "List databases and API tooling." },
      { "key": "keywordCoverage", "label": "Keyword Coverage", "score": 60, "reason": "Missing 'REST API', 'MongoDB', 'JWT'.", "tip": "Weave role keywords into project bullets." },
      { "key": "projectQuality", "label": "Project Quality", "score": 55, "reason": "Projects are tutorial-level.", "tip": "Add one full-stack project with a database." }
    ]
  },
  "readiness": {
    "score": 70,
    "strengths": ["Strong skill match: you have 5 of 6 required Backend Developer skills"],
    "weaknesses": ["Missing 1 required Backend Developer skill(s): MongoDB."],
    "nextActions": ["Build a MongoDB CRUD project to close the MongoDB gap."],
    "scoreBreakdown": { "technicalSkills": 29, "projects": 21, "experience": 11, "resumeHealth": 6, "roleAlignment": 3 }
  },
  "roadmap": [
    { "phase": "Week 1-4", "skill": "REST APIs", "gapAddressed": "REST APIs", "project": "Design a RESTful API with proper resources, verbs, and status codes.", "resource": "MDN: REST API design + Express Router docs" },
    { "phase": "Week 5-8", "skill": "MongoDB", "gapAddressed": "MongoDB", "project": "Build a MongoDB-backed CRUD API.", "resource": "MongoDB University M001: MongoDB Basics" }
  ]
}
```

> **No `skillGap` object.** The dashboard ✅/❌ matrix is built from `matchObject` (`requiredSkills` + `have`/`missing`); recommendations come from `readiness.nextActions`.

**Field reference**
| Path | Type | Notes |
|------|------|-------|
| `matchObject` | object | Full 7-field shape: `role, requiredSkills, niceToHaveSkills, have, missing, matchedNiceToHave, coveragePercentage` (deterministic, from code) |
| `resumeHealth` | object | `toSchemaHealth()` shape — `{ overall, dimensions[] }` |
| `resumeHealth.dimensions[]` | object[] | Exactly 5 entries, fixed `key`s: `formatting`, `impactMetrics`, `skillsCoverage`, `keywordCoverage`, `projectQuality`; each has `score`, `reason`, `tip` |
| `readiness.score` | number 0–100 | |
| `readiness.scoreBreakdown` | object | `technicalSkills(0-35), projects(0-25), experience(0-20), resumeHealth(0-10), roleAlignment(0-10)`; sums to `score`. No `skillGaps` term. |
| `readiness.strengths/weaknesses/nextActions` | string[] | |
| `roadmap` | object[] | **Bare array** of 0–6 `RoadmapMilestone` `{phase, skill, gapAddressed, project, resource}`; each `gapAddressed` ∈ `matchObject.missing` |

### Error Response
```json
{
  "error": {
    "code": "AI_BAD_JSON",
    "message": "Our AI returned an unexpected format. Please try again.",
    "retryable": true,
    "details": null
  }
}
```
Validation example:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "retryable": false,
    "details": [
      { "field": "structuredResume.skills", "issue": "must be a non-empty array of strings" }
    ]
  }
}
```

### Example Request
```bash
curl -s -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "targetRole": "Backend Developer",
    "structuredResume": {
      "skills": ["Node.js", "Express.js", "JavaScript", "Git", "React"],
      "projects": [{ "name": "E-commerce API", "tech": ["Node.js","Express.js"], "summary": "REST API." }],
      "experience": [],
      "education": [{ "degree": "BS CS", "institution": "State University", "year": "2026" }]
    },
    "rawResumeText": "AISHA KHAN ... (optional, <= 8000 chars)"
  }'
```

### Example Response
See **Success Response** above (full `analysisResult`).

### Status Codes
| Code | Meaning |
|------|---------|
| `200` | Analysis produced |
| `400` | Invalid role / body |
| `413` | Body too large |
| `429` | Upstream rate limit |
| `502` / `504` | Gemini failure/timeout |
| `500` | Unexpected error |

---

## 5. POST /api/mentor

Stateless conversational endpoint. The client sends the question, prior chat history, and a `grounding` object (slices of the already-computed analysis). Gemini answers, constrained to cite the user's own data — never generic advice.

> The server holds **no** chat state. The client must send `history` each turn. This keeps the backend stateless and DB-free.

### Endpoint
`POST /api/mentor`

### HTTP Method
`POST`

### Request Headers
| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | required | `application/json` |
| `Accept` | optional | `application/json` |

### Request Body
```json
{
  "question": "Can I become a Backend Developer in 6 months?",
  "history": [
    { "role": "user", "text": "What should I learn next?" },
    { "role": "mentor", "text": "Based on your gap report, MongoDB is your highest-impact missing skill." }
  ],
  "grounding": {
    "targetRole": "Backend Developer",
    "structuredResume": { "skills": ["Node.js", "Express.js", "Git"], "projects": [], "experience": [], "education": [] },
    "matchObject": {
      "role": "Backend Developer",
      "requiredSkills": ["JavaScript","Node.js","Express.js","REST APIs","MongoDB","Git"],
      "niceToHaveSkills": ["SQL","Authentication","TypeScript","Unit Testing","Docker","Error Handling"],
      "have": ["Node.js", "Express.js", "Git"], "missing": ["MongoDB"],
      "matchedNiceToHave": [], "coveragePercentage": 67
    },
    "rawResumeText": "AISHA KHAN ... (≤ 8000 chars)"
  }
}
```
> **The client sends only deterministic inputs. The server reconstructs `resumeHealthReport`, `careerReadiness`, and `roadmap` internally before building `MentorPromptInput`.** The mentor is **non-streaming**.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `question` | string | yes | 1–500 chars |
| `history` | array | no | Default `[]`; max 20 turns (server truncates older) |
| `history[].role` | string | yes (if present) | `"user"` or `"mentor"` |
| `history[].text` | string | yes (if present) | ≤ 2000 chars |
| `grounding` | object | yes | Deterministic inputs only (server rebuilds `MentorPromptInput`) |
| `grounding.targetRole` | string (enum) | yes | Target role |
| `grounding.structuredResume` | object | yes | Parsed resume |
| `grounding.matchObject` | object | yes | Full 7-field MatchObject (`role`, `requiredSkills`, `have`, `missing`, …) |
| `grounding.rawResumeText` | string | no | Source text ≤ 8000 chars; used to reconstruct health (Formatting + Impact) |

### Validation Rules
| Rule | On failure |
|------|-----------|
| `question` non-empty string, ≤ 500 chars | `400 VALIDATION_ERROR` |
| `grounding` present and object | `400 VALIDATION_ERROR` |
| `grounding.targetRole` ∈ role enum | `400 INVALID_ROLE` |
| `grounding.matchObject.missing` is array | `400 VALIDATION_ERROR` |
| `history` (if present) is array, each item `{role,text}` | `400 VALIDATION_ERROR` |
| Body ≤ 1 MB | `413 BODY_TOO_LARGE` |

### Success Response (`200 OK`)
```json
{
  "answer": "Yes — realistically. You already have Node.js and Express. In 6 months: months 1–2 learn MongoDB and Authentication (your top missing skills), months 3–4 add testing and deployment, months 5–6 build two portfolio projects. This matches your roadmap and would lift your readiness from 68 toward ~85.",
  "usedGrounding": true,
  "suggestedFollowups": [
    "What project should I build first?",
    "Which skill has the highest impact?"
  ]
}
```
| Field | Type | Notes |
|-------|------|-------|
| `answer` | string | Markdown-safe plain text |
| `usedGrounding` | boolean | `true` when the answer referenced grounding data |
| `suggestedFollowups` | string[] | 0–3 next-question suggestions for UI chips |

### Error Response
```json
{
  "error": {
    "code": "AI_TIMEOUT",
    "message": "The mentor is taking too long to respond. Please try again.",
    "retryable": true,
    "details": null
  }
}
```

### Example Request
```bash
curl -s -X POST http://localhost:8080/api/mentor \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Am I ready for internships?",
    "history": [],
    "grounding": {
      "targetRole": "Backend Developer",
      "matchObject": { "have": ["Node.js","Express.js"], "missing": ["MongoDB","Authentication"] },
      "readiness": { "score": 68, "strengths": ["Solid JS"], "weaknesses": ["No DB experience"] },
      "roadmap": [{ "week": "1-4", "skill": "MongoDB", "project": "Task manager API" }]
    }
  }'
```

### Example Response
```json
{
  "answer": "Your readiness score is 68. You're ready to apply for frontend-leaning internships now, but for backend roles, close the MongoDB and Authentication gaps first — they're your two missing required skills. Building one MongoDB CRUD project with JWT auth would make you competitive.",
  "usedGrounding": true,
  "suggestedFollowups": [
    "What project should I build next?",
    "How long until I'm backend-ready?"
  ]
}
```

### Status Codes
| Code | Meaning |
|------|---------|
| `200` | Answer returned |
| `400` | Invalid question / grounding |
| `413` | Body too large |
| `429` | Upstream rate limit |
| `502` / `504` | Gemini failure/timeout |
| `500` | Unexpected error |

---

## Appendix A — TypeScript Interfaces (shared contract)

```ts
// ---- enums ----
export type RoleName =
  | "Frontend Developer"
  | "Backend Developer"
  | "Full Stack Developer"
  | "React Developer"
  | "Node.js Developer"
  | "Software Engineer Intern";

// DurationWeeks is DEPRECATED — roadmap is fixed at 24 weeks; no durationWeeks field exists.
export type RawResumeText = string; // <= 8000 chars (sibling of structuredResume)

// ---- shared ----
export interface ApiError {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details: Array<{ field: string; issue: string }> | null;
  };
}

// ---- resume ----
export interface Project { name: string; tech: string[]; summary: string; }
export interface Experience { title: string; org: string; duration: string; summary: string; }
export interface Education { degree: string; institution: string; year: string; }

export interface StructuredResume {
  skills: string[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  rawTextLength?: number;
}
// rawResumeText travels as a SIBLING of structuredResume (not a member).
export type RawResumeText = string; // <= 8000 chars

// ---- /roles ----
export interface RoleEntry {
  id: string;
  name: RoleName;
  required: string[];
  niceToHave: string[];
  keywords: string[];
}
export interface RolesResponse { roles: RoleEntry[]; }

// ---- /parse ----
export interface ParseResponse {
  targetRole: RoleName;
  structuredResume: StructuredResume;
  rawResumeText: string; // sibling, <= 8000 chars
}

// ---- /analyze (matches implemented services) ----
export interface MatchObject {
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  have: string[];
  missing: string[];
  matchedNiceToHave: string[];
  coveragePercentage: number; // 0-100
}

// API health shape = toSchemaHealth() output
export interface HealthDimension {
  key: "formatting" | "impactMetrics" | "skillsCoverage" | "keywordCoverage" | "projectQuality";
  label: string;
  score: number;   // 0-100
  reason: string;
  tip: string;
}
export interface ResumeHealth { overall: number; dimensions: HealthDimension[]; }

// Internal report shape (analysisService) used by the mentor grounding
export interface DimensionScore { score: number; reason: string; fixTip: string; }
export interface ResumeHealthReport {
  formattingQuality: DimensionScore;
  impactMetrics: DimensionScore;
  skillsCoverage: DimensionScore;
  keywordCoverage: DimensionScore;
  projectQuality: DimensionScore;
  overallScore: number;
}

export interface CareerReadiness {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  scoreBreakdown: {
    technicalSkills: number; // 0-35
    projects: number;        // 0-25
    experience: number;      // 0-20
    resumeHealth: number;    // 0-10
    roleAlignment: number;   // 0-10
  };
}

export interface RoadmapMilestone {
  phase: string;        // "Week 1-4"
  skill: string;
  gapAddressed: string; // in matchObject.missing
  project: string;
  resource: string;
}
export type Roadmap = RoadmapMilestone[]; // bare array, 0-6

export interface AnalyzeRequest {
  targetRole: RoleName;
  structuredResume: StructuredResume;
  rawResumeText?: string; // sibling, optional
}
export interface AnalysisResult {
  targetRole: RoleName;
  matchObject: MatchObject;
  resumeHealth: ResumeHealth;        // toSchemaHealth() shape
  readiness: CareerReadiness;        // with scoreBreakdown
  roadmap: Roadmap;                  // bare array; NO skillGap
}

// ---- /mentor ----
export interface ChatTurn { role: "user" | "mentor"; text: string; }
// grounding = deterministic inputs only; the server reconstructs resumeHealthReport,
// careerReadiness, and roadmap internally before building MentorPromptInput.
export interface MentorGrounding {
  targetRole: RoleName;
  structuredResume: StructuredResume;
  matchObject: MatchObject;
  rawResumeText?: string; // <= 8000 chars
}
export interface MentorRequest {
  question: string;
  history?: ChatTurn[];
  grounding: MentorGrounding;
}
export interface MentorResponse {
  answer: string;
  usedGrounding: boolean;
  suggestedFollowups: string[];
}
```

## Appendix B — Endpoint Summary

| # | Method | Endpoint | Auth | Body | Returns |
|---|--------|----------|------|------|---------|
| 1 | GET | `/api/health` | none | — | health object |
| 2 | GET | `/api/roles` | none | — | `RolesResponse` |
| 3 | POST | `/api/parse` | none | multipart | `ParseResponse` |
| 4 | POST | `/api/analyze` | none | JSON | `AnalysisResult` |
| 5 | POST | `/api/mentor` | none | JSON | `MentorResponse` |

## Appendix C — Limits & Timeouts

| Setting | Value |
|---------|-------|
| Max file size | 5 MB |
| Max JSON body | 1 MB |
| Min extractable text | 50 chars |
| Gemini timeout (analyze/parse) | 20 s |
| Gemini timeout (mentor) | 15 s |
| Gemini retries | 2 (exponential backoff) |
| Max chat history turns | 20 (server truncates) |
| Question length | 1–500 chars |
| CORS origin | client origin only |

*End of Document.*
