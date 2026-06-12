import type { MentorMessage } from "../../types";

export function MessageBubble({ message }: { message: MentorMessage }) {
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
        {message.text}
      </div>
    </div>
  );
}

export default MessageBubble;
