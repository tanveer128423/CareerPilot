import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAnalysis } from "../hooks/useAnalysis";
import { getRoles } from "../api/client";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { FileDropzone } from "../components/upload/FileDropzone";
import { RoleSelector } from "../components/upload/RoleSelector";
import type { RoleEntry } from "../types";

const STEPS = ["Reading resume", "Matching skills", "Scoring readiness", "Building roadmap"];

export function UploadPage() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const { run } = useAnalysis();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => setRolesError("Couldn't load roles. Is the API running?"));
  }, []);

  const busy = state.status === "parsing" || state.status === "analyzing";
  const activeStep =
    state.status === "parsing" ? 1 : state.status === "analyzing" ? 3 : state.status === "ready" ? 4 : 0;

  const canAnalyze = !!state.file && !!state.targetRole && !busy;

  const onAnalyze = async () => {
    const result = await run();
    if (result) nav("/dashboard");
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

        {state.error && (
          <ErrorBanner message={state.error.message} retryable={state.error.retryable} onRetry={onAnalyze} />
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
          <Button size="lg" className="w-full" disabled={!canAnalyze} onClick={onAnalyze}>
            Analyze My Resume <ArrowRight size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
