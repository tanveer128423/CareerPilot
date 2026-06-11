# CareerPilot — Documentation Reconciliation Checklist

**Purpose:** Make every specification document match the **implemented services** (the ground truth). This closes the audit's root cause: the Fix Pack was authored but never applied, so the specs describe a pre-Fix-Pack product while the code implements the new one.

**Rule for all edits:** **The implemented services in `server/src/services/` are canonical.** Where a doc disagrees with the code, change the **doc**, not the code. No new features, no redesign.

**Estimated effort:** ~2–3 hours, documentation only. Work top-to-bottom; check each box.

---

## Part 0 — Canonical Shapes (the single source of truth)

Copy these into your head before editing. Every doc must match them exactly.

### MatchObject (`matchService.ts`)
```ts
{ role: string; requiredSkills: string[]; niceToHaveSkills: string[];
  have: string[]; missing: string[]; matchedNiceToHave: string[]; coveragePercentage: number }
```

### Resume Health — two shapes
- **Internal** (`analysisService.ts` → `ResumeHealthReport`):
  `{ formattingQuality, impactMetrics, skillsCoverage, keywordCoverage, projectQuality, overallScore }`
  where each dimension = `{ score, reason, fixTip }`.
- **API shape** (`toSchemaHealth()` → `SchemaResumeHealth`, this is what `/api/analyze` RETURNS):
  `{ overall: number; dimensions: [{ key, label, score, reason, tip }] }`
  with `key ∈ {formatting, impactMetrics, skillsCoverage, keywordCoverage, projectQuality}`.

### CareerReadiness (`readinessService.ts`)
```ts
{ score: number; strengths: string[]; weaknesses: string[]; nextActions: string[];
  scoreBreakdown: { technicalSkills:0-35; projects:0-25; experience:0-20;
                    resumeHealth:0-10; roleAlignment:0-10 } }
```
**No `breakdown` key. No `skillGaps` member.** Weights 35/25/20/10/10.

### Roadmap (`roadmapService.ts`)
Returns a **bare array** `RoadmapMilestone[]` (fixed 24 weeks, ≤ 6 milestones):
```ts
{ phase: string; skill: string; gapAddressed: string; project: string; resource: string }
```
**No `week`/`gap` keys. No `{durationWeeks, milestones}` wrapper. No `durationWeeks` request field.**

### Skill Gap
**No dedicated `skillGap` object/service exists.** The dashboard ✅/❌ data comes from `MatchObject` (`requiredSkills` + `have`/`missing`); recommendations come from `readiness.nextActions`. Specs must stop referencing a `skillGap: {required[], quickWins, longTerm}` object.

### rawResumeText
A **top-level sibling** of `structuredResume` on `/parse` (response) and `/analyze` (request), ≤ 8000 chars. **Never inside `StructuredResume`.**

### Mentor
**Non-streaming.** Returns one `MentorResponse = { answer, usedGrounding, suggestedFollowups }`.

---

## Part 1 — `SCHEMAS.md` (highest priority)

- [ ] **#5 MatchObject** — replace `{have, missing}` with the full implemented shape: add `role`, `requiredSkills`, `niceToHaveSkills`, `matchedNiceToHave`, `coveragePercentage`. Keep `additionalProperties:false` only after adding these fields (else it rejects real output).
- [ ] **#8 CareerReadiness** — rename `breakdown` → `scoreBreakdown`; **remove `skillGaps`**; **add `resumeHealth`**; set maxima `technicalSkills 35, projects 25, experience 20, resumeHealth 10, roleAlignment 10`; update the `required` array, the TS interface, the example object, and all validation-rule rows (lines ~436–500).
- [ ] **#9 SkillGapItem & #10 SkillGapAnalysis** — mark as **DEPRECATED / not produced** (or delete). Add a one-line note: "Skill-gap UI derives from MatchObject + readiness.nextActions; no standalone skillGap object is generated."
- [ ] **#11 RoadmapMilestone** — rename `week` → `phase`, `gap` → `gapAddressed`. Keep `skill, project, resource`.
- [ ] **#12 Roadmap** — change to a **bare `RoadmapMilestone[]`** (remove the `{durationWeeks, milestones}` wrapper) OR document the wrapper as not implemented. Remove `DurationWeeks` from the request path.
- [ ] **#4 StructuredResume** — confirm it stays parsed-data only (it does); **add a sibling `RawResumeText` note** (string ≤ 8000) used by `/parse` and `/analyze`, explicitly *not* a member of `StructuredResume`.
- [ ] **#15 AnalysisResult** — update to the assembled shape actually returned: `{ targetRole, matchObject, resumeHealth (toSchemaHealth shape), readiness (scoreBreakdown shape), roadmap (RoadmapMilestone[]) }`. **Remove `skillGap`** from the composition. Update the example object and Appendix A composition map.
- [ ] **Appendix A (TS interfaces)** — regenerate `MatchObject`, `Readiness`→`CareerReadiness`, `Roadmap`/`Milestone`, `AnalysisResult`, and `StructuredResume`+sibling to match the above.

## Part 2 — `API_CONTRACTS.md`

- [ ] **§3 `/api/parse` success response** — add `rawResumeText` as a sibling of `structuredResume`; note ≤ 8000 chars (FIX_PACK Addendum A3).
- [ ] **§4 `/api/analyze` request body** — **remove the `durationWeeks` field** and its validation row (lines 380/391/399); **add optional `rawResumeText` (string, ≤ 8000)** as a sibling (Addendum A4 + Fix 9a).
- [ ] **§4 `/api/analyze` success response** — replace `readiness.breakdown{…skillGaps…}` with `readiness.scoreBreakdown{technicalSkills,projects,experience,resumeHealth,roleAlignment}`; **remove the entire `skillGap` block** (line ~427); change `roadmap` to a bare `RoadmapMilestone[]` with `phase`/`gapAddressed`; add `matchObject` full fields. Update the field-reference table (lines ~453–464).
- [ ] **§5 `/api/mentor` request `grounding`** — change the roadmap example from `{week, skill, project}` to `{phase, gapAddressed, skill, project, resource}`; change `readiness` slice to use `score` + `strengths`/`weaknesses` (no `breakdown` needed). Confirm response stays non-streaming `MentorResponse`.
- [ ] **Appendix A (TS interfaces)** — mirror all the SCHEMAS Appendix A edits (MatchObject, CareerReadiness, Roadmap, AnalysisResult, remove `durationWeeks?` from `AnalyzeRequest`, add `rawResumeText?`).
- [ ] **Appendix C (Limits)** — add the end-to-end budget note (~30s) and confirm `RAW_TEXT_LIMIT 8000` is listed.

## Part 3 — `COPILOT_INSTRUCTIONS.md`

- [ ] **§0 Golden Rules** — add Rules 9–16 from `FIX_PACK.md` §3 (non-streaming mentor; no export endpoint; no user name; single deterministic analyze; fixed 24-week roadmap; 4-component readiness with no `skillGaps`; alias-based matching; `rawResumeText` is a sibling).
- [ ] **§2 line 81 ("Field names must match SCHEMAS.md verbatim")** — replace the stale list (`breakdown, skillGap, quickWins, longTerm, durationWeeks`) with the implemented names: `scoreBreakdown, technicalSkills, resumeHealth, roleAlignment, formattingQuality…/fixTip, overallScore, phase, gapAddressed, requiredSkills, matchedNiceToHave, coveragePercentage`.
- [ ] **§4 State Management reducer** — add `rawResumeText: null` as a sibling of `structuredResume`; remove `durationWeeks` from state.
- [ ] **§7 Prompt Integration rule 7** — change from "Combined Analyze Prompt is the default for `/api/analyze`" to: **"`/api/analyze` is computed by the deterministic services (`analyzeResumeHealth`+`toSchemaHealth`, `computeReadiness`, `generateRoadmap`). Gemini is used ONLY for resume structuring (`/parse`) and the mentor."**
- [ ] **Appendix A (Do/Don't)** — add the FIX_PACK §3 rows (non-streaming, Copy Summary, generic greeting, single deterministic analyze, no skillGaps term, alias matching, fixed 24 weeks).
- [ ] **File extensions** — change `.jsx`/`.js` references to `.ts`/`.tsx` (project is TypeScript).

## Part 4 — `PROMPTS.md`

- [ ] **§2–§5 (Health, Readiness, Skill Gap, Roadmap prompts)** — add a banner at the top of each: **"REFERENCE ONLY — NOT the runtime path. These dimensions are computed deterministically in `analysisService.ts` / `readinessService.ts` / `roadmapService.ts`. Gemini is NOT used for analysis."**
- [ ] **Appendix A (Combined Analyze Prompt)** — same banner; mark as unused at runtime.
- [ ] **§3 readiness scoring block** — if kept for reference, update weights to 35/25/20/10/10 and remove the `skillGaps` term (or rely on the banner + delete the stale math).
- [ ] **`durationWeeks` references (12×)** — note that duration is fixed at 24 in the implemented roadmap; remove the variable from any runtime-implying text.
- [ ] **§1 Resume Structuring** — keep as-is (this IS a runtime Gemini path); confirm output matches `StructuredResume` (no `rawText` inside it).
- [ ] **§6 Mentor** — confirm it matches `mentorPromptBuilder.ts` (it largely does); ensure no streaming language.

## Part 5 — `UI.md`

- [ ] **§3 Dashboard header (line 220/236/242)** — remove the **Export** button and **role-switcher dropdown/re-analyze**; replace with **Copy Summary** (clipboard) + static role label + Start New (FIX_PACK Fix 2f–2h).
- [ ] **§2 Upload & §7 Roadmap** — remove the `DurationSegmented [4][8][12][24]` control; Roadmap header reads static "24 weeks" (Fix 9a).
- [ ] **§8 Mentor (line 439/471)** — replace "Hi Aisha" with a generic greeting; change "name if available" to "target role + readiness score; never a name" (Fix 3a/3b).
- [ ] **§8 Mentor User Flow (line 465)** — change "streamed `answer`" to "full `answer` rendered when the response resolves"; keep the typing indicator as a cosmetic loader (Fix 1d).
- [ ] **Field bindings** — ensure components reference the API shapes: Health uses `dimensions[].tip` (not `fixTip`) and `overall`; Readiness uses `scoreBreakdown`; Roadmap uses `phase`/`gapAddressed`; Skill Gap matrix reads `matchObject.requiredSkills` + `have`.

## Part 6 — `PRD.md`

- [ ] **§5.2 Career Readiness weights table** — change to 35/25/20/10/10 with `Resume Health` replacing `Skill Gaps` (Fix 8a).
- [ ] **Performance NFR (line 338)** — change "Analysis < 15 sec … Mentor responses stream" to "Full analysis < 30 sec … Mentor replies < 8 sec (non-streaming)" (Fix 1a).
- [ ] **Risk R3 (line 355)** — remove "Stream responses"; replace with the real fallbacks (Fix 1b).
- [ ] **User Journey / FR-7 / US-09 (lines 87/99/294/328-330)** — change Export → **Copy Summary** (clipboard, client-only) (Fix 2a–2e).

## Part 7 — `ARCHITECTURE.md`

- [ ] **§6 reducer state** — add `rawResumeText` sibling; remove `durationWeeks`.
- [ ] **§7 pipeline notes** — state analysis is deterministic (services), Gemini only for structuring + mentor; note `rawResumeText` sibling flow (Addendum A6).
- [ ] **§10 build order** — confirm risk-ordered sequence and the "no Combined Gemini analyze" decision are reflected.
- [ ] **Line 102** — change `useMentorChat # chat state + streaming` to `# non-streaming request/response`.
- [ ] **File extensions** — `.jsx` → `.tsx` in the folder tree.

## Part 8 — `IMPLEMENTATION_GUIDE.md` (mostly already correct — verify only)

- [ ] **Phase 5** — confirm it says `toSchemaHealth` for the API response and `scoreBreakdown` (it does); confirm "no `skillGaps`".
- [ ] **Phase 6** — confirm the assembled `AnalysisResult` matches the **reconciled** SCHEMAS #15 (no `skillGap`; roadmap bare array). Update if SCHEMAS now differs.
- [ ] **Phase 4** — confirm it notes the richer `MatchObject` (with `requiredSkills`) feeds the skill-gap UI directly (no separate skillGap object).
- [ ] **Phase 7** — confirm `grounding` shape matches `MentorPromptInput` field names (`resumeHealthReport`, `careerReadiness`, `roadmap` as `RoadmapMilestone[]`).

---

## Part 9 — Final Verification (after all edits)

- [ ] Grep `SCHEMAS.md` + `API_CONTRACTS.md` for `skillGaps` → **0 results**.
- [ ] Grep both for `"breakdown"` (without `score`) → **0 results** (only `scoreBreakdown`).
- [ ] Grep all docs for `durationWeeks` as a **request field** → **0 results**.
- [ ] Grep all docs for `stream`/`streamed`/`SSE` (excluding "downstream") → **0 results**.
- [ ] Grep `UI.md`/`PRD.md` for `Export` (the feature) → **0 results**; `Copy Summary` present.
- [ ] Grep `UI.md` for `Hi Aisha` / `name if available` → **0 results**.
- [ ] Grep `API_CONTRACTS.md` + `SCHEMAS.md` for `rawResumeText` → **≥ 2 results each**.
- [ ] Grep docs for a `skillGap` **object** in `AnalysisResult` → **0 results** (deprecation note only).
- [ ] Spot-check one full `/api/analyze` example object in CONTRACTS validates against the reconciled SCHEMAS #15 by eye (matchObject fields, scoreBreakdown, roadmap array, no skillGap).
- [ ] `COPILOT_INSTRUCTIONS.md` Golden Rules count = 16; line 81 lists implemented names.

**When every box is checked:** the spec layer and the implemented services describe the same product, and the audit flips from CONDITIONAL NO-GO to **GO**.

---

## Edit Order (fastest path)
1. **SCHEMAS.md** (Part 1) — everything else references it.
2. **API_CONTRACTS.md** (Part 2) — mirror SCHEMAS.
3. **COPILOT_INSTRUCTIONS.md** (Part 3) — stop Copilot following stale names + the Gemini-analyze trap.
4. **PROMPTS.md** (Part 4) — banner the reference-only analyze prompts.
5. **UI.md / PRD.md / ARCHITECTURE.md** (Parts 5–7) — UX + narrative.
6. **IMPLEMENTATION_GUIDE.md** (Part 8) — verify.
7. **Part 9** — grep verification.
