import { useCallback, useState } from "react";
import { useApp } from "../context/AppContext";
import { ApiError, postMentor } from "../api/client";
import { buildGrounding } from "../utils/format";
import { SUGGESTED_QUESTIONS } from "../utils/constants";

/** Manages the grounded, non-streaming mentor conversation. */
export function useMentorChat() {
  const { state, dispatch } = useApp();
  const [pending, setPending] = useState(false);
  const [followups, setFollowups] = useState<string[]>(SUGGESTED_QUESTIONS);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || pending || !state.analysisResult || !state.structuredResume) return;

      setError(null);
      setPending(true);
      // Optimistic user bubble.
      dispatch({ type: "ADD_MESSAGE", message: { role: "user", text: q } });

      try {
        const grounding = buildGrounding(
          state.analysisResult,
          state.structuredResume,
          state.rawResumeText,
        );
        const res = await postMentor({
          question: q,
          history: state.chatHistory,
          grounding,
        });
        dispatch({ type: "ADD_MESSAGE", message: { role: "mentor", text: res.answer } });
        setFollowups(res.suggestedFollowups.length ? res.suggestedFollowups : SUGGESTED_QUESTIONS);
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "The mentor is unavailable right now.");
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            role: "mentor",
            text: `⚠️ ${e.message ?? "I couldn't respond just now. Please try again."}`,
          },
        });
      } finally {
        setPending(false);
      }
    },
    [pending, state.analysisResult, state.structuredResume, state.rawResumeText, state.chatHistory, dispatch],
  );

  return { messages: state.chatHistory, send, pending, followups, error };
}
