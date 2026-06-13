/**
 * mentorPromptBuilder.ts
 *
 * Builds the SYSTEM PROMPT for the CareerPilot AI Career Mentor (Gemini).
 *
 * The mentor is fully grounded in deterministic engine outputs (match, health,
 * readiness, roadmap). This builder serializes those outputs into a strict,
 * anti-hallucination system prompt so the model can ONLY reason over verified
 * facts — it cannot invent skills, projects, experience, or certifications, and
 * may only recommend skills that appear in `matchObject.missing` or the roadmap.
 *
 * No AI is called here; this module purely assembles a string.
 *
 * @module services/mentorPromptBuilder
 */

import type { StructuredResume } from "./resumeParser.js";
import type { MatchObject } from "./matchService.js";
import type { ResumeHealthReport, DimensionScore } from "./analysisService.js";
import type { CareerReadiness } from "./readinessService.js";
import type { RoadmapMilestone } from "./roadmapService.js";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** All deterministic inputs the mentor is allowed to use. */
export interface MentorPromptInput {
  structuredResume: StructuredResume;
  matchObject: MatchObject;
  resumeHealthReport: ResumeHealthReport;
  careerReadiness: CareerReadiness;
  roadmap: RoadmapMilestone[];
}

/* -------------------------------------------------------------------------- */
/* Serialization helpers                                                       */
/* -------------------------------------------------------------------------- */

const dash = (arr: string[]): string =>
  arr.length ? arr.map((s) => `  - ${s}`).join("\n") : "  - (none)";

const orNone = (s: string | undefined | null): string =>
  s && s.trim() ? s : "(none)";

/** Drop a single trailing period so appended sentences don't double-punctuate. */
const noTrailDot = (s: string): string => s.replace(/\.\s*$/, "");

/** Health dimensions in display order, with their canonical labels. */
function healthDimensions(
  h: ResumeHealthReport
): Array<{ label: string; dim: DimensionScore }> {
  return [
    { label: "Formatting Quality", dim: h.formattingQuality },
    { label: "Impact Metrics", dim: h.impactMetrics },
    { label: "Skills Coverage", dim: h.skillsCoverage },
    { label: "Keyword Coverage", dim: h.keywordCoverage },
    { label: "Project Quality", dim: h.projectQuality },
  ];
}

/** Lowest-scoring health dimension (the area to improve first). */
function weakestHealthDimension(
  h: ResumeHealthReport
): { label: string; dim: DimensionScore } {
  return healthDimensions(h).reduce((min, cur) =>
    cur.dim.score < min.dim.score ? cur : min
  );
}

/** Lowest weighted readiness component (the biggest score drag). */
function weakestReadinessComponent(r: CareerReadiness): string {
  const entries = Object.entries(r.scoreBreakdown) as Array<[string, number]>;
  const min = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
  return min[0];
}

/** Serialize the ALLOWED DATA block from deterministic outputs. */
export function serializeAllowedData(input: MentorPromptInput): string {
  const { structuredResume: resume, matchObject: match, resumeHealthReport: health, careerReadiness: readiness, roadmap } = input;

  const projectLines = (resume.projects ?? []).map(
    (p) => `${p.name}${p.tech?.length ? ` [${p.tech.join(", ")}]` : ""}`
  );
  const experienceLines = (resume.experience ?? []).map(
    (e) => `${e.title}${e.org ? ` @ ${e.org}` : ""}${e.duration ? ` (${e.duration})` : ""}`
  );
  const educationLines = (resume.education ?? []).map(
    (e) => `${e.degree}${e.institution ? `, ${e.institution}` : ""}${e.year ? `, ${e.year}` : ""}`
  );

  const healthLines = healthDimensions(health)
    .map(({ label, dim }) => `  - ${label}: ${dim.score}/100 — ${dim.reason}`)
    .join("\n");

  const breakdown = readiness.scoreBreakdown;
  const roadmapLines = roadmap.length
    ? roadmap
        .map(
          (m) =>
            `  - ${m.phase}: Learn ${m.skill} (closes gap: ${m.gapAddressed})\n` +
            `      Project: ${m.project}\n` +
            `      Resource: ${m.resource}`
        )
        .join("\n")
    : "  - (no roadmap — no required skills are missing)";

  return [
    `TARGET ROLE: ${match.role}`,
    ``,
    `SKILLS THE CANDIDATE HAS (verified, required for role):`,
    dash(match.have),
    ``,
    `SKILLS THE CANDIDATE IS MISSING (the ONLY skills you may recommend):`,
    dash(match.missing),
    ``,
    `MATCHED NICE-TO-HAVE SKILLS:`,
    dash(match.matchedNiceToHave),
    ``,
    `PROJECTS ON RESUME (do not invent others):`,
    dash(projectLines),
    ``,
    `EXPERIENCE ON RESUME (do not invent others):`,
    dash(experienceLines),
    ``,
    `EDUCATION ON RESUME:`,
    dash(educationLines),
    ``,
    `CAREER READINESS:`,
    `  - Overall score: ${readiness.score}/100`,
    `  - Breakdown (weighted points): technicalSkills ${breakdown.technicalSkills}/35, ` +
      `projects ${breakdown.projects}/25, experience ${breakdown.experience}/20, ` +
      `resumeHealth ${breakdown.resumeHealth}/10, roleAlignment ${breakdown.roleAlignment}/10`,
    `  - Strengths:`,
    dash(readiness.strengths),
    `  - Weaknesses:`,
    dash(readiness.weaknesses),
    `  - Recommended next actions:`,
    dash(readiness.nextActions),
    ``,
    `RESUME HEALTH (overall ${health.overallScore}/100):`,
    healthLines,
    ``,
    `24-WEEK ROADMAP (each milestone closes a missing skill):`,
    roadmapLines,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Example generation (10 grounded Q&A pairs, adapted to actual data)          */
/* -------------------------------------------------------------------------- */

/** Choose an off-plan skill to demonstrate refusal (never in have/missing). */
function offPlanSkill(match: MatchObject): string {
  const known = new Set(
    [...match.requiredSkills, ...match.niceToHaveSkills, ...match.have, ...match.missing].map(
      (s) => s.toLowerCase()
    )
  );
  for (const candidate of ["Kubernetes", "Rust", "Go", "GraphQL", "Scala"]) {
    if (!known.has(candidate.toLowerCase())) return candidate;
  }
  return "Kubernetes";
}

/**
 * Build 10 grounded example Q&A pairs from the actual deterministic data, so the
 * model learns the exact reasoning + citation pattern for THIS candidate.
 */
export function buildExamples(input: MentorPromptInput): string {
  const { matchObject: match, resumeHealthReport: health, careerReadiness: readiness, roadmap } = input;

  const role = match.role;
  const m0 = roadmap[0];
  const topMissing = match.missing[0] ?? null;
  const haveSkill = match.have[0] ?? "your listed skills";
  const weakHealth = weakestHealthDimension(health);
  const weakComp = weakestReadinessComponent(readiness);
  const off = offPlanSkill(match);

  const ex: Array<{ q: string; a: string }> = [];

  // 1) What should I learn next?  -> missing + roadmap[0]
  ex.push({
    q: "What should I learn next?",
    a: topMissing
      ? `Your highest-priority gap is ${topMissing}. Per your roadmap, ${m0?.phase ?? "the first phase"} focuses on ${m0?.skill ?? topMissing} — ${noTrailDot(m0?.project ?? "build a project that uses it")}. Start there; it directly closes a required ${role} skill.`
      : `You've already covered every required ${role} skill, so there's no missing skill to learn next. Focus on deepening your strengths and polishing projects.`,
  });

  // 2) Am I ready for {role}?  -> score, breakdown, have, missing
  ex.push({
    q: `Am I ready for ${role}?`,
    a: `Your readiness score is ${readiness.score}/100. You have ${match.have.length} of ${match.requiredSkills.length} required skills${match.have.length ? ` (${match.have.slice(0, 3).join(", ")})` : ""}. ${match.missing.length ? `You're not fully ready yet — close ${match.missing.slice(0, 2).join(" and ")} first.` : `You meet the core skill bar — apply and prepare for interviews.`} The biggest score drag is your ${weakComp} component.`,
  });

  // 3) How can I improve my resume?  -> resumeHealthReport
  ex.push({
    q: "How can I improve my resume?",
    a: `Your resume health is ${health.overallScore}/100. The weakest area is ${weakHealth.label} (${weakHealth.dim.score}/100): ${weakHealth.dim.reason} Fix: ${weakHealth.dim.fixTip}`,
  });

  // 4) What project should I build?  -> roadmap milestone projects
  ex.push({
    q: "What project should I build?",
    a: m0
      ? `Build this: ${m0.project} It's the ${m0.phase} milestone in your roadmap and closes your ${m0.gapAddressed} gap. Resource: ${m0.resource}.`
      : `You've closed your required-skill gaps, so build a portfolio piece that deepens a strength rather than fills a gap.`,
  });

  // 5) Do I know enough {a have skill}?  -> have
  ex.push({
    q: `Do I already have ${haveSkill}?`,
    a: match.have.length
      ? `Yes — ${haveSkill} is one of your verified required skills for ${role}. Keep using it in projects to deepen it.`
      : `Your resume doesn't currently list ${haveSkill} among the required ${role} skills, so I can't confirm it.`,
  });

  // 6) ANTI-HALLUCINATION: off-plan skill recommendation
  ex.push({
    q: `Should I learn ${off}?`,
    a: `${off} isn't in your missing required skills or your roadmap for ${role}, so I won't recommend it right now. Focus on your verified gaps${topMissing ? ` — starting with ${topMissing}` : ""}. Once those are closed, you can explore extras.`,
  });

  // 7) What are my strengths?  -> readiness.strengths
  ex.push({
    q: "What are my strengths?",
    a: readiness.strengths.length
      ? `Based on your analysis: ${readiness.strengths[0]}${readiness.strengths[1] ? ` Also, ${readiness.strengths[1].charAt(0).toLowerCase()}${readiness.strengths[1].slice(1)}` : ""}`
      : `Your current data doesn't show a standout strength yet — closing your skill gaps will build one quickly.`,
  });

  // 8) How long until I'm ready?  -> roadmap
  ex.push({
    q: "How long until I'm ready?",
    a: roadmap.length
      ? `Your roadmap spans ${roadmap.length} milestone(s), ending at ${roadmap[roadmap.length - 1].phase}. Following it closes your ${match.missing.length} missing skill(s) and should lift your readiness above its current ${readiness.score}/100.`
      : `You have no missing required skills, so you're effectively ready now — spend time on interview practice and project polish.`,
  });

  // 9) What's my weakest area?  -> scoreBreakdown
  ex.push({
    q: "What's holding my score back the most?",
    a: `Your lowest readiness component is ${weakComp}. ${readiness.weaknesses[0] ?? "Address the related gap to raise it."} ${readiness.nextActions[0] ?? ""}`.trim(),
  });

  // 10) ANTI-HALLUCINATION: invented certification / fact
  ex.push({
    q: "Can you mention my AWS certification?",
    a: `I can only reference what's on your resume, and it doesn't list an AWS certification, so I can't claim one. If you earn it, add it and I'll factor it in.`,
  });

  return ex
    .map((e, i) => `Example ${i + 1}\nUser: ${e.q}\nMentor: ${e.a}`)
    .join("\n\n");
}

/* -------------------------------------------------------------------------- */
/* Public: buildMentorSystemPrompt                                             */
/* -------------------------------------------------------------------------- */

/**
 * Build the complete grounded system prompt for the Mentor Chat.
 *
 * @param input - Deterministic engine outputs the mentor may use.
 * @returns The full system prompt string to send to Gemini.
 *
 * @example
 * const system = buildMentorSystemPrompt({
 *   structuredResume, matchObject, resumeHealthReport, careerReadiness, roadmap,
 * });
 */
export function buildMentorSystemPrompt(input: MentorPromptInput): string {
  const role = input.matchObject.role;
  const allowedData = serializeAllowedData(input);
  const examples = buildExamples(input);

  return [
    `==================================================================`,
    `SECTION 1 — ROLE`,
    `==================================================================`,
    `You are CareerPilot's AI Career Mentor: a friendly, encouraging, and`,
    `professional mentor for a student/fresh graduate targeting the role of`,
    `"${role}". You are concise (2–6 sentences), warm, and ALWAYS evidence-based.`,
    `You help the user understand where they stand and exactly what to do next.`,
    `You speak in second person ("you", "your"). You never address the user by name.`,
    ``,
    `==================================================================`,
    `SECTION 2 — ALLOWED DATA (your ONLY source of truth)`,
    `==================================================================`,
    `Everything below was computed deterministically from the user's real resume.`,
    `You may ONLY use these facts. If something is not here, it does not exist.`,
    ``,
    allowedData,
    ``,
    `==================================================================`,
    `SECTION 3 — STRICT RULES (anti-hallucination)`,
    `==================================================================`,
    `1.  NEVER invent skills. Only reference skills listed under HAS, MISSING, or NICE-TO-HAVE.`,
    `2.  NEVER invent projects. Only reference projects under "PROJECTS ON RESUME".`,
    `3.  NEVER invent experience. Only reference entries under "EXPERIENCE ON RESUME".`,
    `4.  NEVER invent certifications, awards, publications, or education.`,
    `5.  NEVER recommend a skill that is not in MISSING or in a ROADMAP milestone.`,
    `    If asked about any other skill/technology, say it is not part of their current`,
    `    plan and redirect to their verified gaps. Do not endorse learning it now.`,
    `6.  NEVER contradict the readiness results (score, breakdown, strengths, weaknesses).`,
    `7.  NEVER contradict the resume health findings (scores, reasons, fix tips).`,
    `8.  NEVER say "based on industry standards", "typically", "most employers", or similar`,
    `    unless that claim is directly supported by the ALLOWED DATA. Prefer citing the`,
    `    user's own numbers (e.g., "your readiness is ${input.careerReadiness.score}/100").`,
    `9.  NEVER hallucinate, guess, estimate, or fabricate any number, fact, or outcome.`,
    `10. If the question cannot be answered from the ALLOWED DATA, say so honestly and`,
    `    point to the most relevant grounded fact instead of guessing.`,
    `11. Cite specifics in every answer: a named skill, project, score, or roadmap phase.`,
    `12. Keep a positive, mentor-like tone even when delivering hard truths.`,
    ``,
    `==================================================================`,
    `SECTION 4 — QUESTION HANDLING (routing to the right grounded data)`,
    `==================================================================`,
    `- "What should I learn next?"      -> Use MISSING (highest priority first) + ROADMAP[0].`,
    `- "Am I ready for ${role}?"        -> Use READINESS score + breakdown + HAS + MISSING.`,
    `- "How can I improve my resume?"   -> Use RESUME HEALTH (lowest-scoring dimension + its fix tip).`,
    `- "What project should I build?"   -> Use a ROADMAP milestone's Project (prefer the earliest open gap).`,
    `- "What are my strengths/weaknesses?" -> Use READINESS strengths/weaknesses verbatim in substance.`,
    `- "How long until I'm ready?"      -> Use ROADMAP span + MISSING count + current READINESS score.`,
    `- "Should I learn <off-plan skill>?" -> Decline per Rule 5; redirect to MISSING/ROADMAP.`,
    `- "Do I have <skill>?"             -> Confirm only from HAS / NICE-TO-HAVE; otherwise say it's not listed.`,
    `- Anything about certifications/experience not present -> Rule 4; state it's not on the resume.`,
    ``,
    `==================================================================`,
    `SECTION 5 — EXAMPLES (grounded reasoning for THIS candidate)`,
    `==================================================================`,
    `These show the exact citation pattern to follow. Mirror this grounding in every answer.`,
    ``,
    examples,
    ``,
    `==================================================================`,
    `END OF SYSTEM PROMPT — Answer the user's next message using ONLY the ALLOWED DATA above.`,
    `==================================================================`,
  ].join("\n");
}

export default buildMentorSystemPrompt;

/* -------------------------------------------------------------------------- */
/* Example usage                                                               */
/* -------------------------------------------------------------------------- */

/*
import buildMentorSystemPrompt from "./services/mentorPromptBuilder";

const systemPrompt = buildMentorSystemPrompt({
  structuredResume,
  matchObject,
  resumeHealthReport,
  careerReadiness,
  roadmap,
});

// Send `systemPrompt` as the Gemini system instruction; append the user's
// question + prior chat turns as the conversation. Validate the model's reply
// against the MentorResponse schema before returning it.
*/
