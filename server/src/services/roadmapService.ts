/**
 * roadmapService.ts
 *
 * Deterministic 24-week career roadmap generator for CareerPilot.
 *
 * Converts a MatchObject (and optionally a CareerReadiness result) into a
 * sequence of milestones where EVERY milestone maps directly to a missing
 * required skill. No AI. No randomness. No generic milestones — each milestone
 * names the exact gap it closes, with a concrete project and a real resource.
 *
 * Layout: each missing skill gets a fixed 4-week phase, sequenced by a
 * deterministic learning order (foundations → frameworks → data → auth →
 * testing → tooling). The roadmap spans up to `durationWeeks` (default 24),
 * i.e. at most 6 phases; remaining gaps are deferred (documented).
 *
 * @module services/roadmapService
 */

import type { MatchObject } from "./matchService";
import type { CareerReadiness } from "./readinessService";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** A single roadmap milestone. */
export interface RoadmapMilestone {
  /** Human phase label, e.g. "Week 1-4". */
  phase: string;
  /** The skill to learn in this phase. */
  skill: string;
  /** The missing required skill this milestone closes (always === skill). */
  gapAddressed: string;
  /** A concrete project to build that demonstrates the skill. */
  project: string;
  /** A specific, named learning resource. */
  resource: string;
}

/** Inputs for roadmap generation. */
export interface RoadmapInput {
  matchObject: MatchObject;
  /** Optional — reserved for future prioritization; not required. */
  readiness?: CareerReadiness;
  /** Total roadmap span in weeks (default 24). */
  durationWeeks?: number;
  /** Weeks per phase/milestone (default 4). */
  phaseWeeks?: number;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_DURATION_WEEKS = 24;
const DEFAULT_PHASE_WEEKS = 4;

/**
 * Deterministic learning order. Lower rank = learn earlier. Skills absent from
 * this map fall to a neutral middle rank (stable by original order).
 */
const LEARNING_ORDER: Record<string, number> = {
  // Foundations
  HTML: 5,
  CSS: 6,
  JavaScript: 7,
  "Responsive Design": 8,
  Git: 9,
  OOP: 10,
  "Data Structures": 11,
  Algorithms: 12,
  "Problem Solving": 13,
  TypeScript: 14,
  // Frontend frameworks
  React: 20,
  "State Management": 21,
  Redux: 22,
  "React Router": 23,
  "Tailwind CSS": 24,
  "Next.js": 25,
  // Backend core
  "Node.js": 30,
  "Express.js": 31,
  "Asynchronous Programming": 32,
  "REST APIs": 33,
  // Data
  MongoDB: 40,
  SQL: 41,
  Redis: 42,
  // Security
  Authentication: 50,
  "Error Handling": 51,
  // Quality + delivery
  "Unit Testing": 60,
  Docker: 70,
  "CI/CD": 71,
  AWS: 72,
  Deployment: 73,
  Webpack: 74,
  Accessibility: 75,
  Python: 80,
};

/** Per-skill playbook: concrete project + resource. */
const SKILL_PLAYBOOK: Record<string, { project: string; resource: string }> = {
  MongoDB: {
    project: "Build a MongoDB-backed CRUD API (e.g., a notes or task service).",
    resource: "MongoDB University M001: MongoDB Basics",
  },
  SQL: {
    project: "Build a relational schema and write reporting queries (joins, aggregates).",
    resource: "SQLBolt + PostgreSQL Tutorial",
  },
  Authentication: {
    project: "Add JWT-based register/login and protected routes to an existing API.",
    resource: "jwt.io intro + 'Node.js JWT Auth' guide",
  },
  "Unit Testing": {
    project: "Write a Jest test suite covering your API's core routes and edge cases.",
    resource: "Jest official docs: Getting Started",
  },
  "REST APIs": {
    project: "Design a RESTful API with proper resources, verbs, and status codes.",
    resource: "MDN: REST API design + Express Router docs",
  },
  "Node.js": {
    project: "Build a Node.js server with routing, middleware, and error handling.",
    resource: "Node.js docs + 'Node.js Crash Course'",
  },
  "Express.js": {
    project: "Build an Express API with modular routers and middleware.",
    resource: "Express.js official guide",
  },
  "Asynchronous Programming": {
    project: "Refactor callback code to async/await and handle concurrent requests.",
    resource: "MDN: Asynchronous JavaScript (Promises, async/await)",
  },
  React: {
    project: "Build a multi-component React app that fetches and renders API data.",
    resource: "react.dev: Learn React (official tutorial)",
  },
  "State Management": {
    project: "Add global state (Context/useReducer) to a multi-page React app.",
    resource: "react.dev: Managing State",
  },
  Redux: {
    project: "Introduce Redux Toolkit to manage shared state in a React app.",
    resource: "Redux Toolkit official tutorial",
  },
  "React Router": {
    project: "Build a multi-route SPA with nested routes and route params.",
    resource: "React Router official tutorial",
  },
  "Next.js": {
    project: "Build a Next.js app with server-rendered and static pages.",
    resource: "Next.js Learn course",
  },
  "Tailwind CSS": {
    project: "Style a responsive landing page entirely with Tailwind utilities.",
    resource: "Tailwind CSS docs + utility-first fundamentals",
  },
  TypeScript: {
    project: "Convert a small JS project to TypeScript with typed interfaces.",
    resource: "TypeScript Handbook (official)",
  },
  HTML: {
    project: "Build a semantic, accessible multi-section page in pure HTML.",
    resource: "MDN: HTML basics",
  },
  CSS: {
    project: "Build a responsive layout using Flexbox and CSS Grid.",
    resource: "MDN: CSS layout + Flexbox/Grid guides",
  },
  "Responsive Design": {
    project: "Make an existing page mobile-first with media queries.",
    resource: "web.dev: Responsive design fundamentals",
  },
  Git: {
    project: "Manage a project with branches, commits, and a pull request.",
    resource: "GitHub Skills + Pro Git (free book)",
  },
  OOP: {
    project: "Model a small domain with classes, inheritance, and encapsulation.",
    resource: "MDN: Object-oriented programming concepts",
  },
  "Data Structures": {
    project: "Implement arrays, stacks, queues, hash maps, and a tree from scratch.",
    resource: "NeetCode Data Structures + 'Grokking Algorithms'",
  },
  Algorithms: {
    project: "Solve 20 sorting/searching/DP problems and document approaches.",
    resource: "NeetCode 150 + LeetCode patterns",
  },
  "Problem Solving": {
    project: "Complete a timed problem set and write up your reasoning.",
    resource: "LeetCode Top Interview 150",
  },
  Docker: {
    project: "Containerize an app with a Dockerfile and docker-compose.",
    resource: "Docker official 'Get Started' guide",
  },
  "CI/CD": {
    project: "Add a GitHub Actions pipeline that tests and builds on push.",
    resource: "GitHub Actions official docs",
  },
  AWS: {
    project: "Deploy a small app to AWS (EC2 or Lambda + S3).",
    resource: "AWS Free Tier hands-on tutorials",
  },
  "Error Handling": {
    project: "Add centralized error handling and input validation to an API.",
    resource: "Express error-handling guide",
  },
  Python: {
    project: "Build a small CLI tool or script that solves a real task in Python.",
    resource: "Python.org official tutorial",
  },
  Accessibility: {
    project: "Audit and fix a page for WCAG-AA (labels, contrast, keyboard nav).",
    resource: "web.dev: Accessibility course",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Stable rank for a skill (lower = earlier). Unknown skills sit mid-order. */
function rankOf(skill: string): number {
  return LEARNING_ORDER[skill] ?? 50;
}

/**
 * Order missing skills by deterministic learning sequence, preserving original
 * order as the tiebreaker for stability.
 *
 * @param missing - The MatchObject.missing list (required skills only).
 */
export function prioritizeMissingSkills(missing: string[]): string[] {
  return missing
    .map((skill, index) => ({ skill, index, rank: rankOf(skill) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((x) => x.skill);
}

/** Build a phase label like "Week 1-4". */
export function phaseLabel(startWeek: number, endWeek: number): string {
  return `Week ${startWeek}-${endWeek}`;
}

/** Concrete project descriptor for a skill (playbook first, deterministic fallback). */
function projectForSkill(skill: string): string {
  if (SKILL_PLAYBOOK[skill]) return SKILL_PLAYBOOK[skill].project;
  const s = skill.toLowerCase();
  if (/mongo|sql|database/.test(s)) return `Build a ${skill} CRUD project.`;
  if (/auth/.test(s)) return `Add ${skill} (JWT login) to an existing project.`;
  if (/rest|api/.test(s)) return `Build a ${skill} service with clear endpoints.`;
  if (/react|state/.test(s)) return `Build a ${skill}-driven single-page app.`;
  if (/node|express/.test(s)) return `Build a ${skill} backend API.`;
  if (/test/.test(s)) return `Add a ${skill} suite to an existing project.`;
  return `Build a focused project that uses ${skill} end-to-end.`;
}

/** Named resource for a skill (playbook first, deterministic fallback). */
function resourceForSkill(skill: string): string {
  if (SKILL_PLAYBOOK[skill]) return SKILL_PLAYBOOK[skill].resource;
  return `Official ${skill} documentation + one hands-on tutorial`;
}

/**
 * Build a single milestone for a skill and a week window.
 */
export function buildMilestone(
  skill: string,
  startWeek: number,
  endWeek: number
): RoadmapMilestone {
  return {
    phase: phaseLabel(startWeek, endWeek),
    skill,
    gapAddressed: skill,
    project: projectForSkill(skill),
    resource: resourceForSkill(skill),
  };
}

/* -------------------------------------------------------------------------- */
/* Public: generateRoadmap                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Generate a deterministic, gap-driven roadmap.
 *
 * Every milestone maps to exactly one missing required skill. Skills are
 * sequenced by learning order, each occupying a fixed `phaseWeeks` window,
 * spanning at most `durationWeeks`. If the candidate has no missing skills, an
 * empty roadmap is returned (nothing to close — the caller can show a
 * "gaps closed" state).
 *
 * @param input - MatchObject (+ optional readiness, duration, phase size).
 * @returns An ordered list of RoadmapMilestone (possibly empty).
 *
 * @example
 * generateRoadmap({ matchObject });
 * // missing ["MongoDB","Authentication","Unit Testing"] ->
 * // [ { phase:"Week 1-4", skill:"MongoDB", ... },
 * //   { phase:"Week 5-8", skill:"Authentication", ... },
 * //   { phase:"Week 9-12", skill:"Unit Testing", ... } ]
 */
export function generateRoadmap(input: RoadmapInput): RoadmapMilestone[] {
  const durationWeeks = input.durationWeeks ?? DEFAULT_DURATION_WEEKS;
  const phaseWeeks = input.phaseWeeks ?? DEFAULT_PHASE_WEEKS;

  if (
    !input.matchObject ||
    !Array.isArray(input.matchObject.missing) ||
    input.matchObject.missing.length === 0 ||
    phaseWeeks <= 0 ||
    durationWeeks < phaseWeeks
  ) {
    return [];
  }

  const maxPhases = Math.floor(durationWeeks / phaseWeeks);
  const ordered = prioritizeMissingSkills(input.matchObject.missing).slice(
    0,
    maxPhases
  );

  return ordered.map((skill, i) => {
    const startWeek = i * phaseWeeks + 1;
    const endWeek = startWeek + phaseWeeks - 1;
    return buildMilestone(skill, startWeek, endWeek);
  });
}

export default generateRoadmap;

/* -------------------------------------------------------------------------- */
/* Example usage                                                               */
/* -------------------------------------------------------------------------- */

/*
import generateRoadmap from "./services/roadmapService";
import matchService from "./services/matchService";

const matchObject = matchService.generateMatchObject("Backend Developer", structuredResume.skills);
const roadmap = generateRoadmap({ matchObject }); // 24 weeks, 4-week phases

// roadmap[0] ->
// {
//   phase: "Week 1-4",
//   skill: "REST APIs",
//   gapAddressed: "REST APIs",
//   project: "Design a RESTful API with proper resources, verbs, and status codes.",
//   resource: "MDN: REST API design + Express Router docs"
// }
*/

/* -------------------------------------------------------------------------- */
/* Edge cases handled                                                          */
/* -------------------------------------------------------------------------- */
/*
 * - No missing skills: returns [] (nothing to close).
 * - More missing skills than fit in durationWeeks: extra gaps are deferred
 *   (only the first floor(durationWeeks/phaseWeeks) highest-priority skills
 *   become milestones). Default 24/4 = up to 6 milestones.
 * - Unknown/custom skills: deterministic fallback project + resource are used.
 * - Invalid duration/phase (phaseWeeks <= 0 or duration < phaseWeeks): [].
 * - Every milestone's gapAddressed always equals a skill from matchObject.missing.
 */
