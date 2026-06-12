# Phase 1 — Backend Foundation

## Objective
Stand up a stateless Express + TypeScript server with config, the standard error envelope, a Gemini client, Ajv validators, and the `/api/health` + `/api/roles` endpoints. No DB, no auth.

## Files to create
```
server/package.json
server/tsconfig.json
server/.env.example
server/src/server.ts
server/src/config.ts
server/src/utils/AppError.ts
server/src/utils/logger.ts
server/src/utils/jsonGuard.ts
server/src/utils/validators.ts
server/src/services/geminiClient.ts
server/src/middleware/errorHandler.ts
server/src/middleware/upload.ts
server/src/routes/index.ts
server/src/controllers/healthController.ts
server/src/controllers/rolesController.ts
```

## Acceptance criteria
- [ ] `npm run dev` boots with no errors (tsx watch).
- [ ] `GET /api/health` → 200 `{ ok, service, version, geminiConfigured, timestamp }`.
- [ ] `GET /api/roles` → 200 `{ roles: [...6 roles] }` from `roles.json`.
- [ ] Any thrown `AppError` returns `{ error:{ code,message,retryable,details } }` with correct HTTP status.
- [ ] CORS locked to `ALLOWED_ORIGIN`; JSON body limit 1MB; `errorHandler` mounted last.

## Exact Copilot prompt
```
You are building the backend foundation for CareerPilot (Express + TypeScript, Node).
Follow API_CONTRACTS.md, SCHEMAS.md, and COPILOT_INSTRUCTIONS.md EXACTLY.

Hard rules:
- No authentication, no database, no sessions. Stateless server.
- Every error response uses the envelope: { "error": { "code", "message", "retryable", "details" } }.
- Never leak stack traces to clients.

Create these files:

1) server/package.json — scripts: "dev": "tsx watch src/server.ts", "build": "tsc",
   "start": "node dist/server.js", "test": "vitest run". Dependencies: express, cors,
   dotenv, multer, ajv, ajv-formats, @google/generative-ai, pdf-parse, mammoth.
   Dev: typescript, tsx, vitest, supertest, @types/node, @types/express, @types/cors, @types/multer.

2) server/tsconfig.json — target ES2020, module NodeNext, moduleResolution NodeNext,
   esModuleInterop true, resolveJsonModule true, strict true, outDir dist, rootDir src.

3) server/.env.example — GEMINI_API_KEY=, PORT=8080, ALLOWED_ORIGIN=http://localhost:5173

4) server/src/config.ts — export a CONFIG object with:
   MAX_FILE_SIZE=5*1024*1024, MAX_BODY="1mb", MIN_TEXT=50, RAW_TEXT_LIMIT=8000,
   GEMINI_TIMEOUT_ANALYZE=20000, GEMINI_TIMEOUT_MENTOR=15000, GEMINI_RETRIES=2,
   MAX_HISTORY=20, QUESTION_MAX=500, PORT, ALLOWED_ORIGIN,
   SUPPORTED_ROLES=["Frontend Developer","Backend Developer","Full Stack Developer",
   "React Developer","Node.js Developer","Software Engineer Intern"].

5) server/src/utils/AppError.ts — class AppError extends Error with (code:string,
   message:string, opts:{status:number, retryable:boolean, details?:any[]}). Export the
   12 error codes as a const map to default HTTP statuses (VALIDATION_ERROR 400,
   MISSING_FILE 400, UNSUPPORTED_FILE_TYPE 415, FILE_TOO_LARGE 413, BODY_TOO_LARGE 413,
   PARSE_FAILED 422, INVALID_ROLE 400, AI_TIMEOUT 504, AI_BAD_JSON 502, AI_UNAVAILABLE 502,
   RATE_LIMITED 429, INTERNAL_ERROR 500).

6) server/src/utils/logger.ts — tiny logger that redacts GEMINI_API_KEY and never logs
   full resume text (log lengths/ids only).

7) server/src/utils/jsonGuard.ts — safeParseJson(text): strips ```json fences and trailing
   commas, tries JSON.parse, returns {ok,value}|{ok:false}. Export repair(text):string.

8) server/src/utils/validators.ts — compile Ajv (with ajv-formats) validators for the
   SCHEMAS.md shapes used by the API: StructuredResume, AnalysisResult, MentorResponse.
   Export validate<T>(schemaName, data): {valid, errors}.
   IMPORTANT: register ALL referenced sub-schemas by `$id` BEFORE compiling the top-level
   schemas, or Ajv will throw "can't resolve reference" at startup. AnalysisResult `$ref`s:
   MatchObject, ResumeHealthReport, ResumeHealthDimension, CareerReadiness, RoadmapMilestone,
   Roadmap, Score, RawResumeText (and RoleName). Call ajv.addSchema(...) for every one of
   these first, then compile StructuredResume, AnalysisResult, and MentorResponse.

9) server/src/services/geminiClient.ts — wraps @google/generative-ai. Export
   callGemini({system?, prompt, jsonMode=true, temperature=0.3, timeoutMs, retries=2}):
   Promise<string>. Use gemini-1.5-flash, set responseMimeType "application/json" when
   jsonMode, enforce timeout via Promise.race, retry on 5xx/timeout with exponential backoff,
   throw AppError("AI_TIMEOUT"/"AI_UNAVAILABLE") on failure. Read key from process.env.

10) server/src/middleware/errorHandler.ts — Express error middleware (4 args). Map AppError
    to its status + envelope; map unknown errors to INTERNAL_ERROR 500. Log full detail
    server-side, send only the safe envelope. Always set X-Request-Id header.

11) server/src/middleware/upload.ts — multer memory storage, limits.fileSize=MAX_FILE_SIZE,
    fileFilter accepts only application/pdf and
    application/vnd.openxmlformats-officedocument.wordprocessingml.document, else
    AppError UNSUPPORTED_FILE_TYPE.

12) server/src/controllers/healthController.ts — getHealth(req,res): returns the health object;
    geminiConfigured = Boolean(process.env.GEMINI_API_KEY).

13) server/src/controllers/rolesController.ts — getRoles(req,res): read roles.json, return
    { roles }.

14) server/src/routes/index.ts — Express Router mounting GET /health, GET /roles.

15) server/src/server.ts — create app, cors({origin:ALLOWED_ORIGIN}), express.json({limit:MAX_BODY}),
    mount router at /api, then errorHandler last, app.listen(PORT) with a startup log.

Generate complete, compiling TypeScript for every file. Use async/await and explicit types.
```
