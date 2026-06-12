export function SuggestedQuestions({
  questions,
  onPick,
  disabled,
}: {
  questions: string[];
  onPick: (q: string) => void;
  disabled?: boolean;
}) {
  if (!questions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {questions.slice(0, 4).map((q) => (
        <button
          key={q}
          disabled={disabled}
          onClick={() => onPick(q)}
          className="rounded-full border border-brand-400/40 bg-brand-500/5 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-500/10 disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

export default SuggestedQuestions;
