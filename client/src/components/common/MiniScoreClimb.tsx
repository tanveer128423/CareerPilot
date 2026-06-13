import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { readinessLabel, scoreColor } from "../../utils/format";

const FROM = 40;
const TO = 87;
const SKILLS = ["Node.js", "Express.js", "REST APIs", "MongoDB"];
const SIZE = 132;
const STROKE = 11;

/**
 * A small, self-running preview of the readiness "glow-up" for the landing hero:
 * the score climbs 40 → 87 and skills flip red → green, then pauses and loops.
 * Purely decorative proof-of-concept — sells the product before the first click.
 */
export function MiniScoreClimb() {
  const [score, setScore] = useState(FROM);
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setScore(TO);
      setProgress(1);
      return;
    }

    const DURATION = 2600;
    const PAUSE = 2200;

    const runOnce = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(t);
        setScore(Math.round(FROM + (TO - FROM) * eased));
        if (t < 1) {
          raf.current = requestAnimationFrame(tick);
        } else {
          // Hold the finished state, then reset and loop.
          timer.current = setTimeout(() => {
            setScore(FROM);
            setProgress(0);
            timer.current = setTimeout(runOnce, 600);
          }, PAUSE);
        }
      };
      raf.current = requestAnimationFrame(tick);
    };

    timer.current = setTimeout(runOnce, 700);
    return () => {
      cancelAnimationFrame(raf.current);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);

  return (
    <div className="inline-flex flex-col items-center rounded-2xl border border-black/5 bg-white shadow-card px-6 py-5">
      <div className="relative inline-flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <defs>
            <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="#F4F4F6" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke="url(#miniGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono-score text-3xl font-semibold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] text-ink-muted">{readinessLabel(score)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5 max-w-[200px]">
        {SKILLS.map((s, i) => {
          const unlocked = progress >= 0.2 + (i / SKILLS.length) * 0.6;
          return (
            <span
              key={s}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-300 ${
                unlocked ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}
            >
              {unlocked ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {s}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">Follow the roadmap → re-upload → score climbs</p>
    </div>
  );
}

export default MiniScoreClimb;
