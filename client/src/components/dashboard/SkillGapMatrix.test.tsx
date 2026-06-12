import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillGapMatrix } from "./SkillGapMatrix";
import type { MatchObject, CareerReadiness } from "../../types";

const matchObject: MatchObject = {
  role: "Backend Developer",
  requiredSkills: ["JavaScript", "Node.js", "Express.js", "REST APIs", "MongoDB", "Git"],
  niceToHaveSkills: ["SQL"],
  have: ["JavaScript", "Git"],
  missing: ["Node.js", "Express.js", "REST APIs", "MongoDB"],
  matchedNiceToHave: [],
  coveragePercentage: 33,
};

const readiness: CareerReadiness = {
  score: 33,
  strengths: [],
  weaknesses: [],
  nextActions: ["Build a Node.js API to close the Node.js gap.", "Add a MongoDB CRUD project."],
  scoreBreakdown: { technicalSkills: 12, projects: 0, experience: 0, resumeHealth: 6, roleAlignment: 15 },
};

describe("SkillGapMatrix", () => {
  it("renders every required skill as a chip", () => {
    render(<SkillGapMatrix matchObject={matchObject} readiness={readiness} />);
    for (const skill of matchObject.requiredSkills) {
      expect(screen.getAllByText(skill).length).toBeGreaterThan(0);
    }
  });

  it("marks 'have' skills present and 'missing' skills absent via aria-labels", () => {
    render(<SkillGapMatrix matchObject={matchObject} readiness={readiness} />);
    expect(screen.getByLabelText("JavaScript: have")).toBeInTheDocument();
    expect(screen.getByLabelText("Node.js: missing")).toBeInTheDocument();
  });

  it("sources recommendations from readiness.nextActions", () => {
    render(<SkillGapMatrix matchObject={matchObject} readiness={readiness} />);
    expect(screen.getByText(/Build a Node.js API/)).toBeInTheDocument();
    expect(screen.getByText(/MongoDB CRUD project/)).toBeInTheDocument();
  });

  it("shows the coverage percentage", () => {
    render(<SkillGapMatrix matchObject={matchObject} readiness={readiness} />);
    expect(screen.getByText(/33%/)).toBeInTheDocument();
  });
});
