import { useCallback, useState } from "react";
import { useApp } from "../context/AppContext";
import { ApiError, postMentor } from "../api/client";
import { buildGrounding } from "../utils/format";
import { SUGGESTED_QUESTIONS } from "../utils/constants";
import { DEMO_MODE, getDemoMentorAnswer } from "../demo/demoMode";
import type { MentorResponse } from "../types";

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

      const applyResponse = (res: MentorResponse) => {
        dispatch({ type: "ADD_MESSAGE", message: { role: "mentor", text: res.answer } });
        setFollowups(res.suggestedFollowups.length ? res.suggestedFollowups : SUGGESTED_QUESTIONS);
      };

      // Fully offline demo (build flag OR key-free sample session): answer from
      // the canned grounded map, no network and no API key required.
      if (DEMO_MODE || state.demoSession) {
        const demo = getDemoMentorAnswer(q);
        await new Promise((r) => setTimeout(r, 700)); // keep the typing indicator believable
        if (demo) applyResponse(demo);
        setPending(false);
        return;
      }

      try {
        const grounding = buildGrounding(
          state.analysisResult,
          state.structuredResume,
          state.rawResumeText,
        );
        const res = await postMentor(
          {
            question: q,
            history: state.chatHistory,
            grounding,
          },
          state.apiKey,
        );
        applyResponse(res);
      } catch (err) {
        const e = err as ApiError;
        // Surface the real failure instead of masking it with a canned demo answer.
        const detail =
          e.code === "AI_UNAVAILABLE"
            ? "The AI service is unavailable — check your Gemini API key and model access."
            : (e.message ?? "I couldn't respond just now. Please try again.");
        setError(detail);
        dispatch({
          type: "ADD_MESSAGE",
          message: { role: "mentor", text: `⚠️ ${detail}` },
        });
      } finally {
        setPending(false);
      }
    },
    [pending, state.analysisResult, state.structuredResume, state.rawResumeText, state.chatHistory, state.apiKey, state.demoSession, dispatch],
  );

  return { messages: state.chatHistory, send, pending, followups, error };
}
