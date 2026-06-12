import { Check, X } from "lucide-react";

export function SkillChip({ skill, have }: { skill: string; have: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${
        have
          ? "bg-success/10 text-success border-success/20"
          : "bg-danger/10 text-danger border-danger/20"
      }`}
    >
      {have ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
      {skill}
    </span>
  );
}

export default SkillChip;
