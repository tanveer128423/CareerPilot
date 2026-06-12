import { motion } from "framer-motion";
import { scoreColor } from "../../utils/format";

export function ProgressBar({ score, height = 8 }: { score: number; height?: number }) {
  const color = scoreColor(score);
  return (
    <div
      className="w-full rounded-full bg-surface-2 overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export default ProgressBar;
