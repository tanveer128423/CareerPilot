import { describe, it, expect } from "vitest";
import { scoreBand, bandColor, readinessLabel, formatPlainSummary, buildGrounding } from "./format";
import type { AnalysisResult } from "../types";

const analysis: AnalysisResult = {
  targetRole: "Backend Developer",
  matchObject: {
    role: "Backend Developer",
    requiredSkills: ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
    niceToHaveSkills: ["SQL"],
    have: ["JavaScript", "Git"],
    missing: ["Node.js", "Express.js", "REST APIs", "MongoDB"],
    matchedNiceToHave: [],
    coveragePercentage: 33,
  },
  resumeHealth: {
    overall: 58,
    dimensions: [
      { key: "formatting", label: "Formatting Quality", score: 80, reason: "ok", tip: "tip" },
      { key: "impactMetrics", label: "Impact Metrics", score: 40, reason: "ok", tip: "tip" },
      { key: "skillsCoverage", label: "Skills Coverage", score: 33, reason: "ok", tip: "tip" },
      { key: "keywordCoverage", label: "Keyword Coverage", score: 50, reason: "ok", tip: "tip" },
      { key: "projectQuality", label: "Project Quality", score: 30, reason: "ok", tip: "tip" },
    ],
  },
  readiness: {
    score: 33,
    strengths: ["Knows JavaScript"],
    weaknesses: ["Missing 4 required skills"],
    nextActions: ["Build a Node.js API to close the Node.js gap."],
    scoreBreakdown: { technicalSkills: 12, projects: 0, experience: 0, resumeHealth: 6, roleAlignment: 15 },
  },
  roadmap: [
    { phase: "Week 1-4", skill: "Node.js", gapAddressed: "Node.js", project: "Build an API", resource: "Node docs" },
  ],
};

describe("scoreBand", () => {
  it("maps 0-49 -> danger, 50-79 -> warning, 80-100 -> success", () => {
    expect(scoreBand(0)).toBe("danger");
    expect(scoreBand(49)).toBe("danger");
    expect(scoreBand(50)).toBe("warning");
    expect(scoreBand(79)).toBe("warning");
    expect(scoreBand(80)).toBe("success");
    expect(scoreBand(100)).toBe("success");
  });
});

describe("bandColor", () => {
  it("returns a hex per band", () => {
    expect(bandColor("danger")).toMatch(/^#/);
    expect(bandColor("success")).toMatch(/^#/);
  });
});

describe("readinessLabel", () => {
  it("labels by threshold", () => {
    expect(readinessLabel(20)).toBe("Early");
    expect(readinessLabel(65)).toBe("On track");
    expect(readinessLabel(90)).toBe("Interview-ready");
  });
});

describe("buildGrounding", () => {
  it("includes ONLY deterministic inputs the client holds", () => {
    const g = buildGrounding(analysis, { skills: ["JavaScript"], projects: [], experience: [], education: [] }, "raw text");
    expect(Object.keys(g).sort()).toEqual(
      ["matchObject", "rawResumeText", "structuredResume", "targetRole"].sort(),
    );
    // Must NOT leak internal analysis shapes.
    const rec = g as unknown as Record<string, unknown>;
    expect(rec.resumeHealth).toBeUndefined();
    expect(rec.readiness).toBeUndefined();
    expect(rec.roadmap).toBeUndefined();
    expect(g.matchObject).toEqual(analysis.matchObject);
  });
});

describe("formatPlainSummary", () => {
  it("produces a plain-text summary with the key numbers", () => {
    const text = formatPlainSummary(analysis);
    expect(text).toContain("Backend Developer");
    expect(text).toContain("33"); // readiness score
    expect(text).toContain("Node.js"); // a missing skill
    expect(text).toContain("Week 1-4"); // roadmap phase
    expect(typeof text).toBe("string");
  });
});
