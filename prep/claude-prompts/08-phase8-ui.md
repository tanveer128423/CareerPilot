# Phase 8 — Frontend UI

## Objective
Build the React + TypeScript (Vite) SPA: Landing → Upload → Dashboard (Readiness, Health, Skill Gap, Roadmap) → Mentor chat. Polished per UI.md. Session-only state.

## Files to create
```
client/ (Vite scaffold): index.html, vite.config.ts, tailwind.config.ts, postcss.config.js, .env
client/src/main.tsx, App.tsx, index.css, types.ts
client/src/context/AppContext.tsx
client/src/api/client.ts
client/src/hooks/useAnalysis.ts, useMentorChat.ts
client/src/pages/{LandingPage,UploadPage,DashboardPage}.tsx
client/src/components/common/{Button,Card,Loader,ErrorBanner,ScoreGauge,ProgressBar,Badge,SkillChip}.tsx
client/src/components/upload/{FileDropzone,RoleSelector}.tsx
client/src/components/dashboard/{ReadinessScore,ResumeHealthReport,SkillGapMatrix,RoadmapTimeline,DashboardHeader}.tsx
client/src/components/mentor/{MentorChat,MessageBubble,TypingIndicator,SuggestedQuestions,ContextStrip}.tsx
client/src/utils/{constants.ts,format.ts}
```

## Acceptance criteria
- [ ] Upload → Dashboard works end-to-end vs the live API in < 60s.
- [ ] Readiness gauge animates; Skill Gap shows ✅/❌ + evidence; Health = 5 bars + tips; Roadmap = milestones.
- [ ] Mentor answers non-streaming with a typing indicator + suggested chips.
- [ ] Copy Summary writes plain text to clipboard. No Export PDF.
- [ ] Mobile-responsive; refresh doesn't wipe results (sessionStorage mirror).

## Exact Copilot prompt
```
Build the CareerPilot frontend (React + TypeScript + Vite + Tailwind). Follow UI.md exactly
(colors, typography, card design, animations) and COPILOT_INSTRUCTIONS.md.

Hard rules:
- State via AppContext + useReducer ONLY (no Redux). Fetch ONLY in src/api/client.ts (via hooks).
- Components are presentational; they read context for display, never fetch.
- Mentor is NON-STREAMING; the typing indicator is a cosmetic loader.
- No login, no Export PDF. "Copy Summary" uses navigator.clipboard only.
- Match field names from SCHEMAS.md exactly. Persist analysisResult to sessionStorage (demo-safety),
  hydrate on load, clear on reset.

1) Scaffold Vite React-TS; add Tailwind with the tokens from UI.md Appendix A (brand indigo→purple,
   surface, ink, semantic success/warning/danger; rounded-2xl cards; shadow-card/cardHover;
   Inter + JetBrains Mono). Install lucide-react and framer-motion.

2) src/types.ts — paste the shared types from API_CONTRACTS.md Appendix A (StructuredResume,
   AnalysisResult, MentorResponse, MatchObject, CareerReadiness, RoadmapMilestone, etc.) — these
   are the canonical TypeScript interfaces that match the implemented services.

3) src/context/AppContext.tsx — useReducer store:
   state = { file, targetRole, structuredResume, rawResumeText, analysisResult, chatHistory,
   status:'idle'|'parsing'|'analyzing'|'ready'|'error', error }.
   actions: SET_FILE, SET_ROLE, PARSE_START, PARSE_SUCCESS, ANALYZE_START, ANALYZE_SUCCESS,
   SET_ERROR, ADD_MESSAGE, RESET. Expose useApp(). Mirror analysisResult to sessionStorage.

4) src/api/client.ts — fetch wrappers: getRoles(), postParse(file,targetRole) (multipart),
   postAnalyze({targetRole,structuredResume,rawResumeText}),
   postMentor({question,history,grounding}) where grounding =
   { targetRole, structuredResume, matchObject, rawResumeText } (deterministic inputs only).
   Read VITE_API_BASE_URL. On non-2xx, parse the { error } envelope and throw it.

5) src/hooks/useAnalysis.ts — run(): PARSE_START -> postParse -> PARSE_SUCCESS ->
   ANALYZE_START -> postAnalyze -> ANALYZE_SUCCESS; on error dispatch SET_ERROR.
   src/hooks/useMentorChat.ts — send(question): optimistic ADD_MESSAGE(user) -> postMentor with
   grounding = ONLY the deterministic inputs the client holds:
     { targetRole, structuredResume, matchObject, rawResumeText }
   (matchObject is read from analysisResult.matchObject). Do NOT send resumeHealthReport,
   careerReadiness, or roadmap — the server reconstructs those internally. Then ADD_MESSAGE(mentor)
   + new followups.

6) Common components per UI.md: Button (gradient primary), Card, Loader (skeleton), ErrorBanner
   (message + Retry when retryable), ScoreGauge (animated circular SVG count-up), ProgressBar
   (band color via format.scoreBand), Badge, SkillChip (✅ green / ❌ red).

7) Pages:
   - LandingPage: hero + "Analyze My Resume" -> /upload.
   - UploadPage: FileDropzone + RoleSelector (from getRoles) + Analyze button -> useAnalysis().run();
     show an animated progress checklist (Reading resume / Matching skills / Scoring / Roadmap)
     driven by status.
   - DashboardPage (gated on analysisResult): DashboardHeader (static role label + Copy Summary +
     Start New), ReadinessScore (ScoreGauge + strengths/weaknesses/nextActions), ResumeHealthReport
     (5 ProgressBar rows reading resumeHealth.dimensions[].reason + .tip), SkillGapMatrix,
     RoadmapTimeline (milestone cards reading phase + gapAddressed + project + resource),
     and a floating Mentor button opening MentorChat.
     SkillGapMatrix data sourcing (IMPORTANT — there is NO skillGap object):
       • ✅/❌ chips come from matchObject: render matchObject.requiredSkills, marking each ✅ if it
         is in matchObject.have and ❌ if it is in matchObject.missing.
       • Recommendation cards come from readiness.nextActions (NOT from any skillGap field).
       • Never reference analysisResult.skillGap — it does not exist.

8) MentorChat: ContextStrip ("Grounded in your resume · {role} · {score}"), MessageBubble (mentor left
   / user right gradient), TypingIndicator while awaiting, SuggestedQuestions chips (seed with the
   PRD examples + response.suggestedFollowups), ChatInput (Enter to send, 500-char counter).

9) utils/format.ts — scoreBand(score): 'danger'|'warning'|'success'; formatPlainSummary(analysisResult)
   for Copy Summary. utils/constants.ts — SUPPORTED_ROLES, SUGGESTED_QUESTIONS.

Generate complete, typed, compiling code. Mobile-first responsive. Skeletons for loading,
ErrorBanner for errors, empty-state redirect to /upload when analysisResult is missing.
```
