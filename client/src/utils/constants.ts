import type { RoleName } from "../types";

export const SUPPORTED_ROLES: RoleName[] = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Software Engineer Intern",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Mobile App Developer",
  "Product Manager",
];

/** True when a role name is NOT one of the built-in supported roles, i.e. it
 * was parsed from a pasted job posting. */
export function isCustomRoleName(role: string): boolean {
  return !(SUPPORTED_ROLES as string[]).includes(role);
}

/** Seed chips for the mentor (PRD examples) — also double as the demo script. */
export const SUGGESTED_QUESTIONS: string[] = [
  "Am I ready for internships?",
  "What should I learn next?",
  "What project should I build next?",
  "How long until I'm ready?",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const QUESTION_MAX = 500;
export const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ACCEPTED_EXT = ".pdf,.docx";
