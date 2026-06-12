/**
 * Tests for textExtractor.extractText — TDD (written before implementation).
 *
 * The underlying parsing libraries (pdf-parse, mammoth) are mocked so these
 * tests exercise OUR logic: branching by mimetype, whitespace normalization,
 * the MIN_TEXT threshold (PARSE_FAILED), and rejection of unsupported types.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Shared mock state, set per-test (vi.hoisted so it's available in the factory).
const mocks = vi.hoisted(() => ({
  pdfText: "",
  pdfThrows: null as Error | null,
  docxText: "",
}));

vi.mock("pdf-parse/lib/pdf-parse.js", () => ({
  default: vi.fn(async (_buffer: Buffer) => {
    if (mocks.pdfThrows) throw mocks.pdfThrows;
    return { text: mocks.pdfText };
  }),
}));

vi.mock("mammoth", () => ({
  default: { extractRawText: vi.fn(async () => ({ value: mocks.docxText })) },
  extractRawText: vi.fn(async () => ({ value: mocks.docxText })),
}));

import { extractText } from "./textExtractor.js";
import { AppError } from "../utils/AppError.js";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const longText = "John Doe Backend Developer ".repeat(10); // > 50 chars

beforeEach(() => {
  mocks.pdfText = "";
  mocks.pdfThrows = null;
  mocks.docxText = "";
});

describe("extractText", () => {
  it("extracts text from a PDF buffer", async () => {
    mocks.pdfText = longText;
    const out = await extractText(Buffer.from("x"), PDF);
    expect(out).toContain("Backend Developer");
    expect(out.length).toBeGreaterThanOrEqual(50);
  });

  it("extracts text from a DOCX buffer via mammoth", async () => {
    mocks.docxText = longText;
    const out = await extractText(Buffer.from("x"), DOCX);
    expect(out).toContain("Backend Developer");
  });

  it("normalizes CRLF/whitespace and trims", async () => {
    mocks.pdfText = "  Hello\r\n\r\n\r\nWorld   with    spaces  \t  and tabs to reach the fifty character min length ok  ";
    const out = await extractText(Buffer.from("x"), PDF);
    expect(out.startsWith("Hello")).toBe(true);
    expect(out.endsWith("ok")).toBe(true);
    expect(out).not.toContain("\r");
    expect(out).not.toContain("    "); // no runs of 4+ spaces
  });

  it("throws PARSE_FAILED (422) when extracted text is below MIN_TEXT", async () => {
    mocks.pdfText = "too short";
    await expect(extractText(Buffer.from("x"), PDF)).rejects.toMatchObject({
      code: "PARSE_FAILED",
      status: 422,
      retryable: true,
    });
  });

  it("throws PARSE_FAILED when the PDF has no extractable text (scanned)", async () => {
    mocks.pdfText = "";
    await expect(extractText(Buffer.from("x"), PDF)).rejects.toBeInstanceOf(AppError);
  });

  it("rejects unsupported mimetypes with UNSUPPORTED_FILE_TYPE (415)", async () => {
    await expect(extractText(Buffer.from("x"), "image/png")).rejects.toMatchObject({
      code: "UNSUPPORTED_FILE_TYPE",
      status: 415,
    });
  });
});
