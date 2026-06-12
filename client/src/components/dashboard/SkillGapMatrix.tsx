import { Lightbulb, Target } from "lucide-react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import { scoreBand } from "../../utils/format";
import type { CareerReadiness, MatchObject } from "../../types";

/**
 * Skill gap view. There is NO skillGap object:
 *  - ✅/❌ chips come from matchObject (have vs missing).
 *  - Recommendation cards come from readiness.nextActions.
 */
export function SkillGapMatrix({
  matchObject,
  readiness,
}: {
  matchObject: MatchObject;
  readiness: CareerReadiness;
}) {
  const haveSet = new Set(matchObject.have);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-brand-600" />
          <h3 className="text-lg font-semibold">Skill Gap</h3>
        </div>
        <Badge tone={scoreBand(matchObject.coveragePercentage)}>
          {matchObject.coveragePercentage}% coverage
        </Badge>
      </div>

      <p className="text-sm text-ink-muted mb-3">
        {matchObject.have.length} of {matchObject.requiredSkills.length} required {matchObject.role} skills
      </p>

      <div className="flex flex-wrap gap-2">
        {matchObject.requiredSkills.map((skill) => {
          const have = haveSet.has(skill);
          return (
            <span
              key={skill}
              aria-label={`${skill}: ${have ? "have" : "missing"}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${
                have
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-danger/10 text-danger border-danger/20"
              }`}
            >
              <span aria-hidden>{have ? "✅" : "❌"}</span>
              {skill}
            </span>
          );
        })}
      </div>

      {matchObject.matchedNiceToHave.length > 0 && (
        <p className="mt-3 text-xs text-ink-muted">
          Bonus matched: {matchObject.matchedNiceToHave.join(", ")}
        </p>
      )}

      {readiness.nextActions.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-ink-soft mb-2">Recommended next actions</h4>
          <ul className="space-y-2">
            {readiness.nextActions.map((action, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm text-ink"
              >
                <Lightbulb size={16} className="text-info shrink-0 mt-0.5" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export default SkillGapMatrix;
