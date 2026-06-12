/**
 * validators.ts
 *
 * Ajv-based runtime validators for the schemas exchanged by the API
 * (SCHEMAS.md). All referenced sub-schemas are registered by `$id` BEFORE the
 * top-level schemas are compiled, so `$ref` resolves at startup (otherwise Ajv
 * throws "can't resolve reference").
 *
 * Exposes a single `validate<T>(schemaName, data)` helper returning a normalized
 * `{ valid, errors }` shape ready to drop into a VALIDATION_ERROR envelope.
 *
 * @module utils/validators
 */

import _Ajv2020 from "ajv/dist/2020.js";
import _addFormats from "ajv-formats";
import type { ValidateFunction, ErrorObject } from "ajv";
import type { ApiErrorDetail } from "./AppError.js";

// Ajv v8 and ajv-formats ship as CommonJS; under NodeNext the constructable
// value lives on `.default` when interop wraps the module namespace.
type AjvCtor = new (opts?: Record<string, unknown>) => {
  addSchema: (schema: object, key?: string) => unknown;
  compile: (schema: object) => ValidateFunction;
};
const Ajv2020 = ((_Ajv2020 as unknown as { default?: unknown }).default ??
  _Ajv2020) as AjvCtor;
const addFormats = ((_addFormats as unknown as { default?: unknown }).default ??
  _addFormats) as (ajv: unknown) => void;

// ---------------------------------------------------------------------------
// Shared definitions (registered first)
// ---------------------------------------------------------------------------

const RoleName = {
  $id: "RoleName",
  type: "string",
  enum: [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "React Developer",
    "Node.js Developer",
    "Software Engineer Intern",
  ],
};

const HealthDimensionKey = {
  $id: "HealthDimensionKey",
  type: "string",
  enum: ["formatting", "impactMetrics", "skillsCoverage", "keywordCoverage", "projectQuality"],
};

const Score = { $id: "Score", type: "integer", minimum: 0, maximum: 100 };

const RawResumeText = { $id: "RawResumeText", type: "string", maxLength: 8000 };

// ---------------------------------------------------------------------------
// Object sub-schemas
// ---------------------------------------------------------------------------

const Project = {
  $id: "Project",
  type: "object",
  additionalProperties: false,
  required: ["name", "tech", "summary"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 120 },
    tech: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: 40 },
      maxItems: 30,
    },
    summary: { type: "string", minLength: 1, maxLength: 500 },
  },
};

const Experience = {
  $id: "Experience",
  type: "object",
  additionalProperties: false,
  required: ["title", "org", "duration", "summary"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 120 },
    org: { type: "string", minLength: 1, maxLength: 120 },
    duration: { type: "string", minLength: 1, maxLength: 60 },
    summary: { type: "string", minLength: 1, maxLength: 500 },
  },
};

const Education = {
  $id: "Education",
  type: "object",
  additionalProperties: false,
  required: ["degree", "institution", "year"],
  properties: {
    degree: { type: "string", minLength: 1, maxLength: 120 },
    institution: { type: "string", minLength: 1, maxLength: 120 },
    year: { type: "string", minLength: 1, maxLength: 20 },
  },
};

const MatchObject = {
  $id: "MatchObject",
  type: "object",
  additionalProperties: false,
  required: [
    "role",
    "requiredSkills",
    "niceToHaveSkills",
    "have",
    "missing",
    "matchedNiceToHave",
    "coveragePercentage",
  ],
  properties: {
    role: { type: "string", minLength: 1, maxLength: 60 },
    requiredSkills: { type: "array", items: { type: "string", minLength: 1, maxLength: 60 } },
    niceToHaveSkills: { type: "array", items: { type: "string", minLength: 1, maxLength: 60 } },
    have: { type: "array", items: { type: "string", minLength: 1, maxLength: 60 } },
    missing: { type: "array", items: { type: "string", minLength: 1, maxLength: 60 } },
    matchedNiceToHave: { type: "array", items: { type: "string", minLength: 1, maxLength: 60 } },
    coveragePercentage: { $ref: "Score" },
  },
};

const ResumeHealthDimension = {
  $id: "ResumeHealthDimension",
  type: "object",
  additionalProperties: false,
  required: ["key", "label", "score", "reason", "tip"],
  properties: {
    key: { $ref: "HealthDimensionKey" },
    label: { type: "string", minLength: 1, maxLength: 60 },
    score: { $ref: "Score" },
    reason: { type: "string", minLength: 1, maxLength: 300 },
    tip: { type: "string", minLength: 1, maxLength: 300 },
  },
};

const ResumeHealthReport = {
  $id: "ResumeHealthReport",
  type: "object",
  additionalProperties: false,
  required: ["overall", "dimensions"],
  properties: {
    overall: { $ref: "Score" },
    dimensions: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: { $ref: "ResumeHealthDimension" },
    },
  },
};

const CareerReadiness = {
  $id: "CareerReadiness",
  type: "object",
  additionalProperties: false,
  required: ["score", "strengths", "weaknesses", "nextActions", "scoreBreakdown"],
  properties: {
    score: { $ref: "Score" },
    strengths: { type: "array", minItems: 0, maxItems: 10, items: { type: "string", minLength: 1, maxLength: 200 } },
    weaknesses: { type: "array", minItems: 0, maxItems: 10, items: { type: "string", minLength: 1, maxLength: 200 } },
    nextActions: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", minLength: 1, maxLength: 200 } },
    scoreBreakdown: {
      type: "object",
      additionalProperties: false,
      required: ["technicalSkills", "projects", "experience", "resumeHealth", "roleAlignment"],
      properties: {
        technicalSkills: { type: "integer", minimum: 0, maximum: 35 },
        projects: { type: "integer", minimum: 0, maximum: 25 },
        experience: { type: "integer", minimum: 0, maximum: 20 },
        resumeHealth: { type: "integer", minimum: 0, maximum: 10 },
        roleAlignment: { type: "integer", minimum: 0, maximum: 10 },
      },
    },
  },
};

const RoadmapMilestone = {
  $id: "RoadmapMilestone",
  type: "object",
  additionalProperties: false,
  required: ["phase", "skill", "gapAddressed", "project", "resource"],
  properties: {
    phase: { type: "string", minLength: 1, maxLength: 20 },
    skill: { type: "string", minLength: 1, maxLength: 60 },
    gapAddressed: { type: "string", minLength: 1, maxLength: 60 },
    project: { type: "string", minLength: 1, maxLength: 200 },
    resource: { type: "string", minLength: 1, maxLength: 200 },
  },
};

const Roadmap = {
  $id: "Roadmap",
  type: "array",
  maxItems: 6,
  items: { $ref: "RoadmapMilestone" },
};

const MentorMessage = {
  $id: "MentorMessage",
  type: "object",
  additionalProperties: false,
  required: ["role", "text"],
  properties: {
    role: { type: "string", enum: ["user", "mentor"] },
    text: { type: "string", minLength: 1, maxLength: 2000 },
  },
};

// ---------------------------------------------------------------------------
// Top-level schemas
// ---------------------------------------------------------------------------

const StructuredResume = {
  $id: "StructuredResume",
  type: "object",
  additionalProperties: false,
  required: ["skills", "projects", "experience", "education"],
  properties: {
    skills: {
      type: "array",
      minItems: 1,
      maxItems: 100,
      items: { type: "string", minLength: 1, maxLength: 60 },
    },
    projects: { type: "array", items: { $ref: "Project" }, maxItems: 30 },
    experience: { type: "array", items: { $ref: "Experience" }, maxItems: 30 },
    education: { type: "array", items: { $ref: "Education" }, maxItems: 20 },
    rawTextLength: { type: "integer", minimum: 0 },
  },
};

const AnalysisResult = {
  $id: "AnalysisResult",
  type: "object",
  additionalProperties: false,
  required: ["targetRole", "matchObject", "resumeHealth", "readiness", "roadmap"],
  properties: {
    targetRole: { $ref: "RoleName" },
    matchObject: { $ref: "MatchObject" },
    resumeHealth: { $ref: "ResumeHealthReport" },
    readiness: { $ref: "CareerReadiness" },
    roadmap: { $ref: "Roadmap" },
  },
};

const MentorResponse = {
  $id: "MentorResponse",
  type: "object",
  additionalProperties: false,
  required: ["answer", "usedGrounding", "suggestedFollowups"],
  properties: {
    answer: { type: "string", minLength: 1, maxLength: 4000 },
    usedGrounding: { type: "boolean" },
    suggestedFollowups: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: { type: "string", minLength: 1, maxLength: 120 },
    },
  },
};

// ---------------------------------------------------------------------------
// Ajv setup — register every $id BEFORE compiling top-level schemas.
// ---------------------------------------------------------------------------

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

// Order matters only in that all referenced schemas must be added before the
// referencing schema is compiled. addSchema does not compile eagerly, so we add
// every schema first, then compile the top-level validators.
const SUB_SCHEMAS = [
  RoleName,
  HealthDimensionKey,
  Score,
  RawResumeText,
  Project,
  Experience,
  Education,
  MatchObject,
  ResumeHealthDimension,
  ResumeHealthReport,
  CareerReadiness,
  RoadmapMilestone,
  Roadmap,
  MentorMessage,
];

for (const schema of SUB_SCHEMAS) {
  ajv.addSchema(schema, schema.$id);
}

export type SchemaName = "StructuredResume" | "AnalysisResult" | "MentorResponse";

const COMPILED: Record<SchemaName, ValidateFunction> = {
  StructuredResume: ajv.compile(StructuredResume),
  AnalysisResult: ajv.compile(AnalysisResult),
  MentorResponse: ajv.compile(MentorResponse),
};

export interface ValidationResult {
  valid: boolean;
  errors: ApiErrorDetail[];
}

function toDetails(errors: ErrorObject[] | null | undefined): ApiErrorDetail[] {
  if (!errors) return [];
  return errors.map((e) => {
    const path = e.instancePath ? e.instancePath.replace(/^\//, "").replace(/\//g, ".") : "";
    const field = path || (e.params && (e.params as { missingProperty?: string }).missingProperty) || "(root)";
    return { field: String(field).slice(0, 120), issue: String(e.message || "is invalid").slice(0, 200) };
  });
}

/** Validate `data` against a registered top-level schema. */
export function validate<T = unknown>(schemaName: SchemaName, data: unknown): ValidationResult {
  const fn = COMPILED[schemaName];
  if (!fn) {
    return { valid: false, errors: [{ field: "(schema)", issue: `Unknown schema: ${schemaName}` }] };
  }
  const valid = fn(data) as boolean;
  return { valid, errors: valid ? [] : toDetails(fn.errors) };
}

export default validate;
