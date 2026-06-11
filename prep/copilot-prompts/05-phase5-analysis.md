# Phase 5 — Analysis (Resume Health + Readiness)

## Objective
Add Resume Health and Career Readiness to `/api/analyze` using the existing services.

## Files to create / update
```
server/src/controllers/analyzeController.ts      (add health + readiness)
server/tests/readinessService.test.ts
```

## Acceptance criteria
- [ ] `resumeHealth` has exactly 5 dimensions, each with `reason` + `tip`.
- [ ] `readiness.scoreBreakdown` sums exactly to `readiness.score`.
- [ ] Skill coverage counted once (technicalSkills only).
- [ ] Every `nextAction` references a missing skill / weak project / weak experience.
- [ ] Empty resume → low scores, no crash.

## Exact Copilot prompt
```
Extend CareerPilot's analyzeController to add Resume Health and Career Readiness.
Existing services (do NOT modify):
  analysisService.ts -> default analyzeResumeHealth({structuredResume, matchObject, rawResumeText})
    : ResumeHealthReport, and toSchemaHealth(report) -> { overall, dimensions[] }.
  readinessService.ts -> default computeReadiness({structuredResume, matchObject,
    resumeHealthReport, selectedRole}) : CareerReadiness.
Follow API_CONTRACTS.md §4 and SCHEMAS.md #7/#8.

In analyzeController.postAnalyze, after computing matchObject:

1) Load selectedRole from roles.json by name (the RoleDefinition).
2) const healthReport = analyzeResumeHealth({ structuredResume, matchObject, rawResumeText });
3) const resumeHealth = toSchemaHealth(healthReport);  // API shape { overall, dimensions[] }
4) const readiness = computeReadiness({ structuredResume, matchObject,
     resumeHealthReport: healthReport, selectedRole });
5) Respond 200 with { targetRole, matchObject, resumeHealth, readiness }.

Notes:
- Use rawResumeText ONLY for health; if absent the service already defaults formatting/impact to 60.
- Do not recompute or alter matchObject. Readiness weights are fixed (35/25/20/10/10); no skillGaps term.

Create server/tests/readinessService.test.ts (vitest):
  - Build a matchObject + minimal resume + health report, call computeReadiness.
  - Assert scoreBreakdown.technicalSkills+projects+experience+resumeHealth+roleAlignment === score.
  - Assert there is no "skillGaps" key in scoreBreakdown.
  - Assert every nextAction string references a missing skill OR "experience" OR "project"/"metric".
  - Assert empty resume (no skills/projects/experience) yields score 0..20 without throwing.

Generate complete TypeScript.
```
