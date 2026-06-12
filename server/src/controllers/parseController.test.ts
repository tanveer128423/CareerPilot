/**
 * Integration tests for POST /api/parse — finalized contract (Phase 3).
 *
 * Exercises the full multipart path through the real Express app (multer upload
 * + controller + deterministic parser), with the parsing libraries and the
 * Gemini transport mocked. The response is now a schema-valid
 * { targetRole, structuredResume, rawResumeText }.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  pdfText: "",
  docxText: "",
  geminiReply: "",
  geminiCalls: 0,
}));

vi.mock("pdf-parse/lib/pdf-parse.js", () => ({
  default: vi.fn(async () => ({ text: mocks.pdfText })),
}));
vi.mock("mammoth", () => ({
  default: { extractRawText: vi.fn(async () => ({ value: mocks.docxText })) },
  extractRawText: vi.fn(async () => ({ value: mocks.docxText })),
}));
// Mock the Gemini transport so we can assert WHETHER it was called (fallback).
vi.mock("../services/geminiClient.js", () => ({
  callGemini: vi.fn(async () => {
    mocks.geminiCalls += 1;
    return mocks.geminiReply;
  }),
}));

import app from "../server.js";
import { validate } from "../utils/validators.js";

const PDF = "application/pdf";

const RICH_RESUME = [
  "AISHA KHAN",
  "Backend Developer",
  "",
  "SKILLS",
  "JavaScript, Node, Express, React, Git, MongoDB",
  "",
  "PROJECTS",
  "E-commerce API - Built a REST API with Node and Express for products and orders.",
  "",
  "EXPERIENCE",
  "Software Intern at TechCorp (3 months) - Built internal tooling.",
  "",
  "EDUCATION",
  "BS Computer Science, State University, 2026",
].join("\n");

// Sparse text: >= 50 chars, but the deterministic parser finds < 3 skills and
// no projects/experience -> triggers the Gemini fallback.
const SPARSE_RESUME =
  "Jordan Smith. I enjoy building useful things for people. Email: jordan@example.com. Located in New York City. Hobbies: reading and hiking.";

beforeEach(() => {
  mocks.pdfText = RICH_RESUME;
  mocks.docxText = RICH_RESUME;
  mocks.geminiReply = JSON.stringify({
    skills: ["Python"],
    projects: [],
    experience: [],
    education: [],
  });
  mocks.geminiCalls = 0;
});

function postPdf(text?: string, role = "Backend Developer") {
  if (text !== undefined) mocks.pdfText = text;
  return request(app)
    .post("/api/parse")
    .field("targetRole", role)
    .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "resume.pdf", contentType: PDF });
}

describe("POST /api/parse (finalized)", () => {
  it("200 — returns a schema-valid structuredResume + rawResumeText sibling", async () => {
    const res = await postPdf();
    expect(res.status).toBe(200);
    expect(res.body.targetRole).toBe("Backend Developer");
    expect(typeof res.body.rawResumeText).toBe("string");

    // structuredResume present and schema-valid.
    const sr = res.body.structuredResume;
    expect(sr).toBeDefined();
    const { valid, errors } = validate("StructuredResume", sr);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);

    // rawResumeText is a SIBLING, never nested inside structuredResume.
    expect(sr.rawResumeText).toBeUndefined();
  });

  it("normalizes skills to canonical names (node -> Node.js)", async () => {
    const res = await postPdf();
    expect(res.body.structuredResume.skills).toContain("Node.js");
    expect(res.body.structuredResume.skills).toContain("Express.js");
  });

  it("does NOT call Gemini for a normal/rich resume (deterministic path)", async () => {
    const res = await postPdf();
    expect(res.status).toBe(200);
    expect(mocks.geminiCalls).toBe(0);
  });

  it("falls back to Gemini only for a sparse resume", async () => {
    const res = await postPdf(SPARSE_RESUME);
    expect(res.status).toBe(200);
    expect(mocks.geminiCalls).toBe(1);
    expect(res.body.structuredResume.skills).toContain("Python");
  });

  it("keeps rawResumeText <= 8000 chars", async () => {
    const res = await postPdf("Skills: JavaScript Node Express React Git MongoDB. " + "x".repeat(9000));
    expect(res.status).toBe(200);
    expect(res.body.rawResumeText.length).toBeLessThanOrEqual(8000);
  });

  it("400 INVALID_ROLE — when targetRole is not in the enum", async () => {
    const res = await postPdf(undefined, "Astronaut");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ROLE");
  });

  it("422 PARSE_FAILED — when the PDF has no extractable text", async () => {
    const res = await postPdf("");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("PARSE_FAILED");
  });
});
