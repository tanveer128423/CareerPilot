export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Mentor is typing">
      <div className="bg-surface-2 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-ink-muted/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
