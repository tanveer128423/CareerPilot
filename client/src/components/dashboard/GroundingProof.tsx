import { Fragment, type ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Sparkles, X } from "lucide-react";
import type { AnalysisResult } from "../../types";
import { buildGroundingContrast } from "../../demo/groundingProof";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wrap each listed term in `text` with a styled span (red = invented, green = evidence). */
function highlight(text: string, terms: string[], kind: "invented" | "evidence"): ReactNode {
  const cleaned = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  // Always also underline score citations like 40/100 on the grounded side.
  const numberPart = kind === "evidence" ? "\\b\\d{1,3}\\s*\\/\\s*100\\b" : "";
  const skillPart = cleaned.map(escapeRe).join("|");
  const pattern = [skillPart, numberPart].filter(Boolean).join("|");
  if (!pattern) return text;

  const re = new RegExp(`(${pattern})`, "gi");
  const termSet = new Set(cleaned.map((t) => t.toLowerCase()));

  return text.split(re).map((part, i) => {
    if (!part) return null;
    const isTerm = termSet.has(part.toLowerCase());
    const isNumber = /^\d{1,3}\s*\/\s*100$/.test(part);
    if (kind === "invented" && isTerm) {
      return (
        <span
          key={i}
          className="rounded bg-danger/15 text-danger font-semibold px-0.5 line-through decoration-danger/60"
        >
          {part}
        </span>
      );
    }
    if (kind === "evidence" && (isTerm || isNumber)) {
      return (
        <span key={i} className="rounded bg-success/15 text-success font-semibold px-0.5">
          {part}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function GroundingProof({
  analysis,
  open,
  onClose,
}: {
  analysis: AnalysisResult;
  open: boolean;
  onClose: () => void;
}) {
  const c = buildGroundingContrast(analysis);
  const [revealed, setRevealed] = useState(false);

  // Reveal the red "invented" flags a beat after open — small dramatic pause.
  useEffect(() => {
    if (!open) {
      setRevealed(false);
      return;
    }
    const t = setTimeout(() => setRevealed(true), 650);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 top-[4vh] bottom-[4vh] z-50 mx-auto w-full max-w-3xl px-4"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex h-full flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-black/5 p-5">
                <div>
                  <h3 className="text-lg font-bold">Why you can trust this</h3>
                  <p className="text-sm text-ink-muted mt-0.5">
                    Same question. A generic AI invents skills you don't have — CareerPilot can't.
                  </p>
                </div>
                <button onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-2" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              {/* The question */}
              <div className="px-5 pt-4">
                <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
                  <span className="text-ink-muted">Question asked to both:</span>{" "}
                  <span className="font-semibold text-ink">"{c.question}"</span>
                </div>
              </div>

              {/* Two columns */}
              <div className="flex-1 overflow-y-auto scroll-thin p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Generic AI */}
                  <div className="rounded-2xl border border-danger/30 bg-danger/[0.03] p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-ink-muted" />
                      <h4 className="font-semibold text-sm">Generic AI (no resume context)</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-ink">
                      {highlight(c.ungrounded, revealed ? c.inventedSkills : [], "invented")}
                    </p>
                    <AnimatePresence>
                      {revealed && c.inventedSkills.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 rounded-xl bg-danger/10 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-1.5 text-danger text-xs font-bold mb-1">
                            <AlertTriangle size={14} /> {c.inventedSkills.length} skills invented — not on the resume
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.inventedSkills.map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-danger/15 text-danger px-2 py-0.5 text-xs font-semibold"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CareerPilot grounded */}
                  <div className="rounded-2xl border border-success/30 bg-success/[0.03] p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={16} className="text-success" />
                      <h4 className="font-semibold text-sm">CareerPilot (grounded in your resume)</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-ink">
                      {highlight(c.grounded, c.haveSkills, "evidence")}
                    </p>
                    <div className="mt-3 rounded-xl bg-success/10 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                        <ShieldCheck size={14} /> 0 invented — every claim traced to your real evidence
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs text-ink-muted mt-5 max-w-xl mx-auto">
                  The score, skill gaps, and roadmap are computed in code. The mentor may only reason
                  over those verified facts — it <strong>cannot</strong> invent a skill, project, or
                  certification you don't have.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GroundingProof;
