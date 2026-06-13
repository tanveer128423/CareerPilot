import type { AnalysisResult } from "../types";
import { readinessLabel } from "../utils/format";

/**
 * groundingProof.ts — builds the "grounded vs. hallucinated" contrast.
 *
 * Same question, two answers:
 *   - ungrounded: what a generic AI (no resume context) confidently invents.
 *   - grounded:   CareerPilot, templated ENTIRELY from the user's real numbers.
 *
 * The "invented skills" are DETECTED, not asserted: we scan the generic answer
 * against a skill vocabulary and flag every skill the user's resume doesn't
 * actually contain. That's the proof — the moat made visible.
 */

export interface GroundingContrast {
  question: string;
  ungrounded: string;
  grounded: string;
  /** Skills the generic AI mentioned that are NOT on the user's resume. */
  inventedSkills: string[];
  /** Skills the user genuinely has (highlighted as evidence on the grounded side). */
  haveSkills: string[];
  score: number;
}

/** Impressive-sounding skills a generic AI loves to name-drop unprompted. */
const FLASHY = ["AWS", "Kubernetes", "Docker", "microservices", "CI/CD"];

const EXTRA_VOCAB = [...FLASHY, "GraphQL", "Redis", "Kafka", "Terraform"];

function lower(s: string): string {
  return s.toLowerCase();
}

/** Does `text` mention `skill` as a whole token (so "Go" doesn't match "Google")? */
function mentions(text: string, skill: string): boolean {
  const re = new RegExp(`(^|[^a-z0-9+#.])${escapeRe(skill)}([^a-z0-9+#]|$)`, "i");
  return re.test(text);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildGroundingContrast(a: AnalysisResult): GroundingContrast {
  const m = a.matchObject;
  const role = a.targetRole;
  const score = a.readiness.score;
  const have = m.have;
  const haveSet = new Set(have.map(lower));

  // Skills the generic AI will confidently (wrongly) attribute to the user:
  // their real gaps plus a few flashy buzzwords — keep only ones they lack.
  const claim = [...m.missing, ...FLASHY]
    .filter((s) => !haveSet.has(lower(s)))
    .slice(0, 4);
  const claimA = claim[0] ?? "Node.js";
  const claimB = claim[1] ?? "AWS";
  const claimC = claim[2] ?? "Kubernetes";

  const question = `How do I stand out for ${role} interviews?`;

  const ungrounded =
    `Great question! You're clearly a strong candidate. Lean into your experience with ` +
    `${claimA} and ${claimB} — highlight the scalable ${claimC} projects you've built and ` +
    `your work deploying to the cloud. Recruiters love seeing production microservices and ` +
    `CI/CD pipelines, so put those front and center. Honestly, you're basically interview-ready — ` +
    `just polish your portfolio and apply broadly. You've got this!`;

  const firstStep = a.roadmap[0];
  const grounded =
    `Let's be precise. Your readiness is ${score}/100 (${readinessLabel(score)}). ` +
    (have.length
      ? `You genuinely have ${have.join(", ")}. `
      : `Your resume doesn't yet show the core required skills. `) +
    (m.missing.length
      ? `For ${role} you're still missing ${m.missing.join(", ")} — those are the real gaps, ` +
        `so don't claim experience you don't have. ` +
        (firstStep
          ? `Your next concrete step is ${firstStep.phase}: ${firstStep.skill} — ${firstStep.project}. ` +
            `Close that, re-upload, and your score moves.`
          : ``)
      : `You already cover all ${m.requiredSkills.length} required skills — focus on interview prep, ` +
        `not on inventing buzzwords.`);

  // Detect every invented skill: mentioned in the generic answer, absent from the resume.
  const vocab = Array.from(new Set([...m.requiredSkills, ...m.niceToHaveSkills, ...EXTRA_VOCAB]));
  const inventedSkills = vocab.filter(
    (s) => mentions(ungrounded, s) && !haveSet.has(lower(s)),
  );

  return { question, ungrounded, grounded, inventedSkills, haveSkills: have, score };
}
