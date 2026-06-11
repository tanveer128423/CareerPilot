# CareerPilot — Data Schemas

**Author:** Principal TypeScript Architect
**Version:** 1.0
**Source of truth alignment:** `ARCHITECTURE.md` · `API_CONTRACTS.md`
**JSON Schema dialect:** Draft 2020-12 (`https://json-schema.org/draft/2020-12/schema`)

> **Purpose:** Canonical, machine-validatable definitions for every data object exchanged in CareerPilot. Each schema includes a TypeScript interface, a JSON Schema, an example object, and validation rules. These match `API_CONTRACTS.md` field-for-field and are safe to use for runtime validation (e.g., Ajv), code generation, and shared client/server types.

---

## Shared Definitions

### Role Enum
Used by `targetRole` and `grounding.targetRole` everywhere. Case-sensitive, exact match.
```ts
export type RoleName =
  | "Frontend Developer"
  | "Backend Developer"
  | "Full Stack Developer"
  | "React Developer"
  | "Node.js Developer"
  | "Software Engineer Intern";
```
```json
{
  "$id": "RoleName",
  "type": "string",
  "enum": [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "React Developer",
    "Node.js Developer",
    "Software Engineer Intern"
  ]
}
```

### Duration Enum
> **DEPRECATED — not used.** The roadmap is fixed at 24 weeks (4-week phases) and `durationWeeks` is not a field anywhere. Retained only as a historical note.

### RawResumeText (shared)
```ts
export type RawResumeText = string; // truncated source text, ≤ 8000 chars
```
```json
{ "$id": "RawResumeText", "type": "string", "maxLength": 8000 }
```

### Health Dimension Key Enum
```ts
export type HealthDimensionKey =
  | "formatting"
  | "impactMetrics"
  | "skillsCoverage"
  | "keywordCoverage"
  | "projectQuality";
```
```json
{
  "$id": "HealthDimensionKey",
  "type": "string",
  "enum": ["formatting", "impactMetrics", "skillsCoverage", "keywordCoverage", "projectQuality"]
}
```

### Score Type (reused)
A 0–100 integer used by all scores.
```json
{ "$id": "Score", "type": "integer", "minimum": 0, "maximum": 100 }
```

---

## 1. Project

### TypeScript Interface
```ts
export interface Project {
  name: string;
  tech: string[];
  summary: string;
}
```

### JSON Schema
```json
{
  "$id": "Project",
  "type": "object",
  "additionalProperties": false,
  "required": ["name", "tech", "summary"],
  "properties": {
    "name": { "type": "string", "minLength": 1, "maxLength": 120 },
    "tech": {
      "type": "array",
      "items": { "type": "string", "minLength": 1, "maxLength": 40 },
      "maxItems": 30
    },
    "summary": { "type": "string", "minLength": 1, "maxLength": 500 }
  }
}
```

### Example Object
```json
{
  "name": "E-commerce API",
  "tech": ["Node.js", "Express.js"],
  "summary": "REST API for product catalog and orders."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `name` | Required, non-empty string, ≤ 120 chars |
| `tech` | Required array of non-empty strings, ≤ 30 items; may be empty `[]` |
| `summary` | Required, non-empty string, ≤ 500 chars |
| object | No additional properties allowed |

---

## 2. Experience

### TypeScript Interface
```ts
export interface Experience {
  title: string;
  org: string;
  duration: string;
  summary: string;
}
```

### JSON Schema
```json
{
  "$id": "Experience",
  "type": "object",
  "additionalProperties": false,
  "required": ["title", "org", "duration", "summary"],
  "properties": {
    "title": { "type": "string", "minLength": 1, "maxLength": 120 },
    "org": { "type": "string", "minLength": 1, "maxLength": 120 },
    "duration": { "type": "string", "minLength": 1, "maxLength": 60 },
    "summary": { "type": "string", "minLength": 1, "maxLength": 500 }
  }
}
```

### Example Object
```json
{
  "title": "Software Intern",
  "org": "TechCorp",
  "duration": "3 months",
  "summary": "Built internal tooling and maintained REST endpoints."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `title` | Required, non-empty, ≤ 120 chars |
| `org` | Required, non-empty, ≤ 120 chars |
| `duration` | Required, non-empty, ≤ 60 chars (free text, e.g., "3 months") |
| `summary` | Required, non-empty, ≤ 500 chars |
| object | No additional properties |

---

## 3. Education

### TypeScript Interface
```ts
export interface Education {
  degree: string;
  institution: string;
  year: string;
}
```

### JSON Schema
```json
{
  "$id": "Education",
  "type": "object",
  "additionalProperties": false,
  "required": ["degree", "institution", "year"],
  "properties": {
    "degree": { "type": "string", "minLength": 1, "maxLength": 120 },
    "institution": { "type": "string", "minLength": 1, "maxLength": 120 },
    "year": { "type": "string", "minLength": 1, "maxLength": 20 }
  }
}
```

### Example Object
```json
{
  "degree": "BS Computer Science",
  "institution": "State University",
  "year": "2026"
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `degree` | Required, non-empty, ≤ 120 chars |
| `institution` | Required, non-empty, ≤ 120 chars |
| `year` | Required, non-empty string, ≤ 20 chars (string to allow ranges like "2022–2026") |
| object | No additional properties |

---

## 4. StructuredResume

### TypeScript Interface
```ts
export interface StructuredResume {
  skills: string[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  rawTextLength?: number;
}
```

> **`rawResumeText` is NOT a member of `StructuredResume`.** The truncated source text (≤ 8000 chars) travels as a **top-level sibling** of `structuredResume` on `/parse` (response) and `/analyze` (request). `StructuredResume` holds parsed data only. The shared `RawResumeText` type is: `{ "$id": "RawResumeText", "type": "string", "maxLength": 8000 }`.

### JSON Schema
```json
{
  "$id": "StructuredResume",
  "type": "object",
  "additionalProperties": false,
  "required": ["skills", "projects", "experience", "education"],
  "properties": {
    "skills": {
      "type": "array",
      "minItems": 1,
      "maxItems": 100,
      "items": { "type": "string", "minLength": 1, "maxLength": 60 }
    },
    "projects": { "type": "array", "items": { "$ref": "Project" }, "maxItems": 30 },
    "experience": { "type": "array", "items": { "$ref": "Experience" }, "maxItems": 30 },
    "education": { "type": "array", "items": { "$ref": "Education" }, "maxItems": 20 },
    "rawTextLength": { "type": "integer", "minimum": 0 }
  }
}
```

### Example Object
```json
{
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
```

### Validation Rules
| Field | Rule |
|-------|------|
| `skills` | **Required**, non-empty array of non-empty strings (≥ 1 item), ≤ 100 items |
| `projects` | Required array (may be empty `[]`); each item a valid `Project` |
| `experience` | Required array (may be empty `[]`); each item a valid `Experience` |
| `education` | Required array (may be empty `[]`); each item a valid `Education` |
| `rawTextLength` | Optional non-negative integer; present on `/parse` output, omitted on `/analyze` input |
| object | No additional properties |

---

## 5. MatchObject

> **Deterministic.** Computed in code by `matchService` (resume skills ∩ `roles.json[role].required`) **before** any AI call. The anti-hallucination backbone.

### TypeScript Interface
```ts
export interface MatchObject {
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  have: string[];
  missing: string[];
  matchedNiceToHave: string[];
  coveragePercentage: number; // 0-100
}
```

### JSON Schema
```json
{
  "$id": "MatchObject",
  "type": "object",
  "additionalProperties": false,
  "required": ["role", "requiredSkills", "niceToHaveSkills", "have", "missing", "matchedNiceToHave", "coveragePercentage"],
  "properties": {
    "role": { "type": "string", "minLength": 1, "maxLength": 60 },
    "requiredSkills": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 60 } },
    "niceToHaveSkills": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 60 } },
    "have": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 60 } },
    "missing": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 60 } },
    "matchedNiceToHave": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 60 } },
    "coveragePercentage": { "$ref": "Score" }
  }
}
```

### Example Object
```json
{
  "role": "Backend Developer",
  "requiredSkills": ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
  "niceToHaveSkills": ["SQL", "Authentication", "TypeScript", "Unit Testing", "Docker", "Error Handling"],
  "have": ["JavaScript", "Node.js", "Express.js", "Git"],
  "missing": ["REST APIs", "MongoDB"],
  "matchedNiceToHave": [],
  "coveragePercentage": 67
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `have` | Required array of strings (may be empty); each a required skill present in resume |
| `missing` | Required array of strings (may be empty); each a required skill absent from resume |
| invariant | `have ∪ missing` = the role's `required` skill set; `have ∩ missing = ∅` (disjoint) |
| object | No additional properties |

---

## 6. ResumeHealthDimension

### TypeScript Interface
```ts
export interface ResumeHealthDimension {
  key: HealthDimensionKey;
  label: string;
  score: number;   // 0-100
  reason: string;
  tip: string;
}
```

### JSON Schema
```json
{
  "$id": "ResumeHealthDimension",
  "type": "object",
  "additionalProperties": false,
  "required": ["key", "label", "score", "reason", "tip"],
  "properties": {
    "key": { "$ref": "HealthDimensionKey" },
    "label": { "type": "string", "minLength": 1, "maxLength": 60 },
    "score": { "$ref": "Score" },
    "reason": { "type": "string", "minLength": 1, "maxLength": 300 },
    "tip": { "type": "string", "minLength": 1, "maxLength": 300 }
  }
}
```

### Example Object
```json
{
  "key": "impactMetrics",
  "label": "Impact Metrics",
  "score": 45,
  "reason": "Only 1 of 8 bullets includes a quantified metric.",
  "tip": "Add numbers, e.g., 'reduced load time by 40%'."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `key` | Required, one of the 5 fixed dimension keys |
| `label` | Required, non-empty, ≤ 60 chars (human label) |
| `score` | Required integer 0–100 |
| `reason` | Required, non-empty, ≤ 300 chars — explains **why** the score |
| `tip` | Required, non-empty, ≤ 300 chars — actionable fix |
| object | No additional properties |

---

## 7. ResumeHealthReport

### TypeScript Interface
```ts
export interface ResumeHealthReport {
  overall: number; // 0-100
  dimensions: ResumeHealthDimension[];
}
```

### JSON Schema
```json
{
  "$id": "ResumeHealthReport",
  "type": "object",
  "additionalProperties": false,
  "required": ["overall", "dimensions"],
  "properties": {
    "overall": { "$ref": "Score" },
    "dimensions": {
      "type": "array",
      "minItems": 5,
      "maxItems": 5,
      "items": { "$ref": "ResumeHealthDimension" }
    }
  }
}
```

### Example Object
```json
{
  "overall": 64,
  "dimensions": [
    { "key": "formatting", "label": "Formatting Quality", "score": 82, "reason": "Clear sections, but inconsistent date formats.", "tip": "Standardize all dates to MMM YYYY." },
    { "key": "impactMetrics", "label": "Impact Metrics", "score": 45, "reason": "Only 1 of 8 bullets has a metric.", "tip": "Add numbers, e.g., 'reduced load time by 40%'." },
    { "key": "skillsCoverage", "label": "Skills Coverage", "score": 70, "reason": "Strong JS skills; backend skills thin for target role.", "tip": "List databases and API tooling." },
    { "key": "keywordCoverage", "label": "Keyword Coverage", "score": 60, "reason": "Missing 'REST API', 'MongoDB', 'JWT'.", "tip": "Weave role keywords into project bullets." },
    { "key": "projectQuality", "label": "Project Quality", "score": 55, "reason": "Projects are tutorial-level.", "tip": "Add one full-stack project with a database." }
  ]
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `overall` | Required integer 0–100 (≈ average of the 5 dimension scores) |
| `dimensions` | Required, **exactly 5** items |
| dimensions uniqueness | Each of the 5 `key` values must appear **exactly once** |
| object | No additional properties |

---

## 8. CareerReadiness

### TypeScript Interface
```ts
export interface CareerReadiness {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  scoreBreakdown: {
    technicalSkills: number; // out of 35
    projects: number;        // out of 25
    experience: number;      // out of 20
    resumeHealth: number;    // out of 10
    roleAlignment: number;   // out of 10
  };
}
```

### JSON Schema
```json
{
  "$id": "CareerReadiness",
  "type": "object",
  "additionalProperties": false,
  "required": ["score", "strengths", "weaknesses", "nextActions", "scoreBreakdown"],
  "properties": {
    "score": { "$ref": "Score" },
    "strengths": { "type": "array", "minItems": 0, "maxItems": 10, "items": { "type": "string", "minLength": 1, "maxLength": 200 } },
    "weaknesses": { "type": "array", "minItems": 0, "maxItems": 10, "items": { "type": "string", "minLength": 1, "maxLength": 200 } },
    "nextActions": { "type": "array", "minItems": 1, "maxItems": 10, "items": { "type": "string", "minLength": 1, "maxLength": 200 } },
    "scoreBreakdown": {
      "type": "object",
      "additionalProperties": false,
      "required": ["technicalSkills", "projects", "experience", "resumeHealth", "roleAlignment"],
      "properties": {
        "technicalSkills": { "type": "integer", "minimum": 0, "maximum": 35 },
        "projects": { "type": "integer", "minimum": 0, "maximum": 25 },
        "experience": { "type": "integer", "minimum": 0, "maximum": 20 },
        "resumeHealth": { "type": "integer", "minimum": 0, "maximum": 10 },
        "roleAlignment": { "type": "integer", "minimum": 0, "maximum": 10 }
      }
    }
  }
}
```

### Example Object
```json
{
  "score": 70,
  "strengths": ["Strong skill match: you have 5 of 6 required Backend Developer skills", "Your project \"E-commerce API\" demonstrates required skills"],
  "weaknesses": ["Missing 1 required Backend Developer skill(s): MongoDB."],
  "nextActions": ["Build a MongoDB CRUD project to close the MongoDB gap."],
  "scoreBreakdown": { "technicalSkills": 29, "projects": 21, "experience": 11, "resumeHealth": 6, "roleAlignment": 3 }
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `score` | Required integer 0–100 |
| `scoreBreakdown` | Required; all 5 weighted parts present |
| `scoreBreakdown.technicalSkills` | 0–35 (35% weight) — the ONLY skill-coverage term |
| `scoreBreakdown.projects` | 0–25 (25% weight) |
| `scoreBreakdown.experience` | 0–20 (20% weight) |
| `scoreBreakdown.resumeHealth` | 0–10 (10% weight) |
| `scoreBreakdown.roleAlignment` | 0–10 (10% weight) |
| invariant | Sum of `scoreBreakdown` parts equals `score` exactly (rounded contributions). No `skillGaps` term — skill coverage is counted once. |
| `strengths`/`weaknesses` | 0–10 non-empty strings each, ≤ 200 chars |
| `nextActions` | 1–10 non-empty strings, ≤ 200 chars |
| object | No additional properties (nested `scoreBreakdown` also sealed) |

---

## 9. SkillGapItem

> **DEPRECATED — NOT PRODUCED AT RUNTIME.** No service generates a standalone `skillGap` object. The dashboard's ✅/❌ skill-gap view is derived directly from `MatchObject` (`requiredSkills` + `have`/`missing`), and recommendations come from `CareerReadiness.nextActions`. This schema is retained for reference only and is **not** part of `AnalysisResult`.

### TypeScript Interface
```ts
export interface SkillGapItem {
  skill: string;
  have: boolean;
  recommendation: string | null;
}
```

### JSON Schema
```json
{
  "$id": "SkillGapItem",
  "type": "object",
  "additionalProperties": false,
  "required": ["skill", "have", "recommendation"],
  "properties": {
    "skill": { "type": "string", "minLength": 1, "maxLength": 60 },
    "have": { "type": "boolean" },
    "recommendation": { "type": ["string", "null"], "maxLength": 300 }
  },
  "allOf": [
    {
      "if": { "properties": { "have": { "const": true } } },
      "then": { "properties": { "recommendation": { "type": "null" } } }
    },
    {
      "if": { "properties": { "have": { "const": false } } },
      "then": { "properties": { "recommendation": { "type": "string", "minLength": 1 } } }
    }
  ]
}
```

### Example Objects
```json
{ "skill": "Node.js", "have": true, "recommendation": null }
```
```json
{ "skill": "MongoDB", "have": false, "recommendation": "Build one MongoDB-based CRUD project to demonstrate database skills." }
```

### Validation Rules
| Field | Rule |
|-------|------|
| `skill` | Required, non-empty, ≤ 60 chars |
| `have` | Required boolean (sourced from `MatchObject`) |
| `recommendation` | Required key; **`null` when `have: true`**, **non-empty string when `have: false`** |
| evidence rule | When present, `recommendation` must be specific/actionable (no generic advice) per PRD §7 |
| object | No additional properties |

---

## 10. SkillGapAnalysis

> **DEPRECATED — NOT PRODUCED AT RUNTIME.** See the note on #9. The skill-gap UI is built from `MatchObject` + `CareerReadiness.nextActions`; there is no `SkillGapAnalysis` object in `AnalysisResult`.

### TypeScript Interface
```ts
export interface SkillGapAnalysis {
  required: SkillGapItem[];
  quickWins: string[];
  longTerm: string[];
}
```

### JSON Schema
```json
{
  "$id": "SkillGapAnalysis",
  "type": "object",
  "additionalProperties": false,
  "required": ["required", "quickWins", "longTerm"],
  "properties": {
    "required": { "type": "array", "minItems": 1, "items": { "$ref": "SkillGapItem" } },
    "quickWins": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 60 } },
    "longTerm": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 60 } }
  }
}
```

### Example Object
```json
{
  "required": [
    { "skill": "Node.js", "have": true, "recommendation": null },
    { "skill": "Express.js", "have": true, "recommendation": null },
    { "skill": "REST APIs", "have": false, "recommendation": "Document your E-commerce API's endpoints using REST conventions." },
    { "skill": "MongoDB", "have": false, "recommendation": "Build one MongoDB-based CRUD project." },
    { "skill": "SQL", "have": false, "recommendation": "Complete a SQL basics course and add a query-driven feature." },
    { "skill": "Authentication", "have": false, "recommendation": "Add JWT-based auth to an existing project." },
    { "skill": "Git", "have": true, "recommendation": null }
  ],
  "quickWins": ["REST APIs", "Authentication"],
  "longTerm": ["SQL", "MongoDB"]
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `required` | Required, ≥ 1 `SkillGapItem`; one entry per role-required skill |
| `quickWins` | Required array (may be empty); each value should be a `skill` from a `required` item with `have:false` |
| `longTerm` | Required array (may be empty); each value should be a `skill` from a `required` item with `have:false` |
| consistency | `quickWins ∩ longTerm = ∅`; every listed skill must exist in `required` and be missing |
| object | No additional properties |

---

## 11. RoadmapMilestone

### TypeScript Interface
```ts
export interface RoadmapMilestone {
  phase: string;        // e.g. "Week 1-4"
  skill: string;
  gapAddressed: string; // always === skill; in MatchObject.missing
  project: string;
  resource: string;
}
```

### JSON Schema
```json
{
  "$id": "RoadmapMilestone",
  "type": "object",
  "additionalProperties": false,
  "required": ["phase", "skill", "gapAddressed", "project", "resource"],
  "properties": {
    "phase": { "type": "string", "minLength": 1, "maxLength": 20 },
    "skill": { "type": "string", "minLength": 1, "maxLength": 60 },
    "gapAddressed": { "type": "string", "minLength": 1, "maxLength": 60 },
    "project": { "type": "string", "minLength": 1, "maxLength": 200 },
    "resource": { "type": "string", "minLength": 1, "maxLength": 200 }
  }
}
```

### Example Object
```json
{
  "phase": "Week 1-4",
  "skill": "MongoDB",
  "gapAddressed": "MongoDB",
  "project": "Build a MongoDB-backed CRUD API (e.g., a notes or task service).",
  "resource": "MongoDB University M001: MongoDB Basics"
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `phase` | Required, non-empty; label `Week N-M` |
| `skill` | Required, non-empty, ≤ 60 chars |
| `gapAddressed` | Required, non-empty; always equals `skill` and is a member of `MatchObject.missing` (evidence link) |
| `project` | Required, non-empty, ≤ 200 chars — concrete build task |
| `resource` | Required, non-empty, ≤ 200 chars |
| object | No additional properties |

---

## 12. Roadmap

> **The roadmap is a BARE ARRAY** `RoadmapMilestone[]` (no `{ durationWeeks, milestones }` wrapper). Duration is **fixed at 24 weeks** with 4-week phases (≤ 6 milestones), generated deterministically by `roadmapService.ts`. There is no `durationWeeks` field anywhere.

### TypeScript Interface
```ts
export type Roadmap = RoadmapMilestone[];
```

### JSON Schema
```json
{
  "$id": "Roadmap",
  "type": "array",
  "maxItems": 6,
  "items": { "$ref": "RoadmapMilestone" }
}
```

### Example Object
```json
[
  { "phase": "Week 1-4", "skill": "MongoDB", "gapAddressed": "MongoDB", "project": "Build a MongoDB-backed CRUD API.", "resource": "MongoDB University M001: MongoDB Basics" },
  { "phase": "Week 5-8", "skill": "Authentication", "gapAddressed": "Authentication", "project": "Add JWT-based register/login and protected routes to an existing API.", "resource": "jwt.io intro + 'Node.js JWT Auth' guide" }
]
```

### Validation Rules
| Field | Rule |
|-------|------|
| (array) | Bare array of 0–6 `RoadmapMilestone`. Empty `[]` when there are no missing skills. |
| evidence rule | Every milestone's `gapAddressed` is a member of `MatchObject.missing` (no milestone without a gap) |
| duration | Fixed 24 weeks, 4-week phases; no `durationWeeks` field |

---

## 13. MentorMessage

> Represents a single chat turn. Used in the `history` array of the `/api/mentor` request (and stored client-side).

### TypeScript Interface
```ts
export type MentorRole = "user" | "mentor";

export interface MentorMessage {
  role: MentorRole;
  text: string;
}
```

### JSON Schema
```json
{
  "$id": "MentorMessage",
  "type": "object",
  "additionalProperties": false,
  "required": ["role", "text"],
  "properties": {
    "role": { "type": "string", "enum": ["user", "mentor"] },
    "text": { "type": "string", "minLength": 1, "maxLength": 2000 }
  }
}
```

### Example Objects
```json
{ "role": "user", "text": "What should I learn next?" }
```
```json
{ "role": "mentor", "text": "Based on your gap report, MongoDB is your highest-impact missing skill." }
```

### Validation Rules
| Field | Rule |
|-------|------|
| `role` | Required, either `"user"` or `"mentor"` |
| `text` | Required, non-empty, ≤ 2000 chars |
| history rule | The `history` array holds ≤ 20 of these (server truncates oldest) |
| object | No additional properties |

---

## 14. MentorResponse

### TypeScript Interface
```ts
export interface MentorResponse {
  answer: string;
  usedGrounding: boolean;
  suggestedFollowups: string[];
}
```

### JSON Schema
```json
{
  "$id": "MentorResponse",
  "type": "object",
  "additionalProperties": false,
  "required": ["answer", "usedGrounding", "suggestedFollowups"],
  "properties": {
    "answer": { "type": "string", "minLength": 1, "maxLength": 4000 },
    "usedGrounding": { "type": "boolean" },
    "suggestedFollowups": {
      "type": "array",
      "minItems": 0,
      "maxItems": 3,
      "items": { "type": "string", "minLength": 1, "maxLength": 120 }
    }
  }
}
```

### Example Object
```json
{
  "answer": "Your readiness score is 68. You're ready for frontend-leaning internships now, but for backend roles, close the MongoDB and Authentication gaps first.",
  "usedGrounding": true,
  "suggestedFollowups": [
    "What project should I build next?",
    "How long until I'm backend-ready?"
  ]
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `answer` | Required, non-empty, ≤ 4000 chars; markdown-safe plain text |
| `usedGrounding` | Required boolean; `true` when the answer referenced grounding data |
| `suggestedFollowups` | Required array of 0–3 non-empty strings, each ≤ 120 chars |
| object | No additional properties |

---

## 15. AnalysisResult

> The complete payload returned by `POST /api/analyze`. Composes schemas 4–12.

> Composes #4–#12 **minus the deprecated `skillGap`**. `resumeHealth` is the **`toSchemaHealth()` adapter shape** (`{ overall, dimensions[] }`), NOT the internal `ResumeHealthReport`. `roadmap` is a **bare array**. The server assembles this from the deterministic services and injects `targetRole` + `matchObject`.

### TypeScript Interface
```ts
export interface AnalysisResult {
  targetRole: RoleName;
  matchObject: MatchObject;
  resumeHealth: SchemaResumeHealth;   // toSchemaHealth() shape: { overall, dimensions[] }
  readiness: CareerReadiness;          // { score, strengths, weaknesses, nextActions, scoreBreakdown }
  roadmap: RoadmapMilestone[];         // bare array, 0-6 milestones
}
```

### JSON Schema
```json
{
  "$id": "AnalysisResult",
  "type": "object",
  "additionalProperties": false,
  "required": ["targetRole", "matchObject", "resumeHealth", "readiness", "roadmap"],
  "properties": {
    "targetRole": { "$ref": "RoleName" },
    "matchObject": { "$ref": "MatchObject" },
    "resumeHealth": { "$ref": "ResumeHealthReport" },
    "readiness": { "$ref": "CareerReadiness" },
    "roadmap": { "$ref": "Roadmap" }
  }
}
```

### Example Object
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

### Validation Rules
| Field | Rule |
|-------|------|
| `targetRole` | Required, valid `RoleName` |
| `matchObject` | Required, valid `MatchObject` (full 7-field shape) |
| `resumeHealth` | Required, `toSchemaHealth()` shape (`{ overall, dimensions[] }`, exactly 5 dimensions) |
| `readiness` | Required, valid `CareerReadiness` (with `scoreBreakdown`) |
| `roadmap` | Required, bare `RoadmapMilestone[]` (0–6 items) |
| (no `skillGap`) | `skillGap` is NOT part of `AnalysisResult` (deprecated) |
| cross-object invariant | `roadmap[i].gapAddressed` ∈ `matchObject.missing` |
| object | No additional properties |

---

## 16. ApiError

> The standard error envelope returned by **all** endpoints on any 4xx/5xx.

### TypeScript Interface
```ts
export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details: ApiErrorDetail[] | null;
  };
}
```

### JSON Schema
```json
{
  "$id": "ApiError",
  "type": "object",
  "additionalProperties": false,
  "required": ["error"],
  "properties": {
    "error": {
      "type": "object",
      "additionalProperties": false,
      "required": ["code", "message", "retryable", "details"],
      "properties": {
        "code": {
          "type": "string",
          "enum": [
            "VALIDATION_ERROR", "MISSING_FILE", "UNSUPPORTED_FILE_TYPE",
            "FILE_TOO_LARGE", "BODY_TOO_LARGE", "PARSE_FAILED", "INVALID_ROLE",
            "AI_TIMEOUT", "AI_BAD_JSON", "AI_UNAVAILABLE", "RATE_LIMITED", "INTERNAL_ERROR"
          ]
        },
        "message": { "type": "string", "minLength": 1, "maxLength": 300 },
        "retryable": { "type": "boolean" },
        "details": {
          "type": ["array", "null"],
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["field", "issue"],
            "properties": {
              "field": { "type": "string", "minLength": 1, "maxLength": 120 },
              "issue": { "type": "string", "minLength": 1, "maxLength": 200 }
            }
          }
        }
      }
    }
  }
}
```

### Example Objects
```json
{
  "error": {
    "code": "PARSE_FAILED",
    "message": "We couldn't read text from that file. Please upload a text-based PDF or DOCX.",
    "retryable": true,
    "details": null
  }
}
```
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

### Validation Rules
| Field | Rule |
|-------|------|
| `error.code` | Required, one of the 12 stable error codes (see `API_CONTRACTS.md`) |
| `error.message` | Required, non-empty, ≤ 300 chars; user-safe (no stack traces) |
| `error.retryable` | Required boolean; drives the client "Retry" affordance |
| `error.details` | Required key; array of `{field, issue}` for validation errors, otherwise `null` |
| object | No additional properties at either level |

---

## Appendix A — Schema Composition Map

```
AnalysisResult
├── targetRole ........... RoleName (enum)
├── matchObject .......... MatchObject              (#5, deterministic)
├── resumeHealth ......... ResumeHealthReport       (#7)
│   └── dimensions[] ..... ResumeHealthDimension    (#6)  ×5
├── readiness ............ CareerReadiness          (#8, scoreBreakdown)
└── roadmap .............. RoadmapMilestone[]       (#11, bare array)

(#9 SkillGapItem / #10 SkillGapAnalysis are DEPRECATED — not in AnalysisResult)

StructuredResume          (#4)            + sibling rawResumeText (string ≤8000)
├── projects[] ........... Project                  (#1)
├── experience[] ......... Experience               (#2)
└── education[] .......... Education                (#3)

Mentor
├── history[] ............ MentorMessage            (#13)
└── response ............. MentorResponse           (#14)

Errors .................. ApiError                  (#16)
```

## Appendix B — Endpoint → Schema Mapping

| Endpoint | Request schema | Success schema | Error schema |
|----------|----------------|----------------|--------------|
| `GET /api/health` | — | (inline health object) | `ApiError` |
| `GET /api/roles` | — | `{ roles: RoleEntry[] }` | `ApiError` |
| `POST /api/parse` | multipart (`file`, `targetRole`) | `{ targetRole, structuredResume: StructuredResume, rawResumeText }` | `ApiError` |
| `POST /api/analyze` | `{ targetRole, structuredResume: StructuredResume, rawResumeText? }` | `AnalysisResult` | `ApiError` |
| `POST /api/mentor` | `{ question, history?: MentorMessage[], grounding }` | `MentorResponse` | `ApiError` |

## Appendix C — Ajv Setup Note (runtime validation)
- Register the **Shared Definitions** (`RoleName`, `HealthDimensionKey`, `Score`, `RawResumeText`) and each `$id` schema with `ajv.addSchema(...)` so `$ref` resolves by `$id`. (`DurationWeeks` is no longer used — roadmap is fixed at 24 weeks.)
- **`/api/analyze` is computed by the deterministic services** (`analyzeResumeHealth`+`toSchemaHealth`, `computeReadiness`, `generateRoadmap`); validate the assembled `AnalysisResult` before returning. Gemini is used only for `/parse` structuring and the mentor.
- Compile validators once at server startup; reuse per request.
- Validate **inbound** request bodies (reject → `400 VALIDATION_ERROR` with `details`).
- Validate **AI output** against `AnalysisResult` / `MentorResponse` before returning; on failure repair JSON or throw `AI_BAD_JSON` (502).

*End of Document.*
