/**
 * textExtractor.ts
 *
 * Extracts raw text from an uploaded resume buffer (PDF via pdf-parse, DOCX via
 * mammoth) entirely in memory — the buffer is never written to disk (privacy).
 * Output is whitespace-normalized and trimmed. If too little text is recovered
 * (e.g., a scanned/image-only PDF), a typed PARSE_FAILED error is thrown.
 *
 * @module services/textExtractor
 */

// Import pdf-parse's lib entry directly to avoid the package's debug block that
// tries to read a sample file when required as the main module.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { CONFIG } from "../config.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

const MIME_PDF = "application/pdf";
const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Normalize extracted text:
 *  - unify newlines to \n
 *  - collapse 3+ blank lines to a single blank line
 *  - collapse runs of spaces/tabs to a single space
 *  - trim surrounding whitespace
 */
function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n") // CRLF / CR -> LF
    .replace(/[ \t]+/g, " ") // collapse spaces/tabs
    .replace(/ *\n */g, "\n") // trim spaces around newlines
    .replace(/\n{3,}/g, "\n\n") // collapse excess blank lines
    .trim();
}

/**
 * Extract and normalize text from a resume buffer.
 * @throws AppError UNSUPPORTED_FILE_TYPE for non-PDF/DOCX mimetypes.
 * @throws AppError PARSE_FAILED (422) when extracted text < CONFIG.MIN_TEXT.
 */
export async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  let raw: string;

  if (mimetype === MIME_PDF) {
    const result = await pdfParse(buffer);
    raw = result?.text ?? "";
  } else if (mimetype === MIME_DOCX) {
    const result = await mammoth.extractRawText({ buffer });
    raw = result?.value ?? "";
  } else {
    throw new AppError(
      "UNSUPPORTED_FILE_TYPE",
      "Unsupported file type. Please upload a PDF or DOCX file.",
    );
  }

  const text = normalize(raw);

  logger.debug("Text extraction complete", { mimetype, extractedLength: text.length });

  if (text.length < CONFIG.MIN_TEXT) {
    throw new AppError(
      "PARSE_FAILED",
      "We couldn't read enough text from that file. Please upload a text-based PDF or DOCX (not a scanned image).",
      { status: 422, retryable: true },
    );
  }

  return text;
}

export default extractText;
