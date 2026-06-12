/**
 * Priority tests for the deterministic roadmap generator (roadmapService).
 *
 * Locks the gap-driven invariants: every milestone closes a skill in
 * matchObject.missing, the 24-week / 4-week phase layout, the ≤6 milestone cap,
 * and the empty roadmap when there are no gaps.
 */
import { describe, it, expect } from "vitest";
import generateRoadmap from "../src/services/roadmapService.js";
import type { MatchObject } from "../src/services/matchService.js";

/** Minimal MatchObject with a given `missing` set (generateRoadmap only reads .missing). */
function matchWith(missing: string[]): MatchObject {
  return {
    role: "Backend Developer",
    requiredSkills: missing,
    niceToHaveSkills: [],
    have: [],
    missing,
    matchedNiceToHave: [],
    coveragePercentage: 0,
  };
}

describe("generateRoadmap", () => {
  it("creates one milestone per missing skill with sequential 4-week phases", () => {
    const roadmap = generateRoadmap({
      matchObject: matchWith(["MongoDB", "Authentication", "Unit Testing"]),
    });
    expect(roadmap).toHaveLength(3);
    expect(roadmap.map((m) => m.phase)).toEqual(["Week 1-4", "Week 5-8", "Week 9-12"]);
  });

  it("every milestone.gapAddressed is in matchObject.missing", () => {
    const missing = ["MongoDB", "Authentication", "Unit Testing"];
    const roadmap = generateRoadmap({ matchObject: matchWith(missing) });
    for (const m of roadmap) {
      expect(missing).toContain(m.gapAddressed);
      expect(m.gapAddressed).toBe(m.skill); // gapAddressed always === skill
    }
  });

  it("each milestone has a concrete project and a named resource", () => {
    const roadmap = generateRoadmap({ matchObject: matchWith(["MongoDB"]) });
    expect(roadmap[0].project.length).toBeGreaterThan(0);
    expect(roadmap[0].resource.length).toBeGreaterThan(0);
  });

  it("no missing skills => empty roadmap", () => {
    expect(generateRoadmap({ matchObject: matchWith([]) })).toEqual([]);
  });

  it("more than 6 missing => exactly 6 milestones, last phase Week 21-24", () => {
    const eight = [
      "HTML", "CSS", "JavaScript", "Node.js", "Express.js", "MongoDB", "SQL", "Docker",
    ];
    const roadmap = generateRoadmap({ matchObject: matchWith(eight) });
    expect(roadmap).toHaveLength(6);
    expect(roadmap[5].phase).toBe("Week 21-24");
  });

  it("is deterministic — same input, same output", () => {
    const a = generateRoadmap({ matchObject: matchWith(["MongoDB", "Git"]) });
    const b = generateRoadmap({ matchObject: matchWith(["MongoDB", "Git"]) });
    expect(a).toEqual(b);
  });
});
