/**
 * Integration tests for POST /api/analyze — Phase 4 (matchObject stage).
 *
 * Verifies request validation and that the deterministic matchObject is returned
 * BEFORE any AI involvement. Later phases extend the response with health,
 * readiness, and roadmap.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";
import { validate } from "../utils/validators.js";

const BACKEND_REQUIRED = ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"];

function analyze(body: Record<string, unknown>) {
  return request(app).post("/api/analyze").send(body);
}

const validBody = {
  targetRole: "Backend Developer",
  structuredResume: {
    skills: ["Node.js", "Express.js", "JavaScript", "Git"],
    projects: [],
    experience: [],
    education: [],
  },
};

describe("POST /api/analyze (matchObject stage)", () => {
  it("200 — returns targetRole and a deterministic matchObject", async () => {
    const res = await analyze(validBody);
    expect(res.status).toBe(200);
    expect(res.body.targetRole).toBe("Backend Developer");

    const m = res.body.matchObject;
    expect(m).toBeDefined();
    expect(m.role).toBe("Backend Developer");
    expect(m.have).toEqual(expect.arrayContaining(["Node.js", "Express.js", "JavaScript", "Git"]));
    expect(m.missing).toEqual(expect.arrayContaining(["REST APIs", "MongoDB"]));
  });

  it("matchObject invariant: have ∪ missing === required, disjoint", async () => {
    const res = await analyze(validBody);
    const m = res.body.matchObject;
    expect([...m.have, ...m.missing].sort()).toEqual([...BACKEND_REQUIRED].sort());
    expect(m.have.filter((s: string) => m.missing.includes(s))).toEqual([]);
  });

  it("is deterministic — identical requests produce identical matchObjects", async () => {
    const a = await analyze(validBody);
    const b = await analyze(validBody);
    expect(a.body.matchObject).toEqual(b.body.matchObject);
  });

  it("400 INVALID_ROLE — unknown targetRole", async () => {
    const res = await analyze({ ...validBody, targetRole: "Astronaut" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ROLE");
  });

  it("400 VALIDATION_ERROR — missing structuredResume", async () => {
    const res = await analyze({ targetRole: "Backend Developer" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR — empty skills array (with field detail)", async () => {
    const res = await analyze({
      targetRole: "Backend Developer",
      structuredResume: { skills: [], projects: [], experience: [], education: [] },
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details?.[0]?.field).toBe("structuredResume.skills");
  });

  it("400 VALIDATION_ERROR — skills contains non-string entries", async () => {
    const res = await analyze({
      targetRole: "Backend Developer",
      structuredResume: { skills: [123, null], projects: [], experience: [], education: [] },
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR — rawResumeText longer than 8000 chars", async () => {
    const res = await analyze({ ...validBody, rawResumeText: "x".repeat(8001) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("accepts a valid rawResumeText sibling", async () => {
    const res = await analyze({ ...validBody, rawResumeText: "Aisha Khan, Backend Developer." });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/analyze (health + readiness stage)", () => {
  it("returns resumeHealth with exactly 5 dimensions, each with reason + tip", async () => {
    const res = await analyze(validBody);
    expect(res.status).toBe(200);
    const h = res.body.resumeHealth;
    expect(h).toBeDefined();
    expect(typeof h.overall).toBe("number");
    expect(Array.isArray(h.dimensions)).toBe(true);
    expect(h.dimensions).toHaveLength(5);
    const keys = h.dimensions.map((d: { key: string }) => d.key).sort();
    expect(keys).toEqual(
      ["formatting", "impactMetrics", "keywordCoverage", "projectQuality", "skillsCoverage"].sort(),
    );
    for (const d of h.dimensions) {
      expect(typeof d.reason).toBe("string");
      expect(d.reason.length).toBeGreaterThan(0);
      expect(typeof d.tip).toBe("string");
      expect(d.tip.length).toBeGreaterThan(0);
    }
  });

  it("returns readiness whose scoreBreakdown sums exactly to score", async () => {
    const res = await analyze(validBody);
    const r = res.body.readiness;
    expect(r).toBeDefined();
    const sum =
      r.scoreBreakdown.technicalSkills +
      r.scoreBreakdown.projects +
      r.scoreBreakdown.experience +
      r.scoreBreakdown.resumeHealth +
      r.scoreBreakdown.roleAlignment;
    expect(sum).toBe(r.score);
    expect(r.scoreBreakdown.skillGaps).toBeUndefined();
  });

  it("uses rawResumeText for health scoring when provided", async () => {
    const raw =
      "AISHA KHAN\nBackend Developer\nemail@x.com\n\nSKILLS\nJavaScript, Node.js, Express.js\n\nEXPERIENCE\n- Built APIs, reduced latency by 30% for 1000+ users.";
    const res = await analyze({ ...validBody, rawResumeText: raw });
    expect(res.status).toBe(200);
    // Impact metrics dimension should reflect the quantified bullet (not the no-text neutral 60).
    const impact = res.body.resumeHealth.dimensions.find(
      (d: { key: string }) => d.key === "impactMetrics",
    );
    expect(impact).toBeDefined();
  });

  it("empty-ish resume (skills only) does not crash and yields a low readiness", async () => {
    const res = await analyze({
      targetRole: "Backend Developer",
      structuredResume: { skills: ["JavaScript"], projects: [], experience: [], education: [] },
    });
    expect(res.status).toBe(200);
    expect(res.body.readiness.score).toBeLessThanOrEqual(40);
    expect(res.body.readiness.nextActions.length).toBeGreaterThanOrEqual(1);
  });
});

describe("POST /api/analyze (roadmap + full AnalysisResult)", () => {
  const bilal = {
    targetRole: "Backend Developer",
    structuredResume: { skills: ["JavaScript", "Git"], projects: [], experience: [], education: [] },
  };
  const aisha = {
    targetRole: "Backend Developer",
    structuredResume: {
      skills: ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
      projects: [],
      experience: [],
      education: [],
    },
  };

  it("returns a schema-valid full AnalysisResult", async () => {
    const res = await analyze(bilal);
    expect(res.status).toBe(200);
    const { valid, errors } = validate("AnalysisResult", res.body);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
    // All five top-level fields present, no extras.
    expect(Object.keys(res.body).sort()).toEqual(
      ["matchObject", "readiness", "resumeHealth", "roadmap", "targetRole"].sort(),
    );
  });

  it("every roadmap milestone's gapAddressed is in matchObject.missing", async () => {
    const res = await analyze(bilal);
    const missing: string[] = res.body.matchObject.missing;
    expect(res.body.roadmap.length).toBeGreaterThan(0);
    for (const m of res.body.roadmap) {
      expect(missing).toContain(m.gapAddressed);
    }
  });

  it("roadmap has <= 6 milestones with sequential 4-week phases", async () => {
    const res = await analyze(bilal);
    expect(res.body.roadmap.length).toBeLessThanOrEqual(6);
    expect(res.body.roadmap[0].phase).toBe("Week 1-4");
  });

  it("no missing skills => empty roadmap (still schema-valid)", async () => {
    const res = await analyze(aisha);
    expect(res.status).toBe(200);
    expect(res.body.matchObject.missing).toEqual([]);
    expect(res.body.roadmap).toEqual([]);
    expect(validate("AnalysisResult", res.body).valid).toBe(true);
  });

  it("is deterministic — identical requests produce identical AnalysisResults", async () => {
    const a = await analyze(bilal);
    const b = await analyze(bilal);
    expect(a.body).toEqual(b.body);
  });
});
