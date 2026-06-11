# Phase 6 — Roadmap Generation

## Objective
Add the 24-week roadmap to `/api/analyze`, assembling and validating the complete `AnalysisResult`.

## Files to create / update
```
server/src/controllers/analyzeController.ts      (add roadmap + final assembly + validation)
server/tests/roadmapService.test.ts
```

## Acceptance criteria
- [ ] `/api/analyze` returns a schema-valid full `AnalysisResult` in < 30s.
- [ ] Every roadmap milestone's gap ∈ `matchObject.missing`.
- [ ] Roadmap follows the deterministic learning order; ≤ 6 milestones; 24 weeks.
- [ ] No missing skills → empty roadmap.

## Exact Copilot prompt
```
Finalize CareerPilot's /api/analyze by adding the roadmap and assembling AnalysisResult.
Existing service (do NOT modify):
  roadmapService.ts -> default generateRoadmap({ matchObject }): RoadmapMilestone[]
  where each milestone = { phase, skill, gapAddressed, project, resource } and gapAddressed
  is always in matchObject.missing. Fixed 24 weeks, 4-week phases, ≤ 6 milestones.
Follow API_CONTRACTS.md §4 and SCHEMAS.md #11/#12/#15.

In analyzeController.postAnalyze, after readiness:

1) const roadmap = generateRoadmap({ matchObject });
2) Build the final result object:
   { targetRole, matchObject, resumeHealth, readiness, roadmap }.
   (Map field names to the API/SCHEMAS shape if they differ — match SCHEMAS.md #15 exactly.)
3) Validate the assembled result with validators.ts against the AnalysisResult schema.
   On validation failure throw AppError("INTERNAL_ERROR", "Analysis produced an invalid shape",
   {status:500, retryable:true}).
4) Respond 200 with the validated result.

Create server/tests/roadmapService.test.ts (vitest):
  - matchObject with missing ["MongoDB","Authentication","Unit Testing"] ->
    3 milestones, phases "Week 1-4","Week 5-8","Week 9-12".
  - Assert every milestone.gapAddressed is included in matchObject.missing.
  - Assert empty missing => [].
  - Assert >6 missing => exactly 6 milestones, last phase "Week 21-24".

Generate complete TypeScript. Confirm the end-to-end /api/analyze response validates against AnalysisResult.
```
