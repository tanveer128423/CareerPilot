/**
 * Canonical shared types — mirror SCHEMAS.md / API_CONTRACTS.md field-for-field.
 * These match the implemented backend services exactly.
 */

export type RoleName =
  | "Frontend Developer"
  | "Backend Developer"
  | "Full Stack Developer"
  | "React Developer"
  | "Node.js Developer"
  | "Software Engineer Intern"
  | "Data Analyst"
  | "Machine Learning Engineer"
  | "DevOps Engineer"
  | "Mobile App Developer"
  | "Product Manager";

export interface RoleEntry {
  id: string;
  name: RoleName;
  required: string[];
  niceToHave: string[];
  keywords: string[];
}

export interface Project {
  name: string;
  tech: string[];
  summary: string;
}
export interface Experience {
  title: string;
  org: string;
  duration: string;
  summary: string;
}
export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface StructuredResume {
  skills: string[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  rawTextLength?: number;
}

export interface MatchObject {
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  have: string[];
  missing: string[];
  matchedNiceToHave: string[];
  coveragePercentage: number;
}

export type HealthDimensionKey =
  | "formatting"
  | "impactMetrics"
  | "skillsCoverage"
  | "keywordCoverage"
  | "projectQuality";

export interface ResumeHealthDimension {
  key: HealthDimensionKey;
  label: string;
  score: number;
  reason: string;
  tip: string;
}
export interface ResumeHealthReport {
  overall: number;
  dimensions: ResumeHealthDimension[];
}

export interface ScoreBreakdown {
  technicalSkills: number;
  projects: number;
  experience: number;
  resumeHealth: number;
  roleAlignment: number;
}
export interface CareerReadiness {
  score: number;
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  scoreBreakdown: ScoreBreakdown;
}

export interface RoadmapMilestone {
  phase: string;
  skill: string;
  gapAddressed: string;
  project: string;
  resource: string;
}
export type Roadmap = RoadmapMilestone[];

export interface AnalysisResult {
  /** A supported role name, OR a custom name parsed from a job posting. */
  targetRole: RoleName | string;
  matchObject: MatchObject;
  resumeHealth: ResumeHealthReport;
  readiness: CareerReadiness;
  roadmap: Roadmap;
}

/** A role definition extracted from a pasted job posting. */
export interface CustomRole {
  id: string;
  name: string;
  required: string[];
  niceToHave: string[];
  keywords: string[];
}

/** Response from POST /api/extract-role. */
export interface ExtractRoleResponse {
  role: CustomRole;
  title: string;
  company: string;
}

export interface ParseResponse {
  targetRole: RoleName;
  structuredResume: StructuredResume;
  rawResumeText: string;
}

export type MentorRole = "user" | "mentor";
export interface MentorMessage {
  role: MentorRole;
  text: string;
}
export interface MentorResponse {
  answer: string;
  usedGrounding: boolean;
  suggestedFollowups: string[];
}

/** Deterministic grounding the client sends to /api/mentor. */
export interface MentorGrounding {
  targetRole: RoleName | string;
  structuredResume: StructuredResume;
  matchObject: MatchObject;
  rawResumeText: string;
  /** True when the role was parsed from a job posting (custom, not in roles.json). */
  fromJobPosting?: boolean;
}

export interface ApiErrorDetail {
  field: string;
  issue: string;
}
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details: ApiErrorDetail[] | null;
  };
}

export type ScoreBand = "danger" | "warning" | "success";
export type AppStatus = "idle" | "parsing" | "analyzing" | "ready" | "error";
