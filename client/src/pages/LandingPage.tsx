import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";

export function LandingPage() {
  const nav = useNavigate();
  return (
    <div className="max-w-5xl mx-auto px-4">
      <section className="text-center pt-16 pb-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 px-3 py-1 text-xs font-semibold">
          <Sparkles size={13} /> Deterministic · Grounded · Evidence-based
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-ink">
          Know if you're <span className="bg-brand-gradient bg-clip-text text-transparent">ready</span> —
          <br className="hidden sm:block" /> not just told you're great.
        </h1>
        <p className="mt-4 text-lg text-ink-soft max-w-2xl mx-auto">
          CareerPilot answers the three questions every grad asks — Am I ready? What do I learn? What
          do I build? — with evidence from your real resume, never hallucinated advice.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Button size="lg" onClick={() => nav("/upload")}>
            Analyze My Resume <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-16">
        <Card>
          <Target className="text-brand-600 mb-2" />
          <h3 className="font-semibold mb-1">Deterministic skill match</h3>
          <p className="text-sm text-ink-muted">
            Your gaps are computed in code against curated role data — the AI can't invent skills.
          </p>
        </Card>
        <Card>
          <ShieldCheck className="text-brand-600 mb-2" />
          <h3 className="font-semibold mb-1">Grounded mentor</h3>
          <p className="text-sm text-ink-muted">
            Ask anything. Every answer cites your own readiness, gaps, and roadmap — or declines.
          </p>
        </Card>
        <Card>
          <Sparkles className="text-brand-600 mb-2" />
          <h3 className="font-semibold mb-1">A 24-week plan</h3>
          <p className="text-sm text-ink-muted">
            Each milestone closes one missing skill, with a concrete project and a real resource.
          </p>
        </Card>
      </section>
    </div>
  );
}

export default LandingPage;
