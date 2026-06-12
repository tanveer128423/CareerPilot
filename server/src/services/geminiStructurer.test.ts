/**
 * Tests for geminiStructurer — TDD (written before implementation).
 *
 * The Gemini transport (callGemini) is mocked so these tests verify OUR logic:
 * prompt construction, JSON parsing via jsonGuard (including fenced output),
 * and the AI_BAD_JSON failure path.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  reply: "",
  throwErr: null as Error | null,
  lastArgs: null as any,
}));

vi.mock("./geminiClient.js", () => ({
  callGemini: vi.fn(async (args: any) => {
    mocks.lastArgs = args;
    if (mocks.throwErr) throw mocks.throwErr;
    return mocks.reply;
  }),
}));

import { geminiStructurer } from "./geminiStructurer.js";

beforeEach(() => {
  mocks.reply = "";
  mocks.throwErr = null;
  mocks.lastArgs = null;
});

const validJson = JSON.stringify({
  skills: ["Node.js", "Express.js"],
  projects: [{ name: "API", tech: ["Node.js"], summary: "A REST API." }],
  experience: [],
  education: [],
});

describe("geminiStructurer.structure", () => {
  it("returns the parsed structured object on valid JSON", async () => {
    mocks.reply = validJson;
    const out = await geminiStructurer.structure("raw resume text here");
    expect(out.skills).toContain("Node.js");
    expect(out.projects[0].name).toBe("API");
    expect(out.experience).toEqual([]);
  });

  it("strips code fences before parsing", async () => {
    mocks.reply = "```json\n" + validJson + "\n```";
    const out = await geminiStructurer.structure("raw text");
    expect(out.skills).toContain("Express.js");
  });

  it("passes JSON mode + low temperature + the analyze timeout to callGemini", async () => {
    mocks.reply = validJson;
    await geminiStructurer.structure("raw text");
    expect(mocks.lastArgs.jsonMode).toBe(true);
    expect(mocks.lastArgs.temperature).toBeLessThanOrEqual(0.2);
    expect(mocks.lastArgs.timeoutMs).toBeGreaterThan(0);
    expect(mocks.lastArgs.prompt).toContain("raw text"); // resume text embedded
  });

  it("throws AI_BAD_JSON (502) when the model returns unparseable text", async () => {
    mocks.reply = "Sorry, I cannot do that.";
    await expect(geminiStructurer.structure("raw text")).rejects.toMatchObject({
      code: "AI_BAD_JSON",
      status: 502,
      retryable: true,
    });
  });
});
