import type { ReactNode } from "react";
import type { ScoreBand } from "../../types";

const tones: Record<ScoreBand | "brand" | "neutral", string> = {
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  brand: "bg-brand-500/10 text-brand-600",
  neutral: "bg-surface-2 text-ink-soft",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: ScoreBand | "brand" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-2xl px-2.5 py-0.5 text-xs font-semibold leading-snug break-words ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default Badge;
