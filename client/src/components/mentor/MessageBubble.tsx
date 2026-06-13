import { Fragment, type ReactNode } from "react";
import type { MentorMessage } from "../../types";

/** Escape a string for safe use inside a RegExp. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight the "evidence" inside a grounded mentor answer so the claim
 * ("answers cite your real numbers") becomes a *visible* feature:
 *   - scores like 40/100, percentages like 33%, and week references → brand pill
 *   - any of the user's actual role skills → outlined skill pill
 */
function highlightCitations(text: string, skills: string[]): ReactNode {
  const skillAlternation = skills
    .filter(Boolean)
    .sort((a, b) => b.length - a.length) // longest first so "REST APIs" wins over "REST"
    .map(escapeRe)
    .join("|");

  const numberPart = "\\b\\d{1,3}\\s*\\/\\s*100\\b|\\b\\d{1,3}%|\\bweek\\s*\\d+\\b";
  const pattern = skillAlternation ? `${numberPart}|${skillAlternation}` : numberPart;
  const re = new RegExp(`(${pattern})`, "gi");

  const skillSet = new Set(skills.map((s) => s.toLowerCase()));
  const parts = text.split(re);

  return parts.map((part, i) => {
    if (!part) return null;
    const isSkill = skillSet.has(part.toLowerCase());
    const isNumber = /^(\d{1,3}\s*\/\s*100|\d{1,3}%|week\s*\d+)$/i.test(part);
    if (isSkill) {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-brand-500/10 text-brand-700 px-1 font-semibold"
        >
          {part}
        </span>
      );
    }
    if (isNumber) {
      return (
        <span key={i} className="font-semibold text-brand-700 underline decoration-brand-400/60 decoration-2 underline-offset-2">
          {part}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function MessageBubble({
  message,
  skills = [],
}: {
  message: MentorMessage;
  /** The user's real role skills — used to highlight citations in mentor replies. */
  skills?: string[];
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-brand-gradient text-white rounded-br-sm"
            : "bg-surface-2 text-ink rounded-bl-sm"
        }`}
      >
        {isUser ? message.text : highlightCitations(message.text, skills)}
      </div>
    </div>
  );
}

export default MessageBubble;
