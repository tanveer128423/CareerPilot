import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Map as MapIcon, XCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { ScoreGauge } from "../components/common/ScoreGauge";
import { Stagger, StaggerItem } from "../components/common/Motion";
import { ScoreGlowUp } from "../components/compare/ScoreGlowUp";
import { buildDemoSeed, DEMO_RESUME_IDS, type DemoResumeId } from "../demo/demoMode";
import { readinessLabel } from "../utils/format";
import type { AnalysisResult, RoleName } from "../types";

type CompareMode = "transformation" | "sideBySide";

const PROFILE_META: Record<DemoResumeId, { name: string; blurb: string }> = {
  "bilal-backend": {
    name: "Bilal",
    blurb: "Self-taught, early-stage backend candidate",
  },
  "aisha-backend": {
    name: "Aisha",
    blurb: "Final-year student, interview-ready backend candidate",
  },
};

export function ComparePage() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [mode, setMode] = useState<CompareMode>("transformation");

  const profiles = DEMO_RESUME_IDS.map((id) => ({ id, seed: buildDemoSeed(id) }));

  const loadProfile = (id: DemoResumeId) => {
    const { analysis, structuredResume, rawResumeText } = buildDemoSeed(id);
    dispatch({ type: "SET_ROLE", role: analysis.targetRole as RoleName });
    dispatch({ type: "PARSE_SUCCESS", structuredResume, rawResumeText });
    dispatch({ type: "ANALYZE_SUCCESS", analysisResult: analysis });
    dispatch({ type: "SET_DEMO_SESSION", demo: true });
    nav("/dashboard");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 px-3 py-1 text-xs font-semibold">
          Same role · Same engine · Evidence-based
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
          {mode === "transformation" ? (
            <>
              Watch the score <span className="bg-brand-gradient bg-clip-text text-transparent">climb</span>
            </>
          ) : (
            <>
              Two candidates, <span className="bg-brand-gradient bg-clip-text text-transparent">one honest score</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-ink-soft max-w-2xl mx-auto">
          {mode === "transformation"
            ? "Follow the roadmap, re-upload, and the score moves — because the same deterministic engine re-scores the new evidence. Hit play to watch each gap close."
            : "Both targeting Backend Developer. CareerPilot computes each readiness score deterministically from real resume evidence — not vibes. Load either to explore the full analysis."}
        </p>

        <div className="mt-6 inline-flex rounded-full bg-surface-2 p-1 text-sm font-medium">
          <button
            onClick={() => setMode("transformation")}
            className={`rounded-full px-4 py-1.5 transition ${
              mode === "transformation" ? "bg-white text-ink shadow-card" : "text-ink-muted hover:text-ink"
            }`}
          >
            The transformation
          </button>
          <button
            onClick={() => setMode("sideBySide")}
            className={`rounded-full px-4 py-1.5 transition ${
              mode === "sideBySide" ? "bg-white text-ink shadow-card" : "text-ink-muted hover:text-ink"
            }`}
          >
            Side by side
          </button>
        </div>
      </div>

      {mode === "transformation" ? (
        <div className="max-w-md mx-auto">
          <ScoreGlowUp
            before={buildDemoSeed("bilal-backend").analysis}
            after={buildDemoSeed("aisha-backend").analysis}
            name="Bilal"
            onExplore={() => loadProfile("aisha-backend")}
          />
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {profiles.map(({ id, seed }) => (
            <StaggerItem key={id}>
              <ProfileCard analysis={seed.analysis} meta={PROFILE_META[id]} onLoad={() => loadProfile(id)} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <p className="text-center text-xs text-ink-muted mt-6">
        These are pre-baked demo profiles — the same deterministic engine runs on any uploaded resume.
      </p>
    </div>
  );
}

function ProfileCard({
  analysis,
  meta,
  onLoad,
}: {
  analysis: AnalysisResult;
  meta: { name: string; blurb: string };
  onLoad: () => void;
}) {
  const m = analysis.matchObject;
  const score = analysis.readiness.score;

  return (
    <Card featured={score >= 80}>
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">{meta.name}</h2>
          <Badge tone={score >= 80 ? "success" : "warning"}>{readinessLabel(score)}</Badge>
        </div>
        <p className="text-sm text-ink-muted mb-4">{meta.blurb}</p>

        <ScoreGauge score={score} size={150} />

        <div className="grid grid-cols-2 gap-2 w-full mt-5">
          <Stat label="Skill coverage" value={`${m.coveragePercentage}%`} />
          <Stat label="Required skills" value={`${m.have.length}/${m.requiredSkills.length}`} />
        </div>

        <div className="w-full mt-4 text-left space-y-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
              Has the evidence
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {m.have.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium"
                >
                  <CheckCircle2 size={12} /> {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
              Missing for the role
            </h4>
            {m.missing.length === 0 ? (
              <p className="text-sm text-success font-medium">Nothing — all required skills covered.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {m.missing.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full bg-danger/10 text-danger px-2 py-0.5 text-xs font-medium"
                  >
                    <XCircle size={12} /> {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-ink-soft">
            <MapIcon size={14} className="text-brand-600" />
            {analysis.roadmap.length === 0 ? (
              <span>No roadmap needed — focus on interview prep.</span>
            ) : (
              <span>
                {analysis.roadmap.length}-step roadmap to close{" "}
                {analysis.roadmap.length === 1 ? "the gap" : "every gap"}.
              </span>
            )}
          </div>
        </div>

        <Button className="w-full mt-5" onClick={onLoad}>
          Explore {meta.name}'s analysis <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2 text-center">
      <div className="font-mono-score text-lg font-semibold text-ink">{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}

export default ComparePage;
