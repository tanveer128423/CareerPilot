import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { ReadinessScore } from "../components/dashboard/ReadinessScore";
import { ResumeHealthReport } from "../components/dashboard/ResumeHealthReport";
import { SkillGapMatrix } from "../components/dashboard/SkillGapMatrix";
import { RoadmapTimeline } from "../components/dashboard/RoadmapTimeline";
import { MentorChat } from "../components/mentor/MentorChat";
import { ApiKeyModal } from "../components/upload/ApiKeyModal";

export function DashboardPage() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const [chatOpen, setChatOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const analysis = state.analysisResult;

  if (!analysis) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Card>
          <h2 className="text-lg font-semibold mb-2">No analysis yet</h2>
          <p className="text-ink-muted mb-4">Let's start by uploading your resume.</p>
          <Button onClick={() => nav("/upload")}>Go to Upload</Button>
        </Card>
      </div>
    );
  }

  const askMentor = (q?: string) => {
    setSeed(q ?? null);
    setChatOpen(true);
  };

  const reset = () => {
    dispatch({ type: "RESET" });
    nav("/upload");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <DashboardHeader
        analysis={analysis}
        onReset={reset}
        onEditKey={() => setKeyModalOpen(true)}
        hasKey={Boolean(state.apiKey)}
      />

      <div className="space-y-5">
        <ReadinessScore readiness={analysis.readiness} onAskMentor={() => askMentor("Am I ready for internships?")} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkillGapMatrix matchObject={analysis.matchObject} readiness={analysis.readiness} />
          <ResumeHealthReport health={analysis.resumeHealth} />
        </div>

        <RoadmapTimeline roadmap={analysis.roadmap} />
      </div>

      {/* Floating mentor button */}
      <button
        onClick={() => askMentor()}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-brand-gradient text-white px-5 py-3 shadow-cardHover hover:brightness-105"
        aria-label="Open AI mentor"
      >
        <MessageSquare size={18} /> Ask the Mentor
      </button>

      <MentorChat analysis={analysis} open={chatOpen} onClose={() => setChatOpen(false)} seed={seed} />

      <ApiKeyModal
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        initialKey={state.apiKey}
        onContinue={(key) => {
          dispatch({ type: "SET_API_KEY", apiKey: key });
          setKeyModalOpen(false);
        }}
      />
    </div>
  );
}

export default DashboardPage;
