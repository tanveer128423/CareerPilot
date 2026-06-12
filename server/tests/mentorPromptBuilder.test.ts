/**
 * Priority tests for the grounded mentor system-prompt builder.
 *
 * Verifies the anti-hallucination prompt embeds the deterministic facts the
 * mentor is allowed to use (missing skills, readiness score, roadmap phase) and
 * the strict rules — and that it never leaks a user name.
 */
import { describe, it, expect } from "vitest";
import matchService from "../src/services/matchService.js";
import analyzeResumeHealth from "../src/services/analysisService.js";
import computeReadiness from "../src/services/readinessService.js";
import generateRoadmap from "../src/services/roadmapService.js";
import buildMentorSystemPrompt from "../src/services/mentorPromptBuilder.js";
import rolesData from "../src/data/roles.json" with { type: "json" };
import type { RoleDefinition, StructuredResume } from "../src/services/resumeParser.js";

const backendRole = (rolesData as { roles: RoleDefinition[] }).roles.find(
  (r) => r.name === "Backend Developer",
)!;

// Bilal (weak backend): missing Node.js / Express.js / REST APIs / MongoDB.
const bilal: StructuredResume = {
  skills: ["JavaScript", "Git"],
  projects: [],
  experience: [],
  education: [],
  rawTextLength: 120,
};

function buildPrompt() {
  const matchObject = matchService.generateMatchObject("Backend Developer", bilal.skills);
  const resumeHealthReport = analyzeResumeHealth({
    structuredResume: bilal as never,
    matchObject,
    rawResumeText: "",
  });
  const careerReadiness = computeReadiness({
    structuredResume: bilal,
    matchObject,
    resumeHealthReport,
    selectedRole: backendRole,
  });
  const roadmap = generateRoadmap({ matchObject });
  const prompt = buildMentorSystemPrompt({
    structuredResume: bilal,
    matchObject,
    resumeHealthReport,
    careerReadiness,
    roadmap,
  });
  return { prompt, careerReadiness, matchObject };
}

describe("buildMentorSystemPrompt", () => {
  it("embeds the missing-skills block and a named missing skill", () => {
    const { prompt } = buildPrompt();
    expect(prompt).toContain("MISSING");
    expect(prompt).toContain("MongoDB");
  });

  it("embeds the deterministic readiness score", () => {
    const { prompt, careerReadiness } = buildPrompt();
    expect(prompt).toContain(`${careerReadiness.score}/100`);
  });

  it("includes the strict anti-hallucination rule", () => {
    const { prompt } = buildPrompt();
    expect(prompt).toContain("NEVER invent skills");
  });

  it("includes the first roadmap phase (Week 1-4)", () => {
    const { prompt } = buildPrompt();
    expect(prompt).toContain("Week 1-4");
  });

  it("does not address the user by name (no name leak)", () => {
    const { prompt } = buildPrompt();
    expect(prompt).toContain('never address the user by name');
    expect(prompt).not.toContain("Bilal");
  });
});
