/**
 * Integration tests for POST /api/mentor — TDD (written before implementation).
 *
 * Exercises validation + the full grounded path through the real Express app,
 * with the Gemini transport mocked. NON-STREAMING: one validated JSON object.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({ reply: "" }));

vi.mock("../services/geminiClient.js", () => ({
  callGemini: vi.fn(async () => mocks.reply),
}));

import app from "../server.js";

const grounding = {
  targetRole: "Backend Developer",
  structuredResume: { skills: ["JavaScript", "Git"], projects: [], experience: [], education: [] },
  matchObject: {
    role: "Backend Developer",
    requiredSkills: ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
    niceToHaveSkills: [],
    have: ["JavaScript", "Git"],
    missing: ["Node.js", "Express.js", "REST APIs", "MongoDB"],
    matchedNiceToHave: [],
    coveragePercentage: 33,
  },
  rawResumeText: "BILAL\nAspiring Backend Developer",
};

function mentor(body: Record<string, unknown>) {
  return request(app).post("/api/mentor").send(body);
}

beforeEach(() => {
  mocks.reply = JSON.stringify({
    answer: "Start with Node.js — it's your top missing skill (Week 1-4 of your roadmap).",
    usedGrounding: true,
    suggestedFollowups: ["What project should I build?"],
  });
});

describe("POST /api/mentor", () => {
  it("200 — returns a validated MentorResponse", async () => {
    const res = await mentor({ question: "What should I learn next?", history: [], grounding });
    expect(res.status).toBe(200);
    expect(typeof res.body.answer).toBe("string");
    expect(res.body.answer.length).toBeGreaterThan(0);
    expect(typeof res.body.usedGrounding).toBe("boolean");
    expect(Array.isArray(res.body.suggestedFollowups)).toBe(true);
    expect(res.body.suggestedFollowups.length).toBeLessThanOrEqual(3);
  });

  it("works without history (defaults to [])", async () => {
    const res = await mentor({ question: "Am I ready?", grounding });
    expect(res.status).toBe(200);
  });

  it("400 VALIDATION_ERROR — empty question", async () => {
    const res = await mentor({ question: "", history: [], grounding });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR — question over the max length", async () => {
    const res = await mentor({ question: "x".repeat(501), history: [], grounding });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR — missing grounding", async () => {
    const res = await mentor({ question: "What next?" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 INVALID_ROLE — grounding.targetRole not in enum", async () => {
    const res = await mentor({
      question: "What next?",
      grounding: { ...grounding, targetRole: "Astronaut", matchObject: { ...grounding.matchObject, role: "Astronaut" } },
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ROLE");
  });

  it("400 VALIDATION_ERROR — grounding.structuredResume.skills empty", async () => {
    const res = await mentor({
      question: "What next?",
      grounding: { ...grounding, structuredResume: { skills: [], projects: [], experience: [], education: [] } },
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR — bad history shape", async () => {
    const res = await mentor({ question: "What next?", history: [{ role: "robot", text: "hi" }], grounding });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
