import { useState } from "react";
import { Check, Copy, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { formatPlainSummary } from "../../utils/format";
import { isCustomRoleName } from "../../utils/constants";
import type { AnalysisResult } from "../../types";

export function DashboardHeader({
  analysis,
  onReset,
  onEditKey,
  hasKey,
}: {
  analysis: AnalysisResult;
  onReset: () => void;
  onEditKey: () => void;
  hasKey: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatPlainSummary(analysis));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Your Analysis</h1>
          <Badge tone="brand">{analysis.targetRole}</Badge>
        </div>
        <p className="text-sm text-ink-muted mt-0.5">
          {isCustomRoleName(analysis.targetRole)
            ? "Graded against your pasted job posting · evidence-based"
            : "Deterministic · grounded · evidence-based"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onEditKey}>
          <KeyRound size={16} className={hasKey ? "text-success" : undefined} />
          {hasKey ? "API Key" : "Add API Key"}
        </Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy Summary"}
        </Button>
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw size={16} /> Start New
        </Button>
      </div>
    </header>
  );
}

export default DashboardHeader;
