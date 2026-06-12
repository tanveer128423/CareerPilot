/**
 * Priority tests for the deterministic Career Readiness engine (readinessService).
 *
 * Locks the FIX_PACK scoring invariants: the weighted breakdown sums exactly to
 * the score, skill coverage is counted ONCE (no skillGaps term), every next
 * action is evidence-based (references a gap), and empty resumes never crash.
 */
import { describe, it, expect } from "vitest";
import matchService from "../src/services/matchService.js";
import analyzeResumeHealth from "../src/services/analysisService.js";
import computeReadiness from "../src/services/readinessService.js";
import rolesData from "../src/data/roles.json" with { type: "json" };
import type { RoleDefinition, StructuredResume } from "../src/services/resumeParser.js";

const BACKEND = "Backend Developer";
const backendRole = (rolesData as { roles: RoleDefinition[] }).roles.find(
  (r) => r.name === BACKEND,
)!;

function buildInput(resume: StructuredResume, rawText = "") {
  const matchObject = matchService.generateMatchObject(BACKEND, resume.skills);
  const resumeHealthReport = analyzeResumeHealth({
    structuredResume: resume as never,
    matchObject,
    rawResumeText: rawText,
  });
  return { structuredResume: resume, matchObject, resumeHealthReport, selectedRole: backendRole };
}

const PARTIAL_RESUME: StructuredResume = {
  skills: ["JavaScript", "Node.js", "Express.js", "Git"], // missing REST APIs, MongoDB
  projects: [{ name: "Todo App", tech: ["JavaScript"], summary: "A small todo app." }],
  experience: [],
  education: [],
  rawTextLength: 200,
};

const EMPTY_RESUME: StructuredResume = {
  skills: ["JavaScript"],
  projects: [],
  experience: [],
  education: [],
  rawTextLength: 20,
};

describe("computeReadiness", () => {
  it("scoreBreakdown sums EXACTLY to score", () => {
    const r = computeReadiness(buildInput(PARTIAL_RESUME));
    const sum =
      r.scoreBreakdown.technicalSkills +
      r.scoreBreakdown.projects +
      r.scoreBreakdown.experience +
      r.scoreBreakdown.resumeHealth +
      r.scoreBreakdown.roleAlignment;
    expect(sum).toBe(r.score);
  });

  it("has no skillGaps term (coverage counted once, in technicalSkills)", () => {
    const r = computeReadiness(buildInput(PARTIAL_RESUME));
    expect(Object.keys(r.scoreBreakdown).sort()).toEqual(
      ["experience", "projects", "resumeHealth", "roleAlignment", "technicalSkills"].sort(),
    );
    expect((r.scoreBreakdown as Record<string, unknown>).skillGaps).toBeUndefined();
  });

  it("scoreBreakdown components stay within their weighted caps", () => {
    const r = computeReadiness(buildInput(PARTIAL_RESUME));
    expect(r.scoreBreakdown.technicalSkills).toBeLessThanOrEqual(35);
    expect(r.scoreBreakdown.projects).toBeLessThanOrEqual(25);
    expect(r.scoreBreakdown.experience).toBeLessThanOrEqual(20);
    expect(r.scoreBreakdown.resumeHealth).toBeLessThanOrEqual(10);
    expect(r.scoreBreakdown.roleAlignment).toBeLessThanOrEqual(10);
  });

  it("nextActions are non-empty and each references a gap (skill/project/experience/metric)", () => {
    const r = computeReadiness(buildInput(PARTIAL_RESUME));
    expect(r.nextActions.length).toBeGreaterThanOrEqual(1);
    const missing = ["REST APIs", "MongoDB"]; // PARTIAL_RESUME's missing required skills
    for (const action of r.nextActions) {
      const referencesSkill = missing.some((s) => action.includes(s));
      const referencesArea = /experience|project|metric|quantify|internship|interview|apply/i.test(action);
      expect(referencesSkill || referencesArea).toBe(true);
    }
  });

  it("empty resume yields a low score (0..20) without throwing", () => {
    const r = computeReadiness(buildInput(EMPTY_RESUME));
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(20);
    expect(Array.isArray(r.nextActions)).toBe(true);
  });

  it("is deterministic — same input, same output", () => {
    const a = computeReadiness(buildInput(PARTIAL_RESUME));
    const b = computeReadiness(buildInput(PARTIAL_RESUME));
    expect(a).toEqual(b);
  });
});
