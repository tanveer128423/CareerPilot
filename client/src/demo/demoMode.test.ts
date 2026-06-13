import { describe, it, expect } from "vitest";
import {
  DEMO_MODE,
  DEMO_RESUME_IDS,
  buildDemoSeed,
  getDemoAnalysis,
  getDemoMentorAnswer,
  pickDemoResumeId,
} from "./demoMode";
import type { AnalysisResult } from "../types";

/** Every required AnalysisResult key must be present and well-typed. */
function expectValidAnalysis(a: AnalysisResult) {
  expect(a.targetRole).toBeTypeOf("string");
  expect(a.matchObject).toBeTruthy();
  expect(Array.isArray(a.matchObject.have)).toBe(true);
  expect(Array.isArray(a.matchObject.missing)).toBe(true);
  expect(a.resumeHealth.dimensions).toHaveLength(5);
  expect(a.readiness.scoreBreakdown).toBeTruthy();
  expect(Array.isArray(a.roadmap)).toBe(true);
}

describe("DEMO_MODE flag", () => {
  it("is a boolean derived from the build env", () => {
    expect(typeof DEMO_MODE).toBe("boolean");
  });
  it("exposes the two demo resume ids", () => {
    expect(DEMO_RESUME_IDS).toEqual(["bilal-backend", "aisha-backend"]);
  });
});

describe("getDemoAnalysis", () => {
  it("returns Bilal: 40/100, backend gaps, 4-milestone roadmap", () => {
    const a = getDemoAnalysis("bilal-backend");
    expectValidAnalysis(a);
    expect(a.targetRole).toBe("Backend Developer");
    expect(a.readiness.score).toBe(40);
    expect(a.matchObject.missing).toEqual(["Node.js", "Express.js", "REST APIs", "MongoDB"]);
    expect(a.matchObject.have).toEqual(["JavaScript", "Git"]);
    expect(a.matchObject.coveragePercentage).toBe(33);
    expect(a.roadmap).toHaveLength(4);
    expect(a.roadmap[0].skill).toBe("Node.js");
    expect(a.roadmap[0].phase).toBe("Week 1-4");
  });

  it("returns Aisha: 87/100, all six skills, no roadmap", () => {
    const a = getDemoAnalysis("aisha-backend");
    expectValidAnalysis(a);
    expect(a.targetRole).toBe("Backend Developer");
    expect(a.readiness.score).toBe(87);
    expect(a.matchObject.missing).toEqual([]);
    expect(a.matchObject.have).toHaveLength(6);
    expect(a.matchObject.coveragePercentage).toBe(100);
    expect(a.roadmap).toHaveLength(0);
  });

  it("returns an independent deep copy each call (no shared mutation)", () => {
    const a = getDemoAnalysis("bilal-backend");
    a.readiness.score = 1;
    a.matchObject.missing.push("Hacked");
    const b = getDemoAnalysis("bilal-backend");
    expect(b.readiness.score).toBe(40);
    expect(b.matchObject.missing).not.toContain("Hacked");
  });
});

describe("getDemoMentorAnswer", () => {
  it("matches the headline 6-month question and cites the real plan", () => {
    const r = getDemoMentorAnswer("Can I become a backend developer in 6 months?");
    expect(r).not.toBeNull();
    expect(r!.usedGrounding).toBe(true);
    expect(r!.answer).toContain("Node.js");
    expect(Array.isArray(r!.suggestedFollowups)).toBe(true);
  });

  it("is fuzzy: ignores case, punctuation and surrounding whitespace", () => {
    const a = getDemoMentorAnswer("Why is my readiness score low?");
    const b = getDemoMentorAnswer("  why is my READINESS score low  ");
    expect(b).not.toBeNull();
    expect(b!.answer).toBe(a!.answer);
    expect(b!.answer).toContain("40");
  });

  it("refuses off-plan skills (anti-hallucination demo moment)", () => {
    const r = getDemoMentorAnswer("should i learn kubernetes");
    expect(r).not.toBeNull();
    expect(r!.answer.toLowerCase()).toContain("kubernetes");
    expect(r!.answer.toLowerCase()).toMatch(/won['’]?t|not recommend|isn['’]?t in/);
  });

  it("never blanks out: unknown questions get a sensible grounded default", () => {
    const r = getDemoMentorAnswer("what is the weather on mars");
    expect(r).not.toBeNull();
    expect(r!.answer.length).toBeGreaterThan(0);
    expect(r!.suggestedFollowups.length).toBeGreaterThan(0);
  });

  it("returns null only for an empty question", () => {
    expect(getDemoMentorAnswer("   ")).toBeNull();
  });
});

describe("buildDemoSeed", () => {
  it("returns analysis + a structuredResume the mentor can ground on", () => {
    const seed = buildDemoSeed("bilal-backend");
    expect(seed.analysis.readiness.score).toBe(40);
    // structuredResume.skills must be non-empty so useMentorChat's guard passes.
    expect(seed.structuredResume.skills.length).toBeGreaterThan(0);
    expect(seed.structuredResume.skills).toContain("JavaScript");
    expect(typeof seed.rawResumeText).toBe("string");
  });
});

describe("pickDemoResumeId", () => {
  it("routes an Aisha file to the strong sample", () => {
    expect(pickDemoResumeId({ fileName: "Aisha_Khan_Resume.pdf" })).toBe("aisha-backend");
  });
  it("defaults to Bilal (the lead contrast demo)", () => {
    expect(pickDemoResumeId({ fileName: "bilal.pdf" })).toBe("bilal-backend");
    expect(pickDemoResumeId({})).toBe("bilal-backend");
  });
});
