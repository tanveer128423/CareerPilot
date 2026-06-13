import { useCallback } from "react";
import { useApp } from "../context/AppContext";
import { ApiError, postAnalyze, postParse } from "../api/client";
import { DEMO_MODE, buildDemoSeed, pickDemoResumeId } from "../demo/demoMode";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Drives the parse -> analyze pipeline and updates context status. */
export function useAnalysis() {
  const { state, dispatch } = useApp();

  /** Serve a pre-baked result so the dashboard renders instantly, no network. */
  const runDemo = useCallback(async () => {
    const { analysis, structuredResume, rawResumeText } = buildDemoSeed(
      pickDemoResumeId({ fileName: state.fileName }),
    );
    dispatch({ type: "PARSE_START" });
    await sleep(450); // let the progress checklist animate
    dispatch({ type: "PARSE_SUCCESS", structuredResume, rawResumeText });
    dispatch({ type: "ANALYZE_START" });
    await sleep(550);
    dispatch({ type: "ANALYZE_SUCCESS", analysisResult: analysis });
    return analysis;
  }, [state.fileName, dispatch]);

  const run = useCallback(async () => {
    if (!state.file || !state.targetRole) return;
    if (DEMO_MODE) return runDemo();
    try {
      dispatch({ type: "PARSE_START" });
      const parsed = await postParse(state.file, state.targetRole, state.apiKey);
      dispatch({
        type: "PARSE_SUCCESS",
        structuredResume: parsed.structuredResume,
        rawResumeText: parsed.rawResumeText,
      });

      dispatch({ type: "ANALYZE_START" });
      const analysis = await postAnalyze(
        {
          targetRole: state.targetRole,
          structuredResume: parsed.structuredResume,
          rawResumeText: parsed.rawResumeText,
        },
        state.apiKey,
      );
      dispatch({ type: "ANALYZE_SUCCESS", analysisResult: analysis });
      return analysis;
    } catch (err) {
      const e = err as ApiError;
      // Surface the real failure instead of silently serving demo data.
      dispatch({
        type: "SET_ERROR",
        error: {
          code: e.code ?? "INTERNAL_ERROR",
          message: e.message ?? "Analysis failed. Please try again.",
          retryable: e.retryable ?? true,
        },
      });
      return;
    }
  }, [state.file, state.targetRole, state.apiKey, dispatch, runDemo]);

  return { run, status: state.status, error: state.error };
}
