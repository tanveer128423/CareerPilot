import { useState } from "react";
import { Check, Copy, Download, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { formatPlainSummary } from "../../utils/format";
import { openPrintableReport } from "../../utils/report";
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
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Your Analysis</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{analysis.targetRole}</Badge>
        </div>
        <p className="text-sm text-ink-muted mt-2">
          {isCustomRoleName(analysis.targetRole)
            ? "Graded against your pasted job posting · evidence-based"
            : "Deterministic · grounded · evidence-based"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button variant="secondary" onClick={onEditKey}>
          <KeyRound size={16} className={hasKey ? "text-success" : undefined} />
          {hasKey ? "API Key" : "Add API Key"}
        </Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy Summary"}
        </Button>
        <Button variant="secondary" onClick={() => openPrintableReport(analysis)}>
          <Download size={16} /> Download Report
        </Button>
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw size={16} /> Start New
        </Button>
      </div>
    </header>
  );
}

export default DashboardHeader;
