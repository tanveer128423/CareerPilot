/**
 * Tests for mentorService.answerMentor — TDD (written before implementation).
 *
 * The Gemini transport is mocked so these tests verify OUR logic: server-side
 * reconstruction of the grounded prompt, JSON parse + MentorResponse validation,
 * a single repair/retry, and the AI_BAD_JSON failure path. NON-STREAMING.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  replies: [] as string[], // consumed in order, one per callGemini call
  calls: 0,
  lastSystem: "" as string,
  lastApiKey: undefined as string | undefined,
}));

vi.mock("./geminiClient.js", () => ({
  callGemini: vi.fn(async (args: { system?: string; apiKey?: string }) => {
    mocks.lastSystem = args.system ?? "";
    mocks.lastApiKey = args.apiKey;
    const reply = mocks.replies[mocks.calls] ?? mocks.replies[mocks.replies.length - 1] ?? "";
    mocks.calls += 1;
    return reply;
  }),
}));

import { answerMentor } from "./mentorService.js";

const grounding = {
  targetRole: "Backend Developer",
  structuredResume: { skills: ["JavaScript", "Git"], projects: [], experience: [], education: [] },
  matchObject: {
    role: "Backend Developer",
    requiredSkills: ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
    niceToHaveSkills: ["SQL", "Authentication", "TypeScript", "Unit Testing", "Docker", "Error Handling"],
    have: ["JavaScript", "Git"],
    missing: ["Node.js", "Express.js", "REST APIs", "MongoDB"],
    matchedNiceToHave: [],
    coveragePercentage: 33,
  },
  rawResumeText: "BILAL\nAspiring Backend Developer\nSkills: JavaScript, Git",
};

const validReply = JSON.stringify({
  answer: "Your highest-priority gap is Node.js. Start with the Week 1-4 roadmap milestone.",
  usedGrounding: true,
  suggestedFollowups: ["What project should I build?", "How long until I'm ready?"],
});

beforeEach(() => {
  mocks.replies = [validReply];
  mocks.calls = 0;
  mocks.lastSystem = "";
});

describe("answerMentor", () => {
  it("returns a valid MentorResponse from valid Gemini JSON", async () => {
    const out = await answerMentor({ question: "What should I learn next?", history: [], grounding });
    expect(out.answer).toContain("Node.js");
    expect(out.usedGrounding).toBe(true);
    expect(out.suggestedFollowups.length).toBeLessThanOrEqual(3);
  });

  it("reconstructs grounding server-side: system prompt carries the deterministic facts", async () => {
    await answerMentor({ question: "Am I ready?", history: [], grounding });
    expect(mocks.lastSystem).toContain("MISSING");
    expect(mocks.lastSystem).toContain("MongoDB");
    expect(mocks.lastSystem).toContain("Week 1-4"); // reconstructed roadmap
  });

  it("clamps suggestedFollowups to at most 3", async () => {
    mocks.replies = [
      JSON.stringify({
        answer: "Grounded answer about MongoDB gap.",
        usedGrounding: true,
        suggestedFollowups: ["a", "b", "c", "d", "e"],
      }),
    ];
    const out = await answerMentor({ question: "x", history: [], grounding });
    expect(out.suggestedFollowups.length).toBeLessThanOrEqual(3);
  });

  it("repairs/retries once when the first reply is unparseable, then succeeds", async () => {
    mocks.replies = ["Sorry, I cannot do that.", validReply];
    const out = await answerMentor({ question: "x", history: [], grounding });
    expect(out.answer).toContain("Node.js");
    expect(mocks.calls).toBe(2); // one retry happened
  });

  it("throws AI_BAD_JSON when both attempts are unparseable", async () => {
    mocks.replies = ["not json", "still not json"];
    await expect(answerMentor({ question: "x", history: [], grounding })).rejects.toMatchObject({
      code: "AI_BAD_JSON",
      status: 502,
      retryable: true,
    });
  });

  it("forwards a per-request apiKey to callGemini", async () => {
    await answerMentor({ question: "x", history: [], grounding, apiKey: "user-key-123" });
    expect(mocks.lastApiKey).toBe("user-key-123");
  });

  it("truncates history to CONFIG.MAX_HISTORY without throwing", async () => {
    const history = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "mentor",
      text: `turn ${i}`,
    })) as Array<{ role: "user" | "mentor"; text: string }>;
    const out = await answerMentor({ question: "What next?", history, grounding });
    expect(out.answer.length).toBeGreaterThan(0);
  });
});
