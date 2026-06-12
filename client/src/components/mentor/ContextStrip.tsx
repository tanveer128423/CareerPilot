import { ShieldCheck } from "lucide-react";

export function ContextStrip({ role, score }: { role: string; score: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-brand-500/5 border border-brand-400/20 px-3 py-2">
      <ShieldCheck size={15} className="text-brand-600 shrink-0" />
      <p className="text-xs text-ink-soft">
        Grounded in your resume · <span className="font-medium text-ink">{role}</span> · Readiness{" "}
        <span className="font-mono-score">{score}</span>
      </p>
    </div>
  );
}

export default ContextStrip;
