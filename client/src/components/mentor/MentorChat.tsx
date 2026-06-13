import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";
import { useMentorChat } from "../../hooks/useMentorChat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { ContextStrip } from "./ContextStrip";
import { QUESTION_MAX } from "../../utils/constants";
import type { AnalysisResult } from "../../types";

export function MentorChat({
  analysis,
  open,
  onClose,
  seed,
}: {
  analysis: AnalysisResult;
  open: boolean;
  onClose: () => void;
  seed?: string | null;
}) {
  const { messages, send, pending, followups } = useMentorChat();
  const [input, setInput] = useState("");
  const m = analysis.matchObject;
  const citationSkills = Array.from(
    new Set([...m.requiredSkills, ...m.niceToHaveSkills, ...m.have, ...m.missing]),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  // Pre-seed a question when opened via a deep-link button.
  useEffect(() => {
    if (open && seed && !seededRef.current) {
      seededRef.current = true;
      void send(seed);
    }
    if (!open) seededRef.current = false;
  }, [open, seed, send]);

  const submit = () => {
    if (!input.trim() || pending) return;
    void send(input);
    setInput("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className="flex items-center justify-between border-b border-black/5 p-4">
              <div>
                <h3 className="font-semibold">AI Career Mentor</h3>
                <p className="text-xs text-ink-muted">Non-streaming · grounded answers</p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-2" aria-label="Close mentor">
                <X size={18} />
              </button>
            </div>

            <div className="p-3">
              <ContextStrip role={analysis.targetRole} score={analysis.readiness.score} />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin px-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-ink-muted text-center mt-8">
                  Ask anything about your readiness, gaps, or roadmap.
                </p>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} skills={citationSkills} />
              ))}
              {pending && <TypingIndicator />}
            </div>

            <div className="border-t border-black/5 p-3 space-y-2.5">
              <SuggestedQuestions questions={followups} onPick={(q) => void send(q)} disabled={pending} />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, QUESTION_MAX))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    placeholder="Ask your mentor…"
                    rows={1}
                    className="w-full resize-none rounded-xl border border-black/10 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <div className="text-right text-[10px] text-ink-muted mt-0.5">
                    {input.length}/{QUESTION_MAX}
                  </div>
                </div>
                <button
                  onClick={submit}
                  disabled={pending || !input.trim()}
                  className="mb-5 h-10 w-10 shrink-0 rounded-xl bg-brand-gradient text-white flex items-center justify-center disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default MentorChat;
