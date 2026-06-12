import { BookOpen, Hammer, Map as MapIcon, PartyPopper } from "lucide-react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import type { RoadmapMilestone } from "../../types";

export function RoadmapTimeline({ roadmap }: { roadmap: RoadmapMilestone[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <MapIcon size={18} className="text-brand-600" />
        <h3 className="text-lg font-semibold">24-Week Roadmap</h3>
      </div>

      {roadmap.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-success/5 p-4">
          <PartyPopper className="text-success shrink-0" size={20} />
          <p className="text-sm text-ink">
            No required skills are missing — you're already covered. Focus on polishing projects and
            interview prep.
          </p>
        </div>
      ) : (
        <ol className="relative border-l-2 border-surface-2 ml-2 space-y-6">
          {roadmap.map((m, i) => (
            <li key={i} className="ml-5">
              <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-brand-gradient" />
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono-score text-xs text-brand-600 font-semibold">{m.phase}</span>
                <Badge tone="brand">{m.skill}</Badge>
                <span className="text-xs text-ink-muted">closes: {m.gapAddressed}</span>
              </div>
              <p className="flex items-start gap-1.5 text-sm text-ink">
                <Hammer size={14} className="text-ink-muted shrink-0 mt-0.5" /> {m.project}
              </p>
              <p className="flex items-start gap-1.5 text-xs text-ink-muted mt-1">
                <BookOpen size={13} className="shrink-0 mt-0.5" /> {m.resource}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default RoadmapTimeline;
