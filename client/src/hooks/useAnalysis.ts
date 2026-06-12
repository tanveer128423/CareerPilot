import { useCallback } from "react";
import { useApp } from "../context/AppContext";
import { ApiError, postAnalyze, postParse } from "../api/client";

/** Drives the parse -> analyze pipeline and updates context status. */
export function useAnalysis() {
  const { state, dispatch } = useApp();

  const run = useCallback(async () => {
    if (!state.file || !state.targetRole) return;
    try {
      dispatch({ type: "PARSE_START" });
      const parsed = await postParse(state.file, state.targetRole);
      dispatch({
        type: "PARSE_SUCCESS",
        structuredResume: parsed.structuredResume,
        rawResumeText: parsed.rawResumeText,
      });

      dispatch({ type: "ANALYZE_START" });
      const analysis = await postAnalyze({
        targetRole: state.targetRole,
        structuredResume: parsed.structuredResume,
        rawResumeText: parsed.rawResumeText,
      });
      dispatch({ type: "ANALYZE_SUCCESS", analysisResult: analysis });
      return analysis;
    } catch (err) {
      const e = err as ApiError;
      dispatch({
        type: "SET_ERROR",
        error: {
          code: e.code ?? "INTERNAL_ERROR",
          message: e.message ?? "Something went wrong.",
          retryable: e.retryable ?? true,
        },
      });
      return undefined;
    }
  }, [state.file, state.targetRole, dispatch]);

  return { run, status: state.status, error: state.error };
}
