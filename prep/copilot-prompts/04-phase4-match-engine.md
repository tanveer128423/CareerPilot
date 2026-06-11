# Phase 4 — Skill Gap / Match Engine ⭐

## Objective
Begin `/api/analyze` by computing the deterministic `matchObject` (the differentiator) and add Priority-1 unit tests. The AI never decides have/missing.

## Files to create
```
server/src/controllers/analyzeController.ts      (BEGIN: validate + matchService)
server/tests/matchService.test.ts                (Priority-1)
```

## Acceptance criteria
- [ ] `have ∪ missing === role.required`; `have ∩ missing === ∅`.
- [ ] "node", "NODE.JS", "Express JS" resolve to Node.js / Express.js.
- [ ] coveragePercentage correct (5/6 → 83).
- [ ] Unknown role → `400 INVALID_ROLE`.
- [ ] Golden-resume test: no clearly-listed skill ever shows as missing.

## Exact Copilot prompt
```
Build the Skill Gap stage of CareerPilot's /api/analyze. The deterministic engine exists:
  server/src/services/matchService.ts exports default matchService with
  generateMatchObject(roleName, rawSkills): MatchObject and class UnknownRoleError.
Do NOT modify matchService.ts. Follow API_CONTRACTS.md §4 and SCHEMAS.md #5/#15.

Create:

1) server/src/controllers/analyzeController.ts  (begin — more added in Phase 5/6)
   - export async function postAnalyze(req, res, next).
   - Validate body { targetRole, structuredResume, rawResumeText? }:
       targetRole in CONFIG.SUPPORTED_ROLES else AppError("INVALID_ROLE", {status:400}).
       structuredResume.skills is a non-empty string array else AppError("VALIDATION_ERROR",
       {status:400, details:[{field:"structuredResume.skills", issue:"must be a non-empty array"}]}).
       rawResumeText (if present) is a string ≤ 8000 chars.
   - try { matchObject = matchService.generateMatchObject(targetRole, structuredResume.skills) }
     catch (e) { if (e instanceof UnknownRoleError) -> AppError("INVALID_ROLE", {status:400}) }.
   - For THIS phase respond 200 with { targetRole, matchObject }.
   - Wrap in try/catch -> next.

2) Wire POST /api/analyze in routes/index.ts -> express.json -> postAnalyze.

3) server/tests/matchService.test.ts (vitest):
   - import matchService and generateMatchObject.
   - Test: Backend Developer with ["nodejs","Express JS","git","javascript"] ->
     have contains Node.js, Express.js, Git, JavaScript; missing contains REST APIs, MongoDB.
   - Test: have ∪ missing equals the role.required set; intersection empty.
   - Test: alias resolution — "NODE.JS","node","node js" all => Node.js.
   - Test: coveragePercentage = round(have/required*100).
   - Test: empty skills array (allowed at service level) => all required in missing, coverage 0.
   - Test: unknown role throws UnknownRoleError.

Generate complete TypeScript. The matchObject MUST be computed before any AI call anywhere.
```
