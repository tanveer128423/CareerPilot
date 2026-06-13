import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Map as MapIcon,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import type { AnalysisResult } from "../../types";
import { readinessLabel, scoreColor } from "../../utils/format";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";

interface Props {
  /** "Before" analysis (e.g. Bilal at 40). */
  before: AnalysisResult;
  /** "After" analysis — same role, gaps closed (e.g. Aisha at 87). */
  after: AnalysisResult;
  /** Person/profile name shown across both states. */
  name: string;
  /** Load the full "after" analysis into the dashboard. */
  onExplore: () => void;
}

type Phase = "idle" | "playing" | "done";

const DURATION = 2800;
const GAUGE_SIZE = 220;
const STROKE = 16;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * The "glow-up" — animates one candidate from their BEFORE score to their AFTER
 * score, unlocking each roadmap skill (red ❌ → green ✓) as the gauge climbs.
 * This visualizes CareerPilot's core retention loop in a single live moment.
 */
export function ScoreGlowUp({ before, after, name, onExplore }: Props) {
  const fromScore = before.readiness.score;
  const toScore = after.readiness.score;

  // Skills already present before the roadmap (stay green the whole time).
  const baseHave = before.matchObject.have;
  // Skills the roadmap closes — these flip green one-by-one as the score climbs.
  const unlockSkills = before.matchObject.missing;
  const requiredCount = before.matchObject.requiredSkills.length;

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(fromScore);
  const [progress, setProgress] = useState(0); // 0 → 1
  const raf = useRef(0);

  // Each missing skill "unlocks" at an evenly-spaced point in the timeline,
  // finishing well before the gauge reaches its peak for a satisfying finale.
  const unlockThresholds = useMemo(() => {
    const n = unlockSkills.length || 1;
    return unlockSkills.map((_, i) => 0.18 + (i / n) * 0.62);
  }, [unlockSkills]);

  const unlockedCount = unlockThresholds.filter((t) => progress >= t).length;
  const haveCount = baseHave.length + unlockedCount;
  const coverage = Math.round((haveCount / Math.max(1, requiredCount)) * 100);

  const finishImmediately = () => {
    setProgress(1);
    setScore(toScore);
    setPhase("done");
  };

  const play = () => {
    cancelAnimationFrame(raf.current);
    setScore(fromScore);
    setProgress(0);
    setPhase("playing");

    if (prefersReducedMotion()) {
      finishImmediately();
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(t);
      setScore(Math.round(fromScore + (toScore - fromScore) * eased));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setPhase("done");
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const subtitle =
    phase === "idle"
      ? `${name}, before the roadmap`
      : phase === "done"
        ? `${name}, after 3 months on the roadmap`
        : "Re-analyzing the updated resume…";

  return (
    <Card className="relative overflow-hidden">
      {/* Celebration glow when the transformation completes. */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            key="finale-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-success/5 to-transparent"
          />
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">{name}</h2>
          <AnimatePresence mode="wait">
            <motion.span
              key={readinessLabel(score)}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <Badge tone={score >= 80 ? "success" : score >= 50 ? "warning" : "danger"}>
                {readinessLabel(score)}
              </Badge>
            </motion.span>
          </AnimatePresence>
        </div>
        <p className="text-sm text-ink-muted mb-5 h-5">{subtitle}</p>

        <AnimatedGauge score={score} celebrate={phase === "done"} />

        <div className="grid grid-cols-2 gap-2 w-full mt-5">
          <Stat label="Skill coverage" value={`${coverage}%`} />
          <Stat label="Required skills" value={`${haveCount}/${requiredCount}`} />
        </div>

        {/* Skills unlocked by the roadmap — the red → green flip. */}
        <div className="w-full mt-5 text-left">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2 flex items-center gap-1.5">
            <MapIcon size={13} className="text-brand-600" /> Skills the roadmap closes
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {unlockSkills.map((skill, i) => (
              <SkillFlip key={skill} skill={skill} unlocked={progress >= unlockThresholds[i]} />
            ))}
          </div>

          {baseHave.length > 0 && (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mt-3 mb-2">
                Already had
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {baseHave.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium"
                  >
                    <CheckCircle2 size={12} /> {skill}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Controls / finale. */}
        <div className="w-full mt-6">
          {phase === "idle" && (
            <Button className="w-full" onClick={play}>
              <Play size={16} /> Re-upload after the roadmap
            </Button>
          )}

          {phase === "playing" && (
            <Button className="w-full" variant="secondary" disabled>
              <Sparkles size={16} className="animate-pulse" /> Re-scoring…
            </Button>
          )}

          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 text-success px-3 py-2 text-sm font-semibold">
                <Trophy size={16} />
                +{toScore - fromScore} points · {unlockSkills.length} gaps closed
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant="secondary" onClick={play}>
                  <RotateCcw size={15} /> Replay
                </Button>
                <Button className="flex-1" onClick={onExplore}>
                  Explore the analysis <ArrowRight size={15} />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Circular gauge bound to a live, externally-driven score value. */
function AnimatedGauge({ score, celebrate }: { score: number; celebrate: boolean }) {
  const r = (GAUGE_SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
      animate={celebrate ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg width={GAUGE_SIZE} height={GAUGE_SIZE} className="-rotate-90">
        <defs>
          <linearGradient id="glowUpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={r}
          fill="none"
          stroke="#F4F4F6"
          strokeWidth={STROKE}
        />
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={r}
          fill="none"
          stroke="url(#glowUpGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono-score text-5xl font-semibold tabular-nums" style={{ color }}>
          {clamped}
        </span>
        <span className="text-xs text-ink-muted mt-0.5">{readinessLabel(clamped)}</span>
      </div>
    </motion.div>
  );
}

/** A single skill chip that flips from "missing" (red) to "unlocked" (green). */
function SkillFlip({ skill, unlocked }: { skill: string; unlocked: boolean }) {
  return (
    <motion.span
      key={unlocked ? "on" : "off"}
      initial={unlocked ? { scale: 0.7 } : false}
      animate={unlocked ? { scale: [0.7, 1.18, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        unlocked ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
      }`}
    >
      {unlocked ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {skill}
    </motion.span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2 text-center">
      <div className="font-mono-score text-lg font-semibold text-ink tabular-nums">{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}

export default ScoreGlowUp;
