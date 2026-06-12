/**
 * Priority-1 tests for the deterministic match engine (matchService).
 *
 * This is the product's core differentiator: have/missing MUST be computed in
 * code (never by an LLM) and must be internally consistent. These tests lock
 * down the invariants and alias resolution that the whole pipeline depends on.
 */
import { describe, it, expect } from "vitest";
import matchService, {
  generateMatchObject,
  UnknownRoleError,
} from "../src/services/matchService.js";

const BACKEND = "Backend Developer";
const BACKEND_REQUIRED = ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"];

describe("matchService.generateMatchObject", () => {
  it("classifies have/missing for a Backend Developer resume", () => {
    const m = generateMatchObject(BACKEND, ["nodejs", "Express JS", "git", "javascript"]);
    expect(m.have).toEqual(expect.arrayContaining(["Node.js", "Express.js", "Git", "JavaScript"]));
    expect(m.missing).toEqual(expect.arrayContaining(["REST APIs", "MongoDB"]));
  });

  it("invariant: have ∪ missing === role.required, and have ∩ missing === ∅", () => {
    const m = generateMatchObject(BACKEND, ["javascript", "git"]);
    const union = [...m.have, ...m.missing].sort();
    expect(union).toEqual([...BACKEND_REQUIRED].sort());

    const intersection = m.have.filter((s) => m.missing.includes(s));
    expect(intersection).toEqual([]);
  });

  it("resolves aliases: NODE.JS / node / node js all => Node.js", () => {
    for (const alias of ["NODE.JS", "node", "node js", "nodejs"]) {
      const m = generateMatchObject(BACKEND, [alias]);
      expect(m.have).toContain("Node.js");
    }
  });

  it("coveragePercentage = round(have / required * 100)", () => {
    // 5 of 6 required -> round(83.33) = 83
    const m = generateMatchObject(BACKEND, [
      "javascript",
      "nodejs",
      "express",
      "git",
      "mongodb",
    ]);
    expect(m.have.length).toBe(5);
    expect(m.coveragePercentage).toBe(83);
  });

  it("empty skills array => all required missing, coverage 0", () => {
    const m = generateMatchObject(BACKEND, []);
    expect(m.have).toEqual([]);
    expect(m.missing.sort()).toEqual([...BACKEND_REQUIRED].sort());
    expect(m.coveragePercentage).toBe(0);
  });

  it("throws UnknownRoleError for an unknown role", () => {
    expect(() => generateMatchObject("Astronaut", ["javascript"])).toThrow(UnknownRoleError);
  });

  it("golden resume: every clearly-listed required skill appears in have (never missing)", () => {
    // Aisha (strong backend) lists all 6 required skills with varied casing/aliases.
    const aishaSkills = ["JavaScript", "node js", "ExpressJS", "REST API", "Mongo DB", "Git"];
    const m = generateMatchObject(BACKEND, aishaSkills);
    expect(m.missing).toEqual([]);
    expect(m.have.sort()).toEqual([...BACKEND_REQUIRED].sort());
    expect(m.coveragePercentage).toBe(100);
  });

  it("default service instance matches the functional API", () => {
    const a = matchService.generateMatchObject(BACKEND, ["javascript"]);
    const b = generateMatchObject(BACKEND, ["javascript"]);
    expect(a).toEqual(b);
  });
});
