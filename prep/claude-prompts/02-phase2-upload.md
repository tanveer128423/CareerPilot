# Phase 2 — Resume Upload

## Objective
Accept a PDF/DOCX upload, extract raw text in memory, and return it. Establishes the multipart path and text extraction (no parsing yet).

## Files to create
```
server/src/services/textExtractor.ts
server/src/controllers/parseController.ts   (stub: extract only)
```

## Acceptance criteria
- [ ] Text-based PDF returns ≥ 50 chars of `rawResumeText`.
- [ ] DOCX works via mammoth.
- [ ] Scanned/empty PDF → `422 PARSE_FAILED`.
- [ ] Non-PDF/DOCX → `415`; > 5MB → `413`.
- [ ] Uploaded buffer never written to disk.

## Exact Copilot prompt
```
Extend the CareerPilot backend. Follow API_CONTRACTS.md §3 and COPILOT_INSTRUCTIONS.md.

Create:

1) server/src/services/textExtractor.ts
   - export async function extractText(buffer: Buffer, mimetype: string): Promise<string>
   - if mimetype === "application/pdf": use pdf-parse to get text.
   - if mimetype is the DOCX type: use mammoth.extractRawText({ buffer }).
   - Normalize newlines, collapse excessive whitespace, trim.
   - If extracted text length < CONFIG.MIN_TEXT (50), throw AppError("PARSE_FAILED",
     "We couldn't read enough text from that file. Please upload a text-based PDF or DOCX.",
     { status: 422, retryable: true }).
   - Never write the buffer to disk.

2) server/src/controllers/parseController.ts  (STUB for this phase)
   - export async function postParse(req, res, next)
   - Use the multer upload middleware (memory). Expect req.file and req.body.targetRole.
   - If !req.file -> AppError("MISSING_FILE", ..., {status:400, retryable:false}).
   - If targetRole not in CONFIG.SUPPORTED_ROLES -> AppError("INVALID_ROLE", ..., {status:400}).
   - rawResumeText = (await extractText(req.file.buffer, req.file.mimetype)).slice(0, CONFIG.RAW_TEXT_LIMIT).
   - Respond 200 with { targetRole, rawResumeText }.  (structuredResume added in Phase 3.)
   - Wrap in try/catch -> next(err).

3) Wire POST /api/parse in routes/index.ts using upload.single("file") then postParse.

Generate complete TypeScript. Keep the controller thin; all extraction logic in textExtractor.
```
