import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAnalysis } from "../hooks/useAnalysis";
import { getRoles } from "../api/client";
// Note: a Gemini API key is now required up front before analysis.
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { FileDropzone } from "../components/upload/FileDropzone";
import { RoleSelector } from "../components/upload/RoleSelector";
import { ApiKeyModal } from "../components/upload/ApiKeyModal";
import type { RoleEntry } from "../types";

const STEPS = ["Reading resume", "Matching skills", "Scoring readiness", "Building roadmap"];

export function UploadPage() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const { run } = useAnalysis();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [jobText, setJobText] = useState("");

  const hasJob = jobText.trim().length >= 40;

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => setRolesError("Couldn't load roles. Is the API running?"));
  }, []);

  const busy = state.status === "parsing" || state.status === "analyzing";
  const activeStep =
    state.status === "parsing" ? 1 : state.status === "analyzing" ? 3 : state.status === "ready" ? 4 : 0;

  const canAnalyze = !!state.file && !!state.targetRole && !busy;

  // Step 1: clicking Analyze always requires a Gemini API key up front, so the
  // whole experience feels consistently AI-powered (and the key is ready for the
  // mentor later). If the user already entered a key this session, reuse it.
  const onAnalyzeClick = () => {
    if (!canAnalyze) return;
    if (state.apiKey) {
      void startAnalysis();
    } else {
      setShowKeyModal(true);
    }
  };

  // Step 2: after the key is provided (or skipped), run parse -> analyze.
  const startAnalysis = async () => {
    setShowKeyModal(false);
    const result = await run(jobText);
    if (result) nav("/dashboard");
  };

  const onKeyContinue = (key: string) => {
    dispatch({ type: "SET_API_KEY", apiKey: key });
    void startAnalysis();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Upload your resume</h1>
      <p className="text-ink-muted mb-6">PDF or DOCX. Processed in memory and never stored.</p>

      <div className="space-y-5">
        <FileDropzone file={state.file} onFile={(f) => dispatch({ type: "SET_FILE", file: f })} />

        <Card>
          <h3 className="font-semibold mb-3">Target role</h3>
          {rolesError ? (
            <ErrorBanner message={rolesError} />
          ) : (
            <RoleSelector
              roles={roles}
              selected={state.targetRole}
              onSelect={(r) => dispatch({ type: "SET_ROLE", role: r })}
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold">
              Paste a real job posting{" "}
              <span className="text-ink-muted font-normal text-sm">(optional)</span>
            </h3>
            {hasJob && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 text-brand-600 px-2.5 py-0.5 text-xs font-semibold">
                <Sparkles size={12} /> Grading vs. this job
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted mb-3">
            Paste the description of a specific job you want, and CareerPilot grades your
            resume against <em>that exact posting</em> — not a generic role.
          </p>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            disabled={busy}
            rows={5}
            placeholder="e.g. Backend Engineer at Acme. We need strong Node.js, PostgreSQL and Docker experience. You'll build REST APIs at scale. Bonus: Kubernetes, AWS…"
            className="w-full rounded-xl border border-black/10 bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-500 resize-y disabled:opacity-60"
          />
        </Card>

        {state.error && (
          <ErrorBanner message={state.error.message} retryable={state.error.retryable} onRetry={onAnalyzeClick} />
        )}

        {busy ? (
          <Card>
            <ul className="space-y-3">
              {STEPS.map((step, i) => {
                const done = i < activeStep;
                const current = i === activeStep;
                return (
                  <li key={step} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        done ? "bg-success text-white" : current ? "bg-brand-500/15" : "bg-surface-2"
                      }`}
                    >
                      {done ? (
                        <Check size={14} />
                      ) : current ? (
                        <Loader2 size={13} className="animate-spin text-brand-600" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/40" />
                      )}
                    </span>
                    <span className={`text-sm ${current ? "text-ink font-medium" : "text-ink-soft"}`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ul>
            <motion.div
              className="mt-4 h-1.5 rounded-full bg-brand-gradient"
              initial={{ width: "10%" }}
              animate={{ width: `${(activeStep / STEPS.length) * 100}%` }}
            />
          </Card>
        ) : (
          <Button size="lg" className="w-full" disabled={!canAnalyze} onClick={onAnalyzeClick}>
            {hasJob ? "Analyze vs. this job" : "Analyze My Resume"} <ArrowRight size={18} />
          </Button>
        )}
      </div>

      <ApiKeyModal
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onContinue={onKeyContinue}
        initialKey={state.apiKey}
      />
    </div>
  );
}

export default UploadPage;
