import { Activity, Lightbulb } from "lucide-react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import { ProgressBar } from "../common/ProgressBar";
import { scoreBand } from "../../utils/format";
import type { ResumeHealthReport as Health } from "../../types";

export function ResumeHealthReport({ health }: { health: Health }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-brand-600" />
          <h3 className="text-lg font-semibold">Resume Health</h3>
        </div>
        <Badge tone={scoreBand(health.overall)}>{health.overall}/100</Badge>
      </div>

      <div className="space-y-4">
        {health.dimensions.map((d) => (
          <div key={d.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink">{d.label}</span>
              <span className="font-mono-score text-sm" style={{ color: undefined }}>
                {d.score}
              </span>
            </div>
            <ProgressBar score={d.score} />
            <p className="text-xs text-ink-muted mt-1.5">{d.reason}</p>
            <div className="flex items-start gap-1.5 mt-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5">
              <Lightbulb size={13} className="text-info shrink-0 mt-0.5" />
              <span className="text-xs text-ink-soft">{d.tip}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default ResumeHealthReport;
