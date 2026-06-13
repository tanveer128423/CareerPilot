import { ArrowRight, CheckCircle2, MessageSquare, ShieldCheck, XCircle } from "lucide-react";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { ScoreGauge } from "../common/ScoreGauge";
import type { CareerReadiness } from "../../types";

export function ReadinessScore({
  readiness,
  onAskMentor,
  onWhyTrust,
}: {
  readiness: CareerReadiness;
  onAskMentor: () => void;
  onWhyTrust: () => void;
}) {
  const b = readiness.scoreBreakdown;
  const parts: Array<[string, number, number]> = [
    ["Technical Skills", b.technicalSkills, 35],
    ["Projects", b.projects, 25],
    ["Experience", b.experience, 20],
    ["Resume Health", b.resumeHealth, 10],
    ["Role Alignment", b.roleAlignment, 10],
  ];

  return (
    <Card featured>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex flex-col items-center lg:w-64 shrink-0">
          <h2 className="self-start text-lg font-semibold mb-4">Career Readiness</h2>
          <ScoreGauge score={readiness.score} />
          <Button className="mt-4" onClick={onAskMentor}>
            <MessageSquare size={16} /> Ask the Mentor
          </Button>
          <button
            onClick={onWhyTrust}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            <ShieldCheck size={14} /> Why can I trust this score?
          </button>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
              Score breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {parts.map(([label, val, max]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
                  <span className="text-sm text-ink-soft">{label}</span>
                  <span className="font-mono-score text-sm">
                    {val}<span className="text-ink-muted">/{max}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {readiness.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-success mb-1.5">Strengths</h4>
                <ul className="space-y-1.5">
                  {readiness.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                      <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {readiness.weaknesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-danger mb-1.5">Weaknesses</h4>
                <ul className="space-y-1.5">
                  {readiness.weaknesses.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                      <XCircle size={15} className="text-danger shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {readiness.nextActions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-ink mb-1.5">Next actions</h4>
              <ul className="space-y-1.5">
                {readiness.nextActions.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                    <ArrowRight size={15} className="text-brand-600 shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ReadinessScore;
