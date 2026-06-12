import { Check } from "lucide-react";
import type { RoleEntry, RoleName } from "../../types";

export function RoleSelector({
  roles,
  selected,
  onSelect,
}: {
  roles: RoleEntry[];
  selected: RoleName | null;
  onSelect: (r: RoleName) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {roles.map((role) => {
        const active = selected === role.name;
        return (
          <button
            key={role.id}
            onClick={() => onSelect(role.name)}
            className={`flex items-start justify-between text-left rounded-xl border p-3 transition-all ${
              active
                ? "border-brand-500 bg-brand-500/5 ring-1 ring-brand-400"
                : "border-black/10 bg-surface hover:bg-surface-2"
            }`}
          >
            <div>
              <p className="font-medium text-ink text-sm">{role.name}</p>
              <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                {role.required.slice(0, 4).join(" · ")}
              </p>
            </div>
            {active && <Check size={16} className="text-brand-600 shrink-0 mt-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

export default RoleSelector;
