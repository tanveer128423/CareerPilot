# CareerPilot — FIX PACK ADDENDUM v1.1

**Author:** Principal Engineer / Hackathon CTO
**Status:** Supersedes parts of `FIX_PACK.md`. Apply on top of v1.0.
**Scope:** Two accepted change requests — (A) clean up `rawText` placement, (B) reorder the build sequence around the deterministic differentiator.

> **CTO note:** Both points are accepted as-is. (A) fixes a separation-of-concerns smell I introduced in Fix 7. (B) sequences the 38 hours around *risk*, not *document order* — which is the correct way to protect a demo.

---

## Change A — Supersede Fix 7: separate `rawResumeText` from `StructuredResume`

### Decision
`StructuredResume` is **parsed data only**. The source document text travels as a **sibling field** named `rawResumeText` at the top level of the `/parse` and `/analyze` payloads — never inside `StructuredResume`.

**Chosen shape (definitive — no optionality):**
```json
{
  "targetRole": "Backend Developer",
  "structuredResume": { "skills": [], "projects": [], "experience": [], "education": [] },
  "rawResumeText": "AISHA KHAN ... (≤ 8000 chars)"
}
```
> I deliberately picked the **flat sibling** over the `analysisContext: { rawResumeText }` wrapper. Reason: we have exactly one context field today; a wrapper adds nesting with no current payoff. If future context fields appear (e.g., `jobDescriptionText`), promote to `analysisContext` then — that's a postponed concern, not an MVP one.

### A1. `SCHEMAS.md #4 StructuredResume` — REVERT Fix 7a (keep it pure)
**Replace the Fix 7a properties block back to NOT include `rawText`:**
```json
    "education": { "type": "array", "items": { "$ref": "Education" }, "maxItems": 20 },
    "rawTextLength": { "type": "integer", "minimum": 0 }
```
Remove `rawText?: string;` from the `StructuredResume` TS interface. `StructuredResume` is parsed data only.

### A2. `SCHEMAS.md` — add a small standalone definition (place near Shared Definitions)
```ts
/** Truncated source text of the resume (≤ 8000 chars). Used only for
 *  Resume Health formatting/impactMetrics scoring. Never parsed data. */
export type RawResumeText = string;
```
```json
{ "$id": "RawResumeText", "type": "string", "maxLength": 8000 }
```

### A3. `API_CONTRACTS.md` `/api/parse` — return `rawResumeText` as a sibling (supersede Fix 7b)
**Success response shape becomes:**
```json
{
  "targetRole": "Backend Developer",
  "structuredResume": { "skills": [...], "projects": [...], "experience": [...], "education": [...], "rawTextLength": 4210 },
  "rawResumeText": "AISHA KHAN\nComputer Science Student ... <truncated to 8000 chars>"
}
```
Field note: `rawResumeText` = first 8000 chars of extracted text; sibling to `structuredResume`, used by `/analyze` for formatting & impact scoring. Update the `ParseResponse` TS interface:
```ts
export interface ParseResponse {
  targetRole: RoleName;
  structuredResume: StructuredResume;
  rawResumeText: string;
}
```

### A4. `API_CONTRACTS.md` `/api/analyze` — accept `rawResumeText` as a sibling (supersede Fix 7c)
**Request body becomes:**
```json
{
  "targetRole": "Backend Developer",
  "structuredResume": { ... },
  "rawResumeText": "AISHA KHAN ... (optional, ≤ 8000 chars)"
}
```
Validation rows:
- `rawResumeText` — optional, string, ≤ 8000 chars → else `400 VALIDATION_ERROR`.
Update `AnalyzeRequest` TS interface:
```ts
export interface AnalyzeRequest {
  targetRole: RoleName;
  structuredResume: StructuredResume;
  rawResumeText?: string;
}
```
(Note: `durationWeeks` was already removed in Fix 9a.)

### A5. `PROMPTS.md §2` (Resume Health) — source raw text from the sibling (supersede Fix 7d)
**Input Variables row becomes:**
```
| `rawResumeText` | string | request.rawResumeText (≤8000 chars) — REQUIRED for formatting & impactMetrics |
```
System-prompt rule 9 and the empty-text fallback are unchanged from Fix 7d (default those two scores to 60 with a stated limitation if `rawResumeText` is empty). Only the *source* of the variable changes: it now comes from the top-level request field, not `structuredResume.rawText`.

### A6. `ARCHITECTURE.md §7.1` — update the flow note (supersede Fix 7e)
```
/parse returns `rawResumeText` (truncated 8000 chars) as a SIBLING of `structuredResume`.
The client holds both in AppContext and passes both (still as siblings) to /analyze, where
the combined prompt uses `rawResumeText` ONLY for the formatting & impactMetrics dimensions.
StructuredResume remains parsed data only.
```

### A7. `COPILOT_INSTRUCTIONS.md` — update Golden Rule 16 (supersede the v1.0 wording)
```
16. RAW TEXT IS A SIBLING, NOT PARSED DATA. `rawResumeText` (≤8000 chars) is a top-level
    sibling of `structuredResume` on /parse and /analyze. NEVER place it inside
    StructuredResume. It is used solely for the formatting & impactMetrics dimensions.
    If absent, those two scores default to 60 with a stated limitation — never fabricate
    bullet counts.
```
Also update the `AppContext` reducer state in `COPILOT_INSTRUCTIONS.md §4` to add `rawResumeText: null` as a **sibling** of `structuredResume` (not nested):
```js
structuredResume: null,   // StructuredResume | null  (parsed data ONLY)
rawResumeText: null,      // string | null            (source text, ≤8000 chars)
```

**Net effect of Change A:** `StructuredResume` stays a clean parsed-data type; the source document is clearly a separate concern. Zero impact on Skill Gap / Readiness / Mentor (they never used raw text). One extra string threaded through two endpoints.

---

## Change B — Reorder the Build Sequence Around Risk

### Decision (accepted)
Build in the order below. Rationale: **judges forgive an imperfect Resume Health; they do not forgive wrong skill matching, a broken readiness score, or a broken mentor.** The deterministic matching engine is the differentiator, so it ships first and gets the most hardening time. Resume Health (the only raw-text-dependent, most-forgivable section) ships last.

### New build order (replaces `ARCHITECTURE.md §10` phase ordering and `COPILOT_INSTRUCTIONS.md` Appendix B)

```
0. Scaffold + /api/health + roles.json + skillAliases.json
1. Upload Resume        → /api/parse (structure + rawResumeText sibling)
2. Skill Gap Matrix     → matchService (DETERMINISTIC differentiator) + ✅/❌ UI
3. Readiness Score      → readiness (4-signal) + gauge UI
4. Mentor               → /api/mentor (grounded, non-streaming) + chat UI
5. Roadmap              → milestones tied to missing[] + timeline UI
6. Resume Health        → 5 dims (uses rawResumeText) + bars UI   ← LAST / most forgivable
7. Hardening + polish   → DEMO_MODE, sessionStorage mirror, deploy, rehearse
```

### Why this order (the risk logic)
| Priority | Section | If imperfect, judges… | Therefore |
|----------|---------|------------------------|-----------|
| 1 | **Skill Gap (matchService)** | …lose all trust ("it's just ChatGPT") | Build & test FIRST; it's the differentiator |
| 2 | **Readiness** | …see the headline number break | Build early; depends only on match + resume |
| 3 | **Mentor** | …miss the wow factor | Build mid; reuses match + readiness grounding |
| 4 | **Roadmap** | …notice but forgive (it's advisory) | Build after the core trust is established |
| 5 | **Resume Health** | …forgive ("formatting is subjective") | Build LAST; also isolates the rawResumeText work |

### B1. `ARCHITECTURE.md §10` — replace the phase table with the risk-ordered sequence above
Map the existing hour budget to the new order:
```
Hrs 0–3   Phase 0  Scaffold, health, roles.json + skillAliases.json
Hrs 3–8   Phase 1  Upload + /api/parse (structure + rawResumeText sibling)
Hrs 8–16  Phase 2  matchService + Skill Gap Matrix   ← MOST test coverage (differentiator)
Hrs 16–22 Phase 3  Readiness (4-signal) + gauge
Hrs 22–28 Phase 4  Mentor (non-streaming) + chat
Hrs 28–32 Phase 5  Roadmap + timeline
Hrs 32–35 Phase 6  Resume Health (uses rawResumeText) + bars
Hrs 35–38 Phase 7  Hardening, DEMO_MODE, deploy, rehearse 3-min demo
```
**Cut-line rule (updated):** If behind at Hr 32, ship with Resume Health showing a reduced/neutral state — never sacrifice match, readiness, or mentor. Health is the designated "cut last, cut first if needed" section.

### B2. `COPILOT_INSTRUCTIONS.md` Appendix B — replace "File Generation Order" to match
```
1. server: scaffold, roles.json, skillAliases.json, geminiClient, jsonGuard, errorHandler, validators
2. server: parserService + /api/parse (returns rawResumeText sibling)
3. server: matchService (+ alias resolution + Priority-1 tests)  ← FIRST core logic
4. server: /api/analyze combined prompt — wire Skill Gap, then Readiness
5. server: mentorService + /api/mentor
6. server: roadmap (part of combined analyze)
7. server: Resume Health (consumes rawResumeText) — LAST in /api/analyze assembly
8. client: AppContext (+ rawResumeText sibling), api/client, hooks, then sections in the same risk order
```

### B3. `PRD.md §6.1` (MVP table) — add a build-priority note
Append under the Must-Have table:
```
> Build priority (risk-ordered): Skill Gap → Readiness → Mentor → Roadmap → Resume Health.
> The deterministic matching engine is the differentiator and is built and tested first.
> Resume Health is the most forgivable section and is built last.
```

**Net effect of Change B:** The 38 hours are now spent protecting the three things that would be unforgivable if broken, and the riskiest/most-subjective section is sequenced last where it can be gracefully degraded.

---

## Updated Build Readiness Score

| | After Fix Pack v1.0 | After Addendum v1.1 |
|--|--------------------|---------------------|
| Score | 9.4 / 10 | **9.5 / 10** |

**What moved it:** Cleaner separation of concerns (parsed data vs. source text) removes the one architectural smell remaining in the suite, and the risk-ordered build sequence materially lowers demo-failure probability by guaranteeing the differentiator gets the most build+test time. Remaining 0.5 is inherent solo-execution/operational risk (live Gemini latency/quota, untested dataset vs. real resumes) — not a documentation gap.

*End of Addendum.*
