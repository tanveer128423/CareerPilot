# CareerPilot — UI Design System & Screen Specs

**Author:** Senior Product Designer
**Version:** 1.0
**Aligned to:** `PRD.md` · `ARCHITECTURE.md` · `API_CONTRACTS.md` · `SCHEMAS.md`
**Design language:** Modern SaaS — *Linear* (precision, dark-capable, keyboard-first) × *Notion* (calm, content-first, generous whitespace) × *Stripe* (gradients, polish, trust). Built with **React + Tailwind CSS**.

> **Design principle:** *Calm confidence.* The product delivers honest, sometimes uncomfortable feedback ("you're 68% ready"), so the UI must feel trustworthy, premium, and reassuring — never alarming. Evidence is always visible. Every number has a reason next to it.

---

## 0. Design System Foundations

### 0.1 Color Palette

**Brand & Accent**
| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-600` | `#4F46E5` | Primary actions, active states (Indigo) |
| `--brand-500` | `#6366F1` | Hover, gradients |
| `--brand-400` | `#818CF8` | Focus rings, subtle accents |
| `--brand-gradient` | `linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)` | Hero, primary CTA, score gauges |

**Neutrals (Notion-calm, Linear-crisp)**
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg` | `#FFFFFF` | `#0B0C0E` | Page background |
| `--surface` | `#FAFAFB` | `#141518` | Card background |
| `--surface-2` | `#F4F4F6` | `#1C1E22` | Nested/inset surfaces |
| `--border` | `#EAEAEC` | `#26282D` | Hairline borders |
| `--text-primary` | `#16181D` | `#F4F5F7` | Headings, body |
| `--text-secondary` | `#5B6068` | `#9BA1AC` | Supporting text |
| `--text-muted` | `#8A8F98` | `#6B7280` | Hints, captions |

**Semantic (scores & states)**
| Token | Hex | Meaning |
|-------|-----|---------|
| `--success` | `#16A34A` | Strong score (80–100), skill ✅ |
| `--warning` | `#D97706` | Medium score (50–79) |
| `--danger` | `#DC2626` | Low score (0–49), skill ❌ |
| `--info` | `#0EA5E9` | Tips, neutral callouts |

**Score-band mapping** (used by gauges, bars, chips):
`0–49 → danger` · `50–79 → warning` · `80–100 → success`.

### 0.2 Typography
- **Font:** `Inter` (UI) + `Inter Tight` for display headings; `JetBrains Mono` for scores/numbers (tabular, Linear-style).
- **Scale (Major Third / 1.25):**

| Token | Size / Line | Weight | Use |
|-------|-------------|--------|-----|
| `display` | 48 / 52 | 700 | Landing hero |
| `h1` | 32 / 40 | 700 | Page titles |
| `h2` | 24 / 32 | 600 | Section headers |
| `h3` | 18 / 28 | 600 | Card titles |
| `body` | 15 / 24 | 400 | Default text |
| `small` | 13 / 20 | 400 | Captions, meta |
| `mono-score` | 28 / 32 | 600 | Numeric scores (JetBrains Mono, tabular-nums) |

- **Rules:** Headings use `-0.01em` letter-spacing. Numbers always `font-variant-numeric: tabular-nums`. Max body measure 68ch.

### 0.3 Spacing System
8px base grid. Tailwind scale tokens: `1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px, 24=96px`.
- **Card padding:** 24px (mobile) / 32px (desktop).
- **Section gap:** 32px mobile / 48px desktop.
- **Page max-width:** `1120px` content, `768px` for reading sections; gutters 20px mobile / 32px desktop.

### 0.4 Card Design (the core surface)
```
- Background: --surface
- Border: 1px solid --border
- Radius: 16px (rounded-2xl)
- Shadow (resting): 0 1px 2px rgba(16,18,29,0.04), 0 1px 3px rgba(16,18,29,0.06)
- Shadow (hover/interactive): 0 4px 12px rgba(16,18,29,0.08), 0 2px 4px rgba(16,18,29,0.04)
- Hover lift: translateY(-2px), 160ms ease-out
- Header: h3 title + optional info icon + optional score badge (right-aligned)
- Inset rows use --surface-2 with 12px radius
```
Stripe-inspired touch: primary/featured cards (Readiness) get a subtle 1px gradient border via `background-clip` + the brand gradient.

### 0.5 Animations (Framer Motion / CSS)
| Animation | Spec | Where |
|-----------|------|-------|
| Page/section enter | fade + 8px rise, 240ms, stagger 60ms | Dashboard sections |
| Card hover | lift 2px, shadow grow, 160ms ease-out | All interactive cards |
| Score gauge fill | sweep 0→value, 900ms `cubic-bezier(.22,1,.36,1)` | Readiness, Health |
| Progress bar fill | width 0→value, 700ms ease-out, 80ms stagger | Health dimensions |
| Skill chip reveal | scale 0.96→1 + fade, 120ms, stagger 30ms | Skill Gap grid |
| Mentor typing | 3-dot pulse, 1.2s loop | Mentor chat |
| Number count-up | tween to value, 800ms | All scores |
| Button press | scale 0.98 | All buttons |

**Respect `prefers-reduced-motion`:** disable transforms/sweeps, keep opacity fades only.

### 0.6 Icons
- **Library:** `lucide-react` (1.5px stroke, matches Linear/Notion).
- **Key icons:** `UploadCloud` (upload), `FileText` (resume), `Activity`/`HeartPulse` (health), `Gauge`/`Target` (readiness), `CheckCircle2` ✅ / `XCircle` ❌ (skill gap), `Map`/`Milestone` (roadmap), `Sparkles`/`MessageCircle` (mentor), `Lightbulb` (tips), `ArrowRight` (CTAs), `AlertTriangle` (errors), `Loader2` (spinners).
- **Sizing:** 16px inline, 20px buttons, 24px section headers. Color inherits `currentColor`.

### 0.7 Global Components
- **Button:** primary (brand gradient, white text), secondary (surface + border), ghost (text-only). Radius 10px, height 40px (md) / 44px (lg). Focus ring `--brand-400` 2px.
- **Badge/Chip:** pill, 12px text, semantic bg at 10% opacity + solid text color.
- **ScoreGauge:** circular SVG, gradient stroke, count-up center number + label.
- **Loader:** skeleton shimmer (preferred) or centered `Loader2` spin.
- **ErrorBanner:** top-of-card inline, `--danger` border-left 3px, message + Retry button (when `retryable`).
- **Toast:** bottom-right, auto-dismiss 4s (parse errors, copy-success).

---

## 1. Landing Page

### Layout
```
┌───────────────────────────────────────────────┐
│  Nav: ◆ CareerPilot          [How it works] [▶ Analyze My Resume] │
├───────────────────────────────────────────────┤
│                                                │
│        [gradient eyebrow badge]                │
│   Your AI career copilot —                     │  ← display heading
│   from resume to dream role.                   │
│   Subhead (1–2 lines)                           │
│   [ ▶ Analyze My Resume ]  [ See how it works ]│
│   trust row: "No login • Private • 60-second analysis" │
│                                                │
│   [ Hero visual: floating dashboard preview ]  │  ← Stripe-style product shot
├───────────────────────────────────────────────┤
│  "Three questions every grad asks" → 3 cards:  │
│   Am I ready? · What do I learn? · What build? │
├───────────────────────────────────────────────┤
│  How it works (3 steps, horizontal)            │
│  1 Upload  2 Get evidence-based analysis  3 Ask the Mentor │
├───────────────────────────────────────────────┤
│  Feature grid (5): Health · Readiness · Gap · Roadmap · Mentor │
├───────────────────────────────────────────────┤
│  Final CTA band (gradient) + footer            │
└───────────────────────────────────────────────┘
```

### Components
Nav bar, `HeroSection` (eyebrow badge, display heading, subhead, primary/secondary CTA, trust row), `ProductPreview` (tilted dashboard mock with subtle parallax), `ThreeQuestionsCards`, `HowItWorksSteps`, `FeatureGrid`, `CTABand`, `Footer`.

### Visual Hierarchy
1. Display heading (largest, highest contrast). 2. Primary CTA (brand gradient — only one on screen above fold). 3. Product preview (draws the eye, proves polish). 4. Supporting cards. Generous whitespace (Notion) keeps focus singular.

### User Flow
`Land → click "Analyze My Resume" → /upload`. Secondary "See how it works" smooth-scrolls to steps. Nav CTA mirrors hero CTA.

### Mobile Design
Single column. Heading 32px. CTAs full-width, stacked. Product preview becomes a static centered card. Three-question cards stack vertically. Sticky bottom CTA bar appears after scrolling past hero.

### Empty / Loading / Error States
- **Empty:** N/A (static marketing page).
- **Loading:** hero text + CTA render instantly; product preview image lazy-loads with a shimmer placeholder.
- **Error:** if backend `/api/health` ping fails, show a subtle "Service warming up…" toast but never block the CTA (analysis errors handled downstream).

---

## 2. Upload Page

### Layout
```
┌───────────────────────────────────────────────┐
│  ← Back            ◆ CareerPilot                │
├───────────────────────────────────────────────┤
│        Step 1 of 2 · Upload your resume         │  ← progress label
│                                                │
│   ┌─────────────────────────────────────────┐  │
│   │   ⬆  Drag & drop your resume             │  │  ← Dropzone card (dashed border)
│   │      PDF or DOCX · max 5MB               │  │
│   │      [ Browse files ]                    │  │
│   └─────────────────────────────────────────┘  │
│                                                │
│   Target role                                   │
│   [ Backend Developer            ▼ ]            │  ← RoleSelector
│   (optional) Roadmap length: [4][8][12][24] wks │
│                                                │
│   [ ▶ Analyze My Resume ]   (disabled until valid) │
│   "🔒 Your resume is processed privately and never stored." │
└───────────────────────────────────────────────┘
```

### Components
`FileDropzone` (drag-drop + browse, shows selected file chip with name/size + remove), `RoleSelector` (dropdown sourced from `GET /api/roles`, shows required-skill preview on selection), primary `Analyze` button, privacy note. (No duration control — roadmap is fixed at 24 weeks.)

### Visual Hierarchy
Dropzone is the hero — largest element, dashed brand border, centered icon. Role selector secondary. CTA anchored, activates (gradient fills in) only when file + role valid.

### User Flow
`Select/drop file → validate type+size client-side → pick role → click Analyze → POST /api/parse (status: parsing) → POST /api/analyze (status: analyzing) → /dashboard`. On selected file: show ✓ chip + enable role step.

### Mobile Design
Dropzone full-width, taller tap target (160px). "Browse files" is the primary affordance (drag rare on mobile). Role dropdown full-width native-feeling. CTA sticky at bottom.

### Empty State
Default dropzone with illustration + "PDF or DOCX, max 5MB" hint. CTA disabled with tooltip "Add a resume and choose a role."

### Loading State (this is the showcase moment)
On Analyze, transition to a **full-screen progress experience** (not a blank spinner):
```
   ◆ Reading your resume…           ✓ Extracted 5 skills
   ◆ Comparing to Backend Developer… ✓ Matched 3 of 7 skills
   ◆ Scoring readiness…              ⟳
   ◆ Building your roadmap…          ·
```
Animated checklist that reveals real steps (maps to parse → match → analyze). Progress bar + brand gradient shimmer. Typical < 60s; if > 25s show "Almost there…" reassurance.

### Error States
- **Wrong type / >5MB:** inline red message under dropzone, file rejected before upload, shake animation.
- **`PARSE_FAILED` (422):** ErrorBanner: "We couldn't read text from that file. Try a text-based PDF (not a scanned image)." + Retry.
- **`INVALID_ROLE`:** revert role to placeholder, prompt to reselect.
- **AI failure (502/504):** "Analysis hit a snag. Retry?" with Retry button; offer `DEMO_MODE` fallback silently in dev.

---

## 3. Analysis Dashboard (shell)

### Layout
```
┌───────────────────────────────────────────────────────────┐
│  ◆ CareerPilot     Backend Developer    [⧉ Copy Summary] [↺ New] │  ← sticky header
├───────────────────────────────────────────────────────────┤
│  Sidebar (sticky)     │   Scrollable content                │
│  • Readiness          │   ┌─ Career Readiness (hero) ─────┐ │
│  • Resume Health      │   └───────────────────────────────┘ │
│  • Skill Gap          │   ┌─ Resume Health Report ────────┐ │
│  • Roadmap            │   └───────────────────────────────┘ │
│  • Ask the Mentor ●   │   ┌─ Skill Gap ───────────────────┐ │
│                       │   └───────────────────────────────┘ │
│                       │   ┌─ Roadmap ─────────────────────┐ │
│                       │   └───────────────────────────────┘ │
└───────────────────────┴─────────────────────────────────────┘
   + Floating "Ask the Mentor" button (bottom-right) → opens chat panel
```

### Components
`DashboardHeader` (static role label, **Copy Summary** (client-only clipboard), "Start New"), `SectionNav` (scroll-spy sidebar, Linear-style), result sections (#4–#7), `MentorFab` + `MentorChat` slide-over (#8). There is no Export/PDF and no role re-analysis (role is chosen once on Upload).

### Visual Hierarchy
Readiness is the hero (top, largest, gradient border). Order descends by decision value: Readiness → Health → Gap → Roadmap. Mentor is always reachable (sidebar item + floating button) — it's the wow feature.

### User Flow
Lands post-analysis. Scroll or click nav to jump. **Copy Summary** serializes `analysisResult` to plain text and writes it to the clipboard (toast confirms) — no backend call, no PDF. "Start New" resets to Upload. Mentor reachable anytime. (Role is fixed for the session; no re-analysis.)

### Mobile Design
Sidebar collapses into a horizontal scroll-spy chip bar under the header (sticky). Sections stack full-width. MentorFab stays bottom-right; opens full-screen chat sheet.

### Empty State
Should never be empty (gated on `analysisResult`). If user deep-links without data → friendly redirect card: "No analysis yet — let's start." → `/upload`.

### Loading State
Re-analysis (role switch): content area shows skeleton cards (gauge skeleton, bar skeletons) while sidebar/header stay. First load handled by Upload page progress.

### Error State
Section-level: if a re-analyze fails, content shows ErrorBanner with Retry; previously loaded data (in `sessionStorage` mirror) remains visible underneath so the screen is never blank.

---

## 4. Resume Health Report Section

### Layout
```
┌─ Resume Health Report ──────────── Overall 64 ●───┐
│  "How strong is your resume for Backend Developer?"│
│                                                    │
│  Formatting Quality            82  ●●●●●●●●○○      │
│   └ Clear sections, but inconsistent dates.        │
│     💡 Standardize dates to MMM YYYY.              │
│                                                    │
│  Impact Metrics                40  ●●●●○○○○○○      │
│   └ Only 1 of 8 bullets has a metric.              │
│     💡 Add numbers, e.g. "cut load time 40%".     │
│  … (5 dimensions total)                            │
└────────────────────────────────────────────────────┘
```

### Components
`HealthReportCard` containing 5 × `DimensionRow` (label, animated `ProgressBar` with score band color, `mono-score` number, `reason` text, `tip` with `Lightbulb` icon in an inset `--surface-2` row). Overall score badge in header.

### Visual Hierarchy
Overall badge top-right anchors the section. Each row: label (h3-ish) → bar (visual) → score (mono) → reason (secondary) → tip (info-tinted inset). Color band instantly signals weak (red) vs strong (green) dimensions — eye jumps to problems.

### User Flow
Read-only, scannable. Bars animate on scroll-into-view (stagger). Tip rows are visually distinct so users know "this is the fix." Optional: click row to highlight related skill in Skill Gap.

### Mobile Design
Rows stack; bar full-width above score. Reason + tip wrap below. Tap to expand long reasons if truncated.

### Empty State
Never empty (always 5 dimensions). If a dimension reason is unusually short, still render row.

### Loading State
5 skeleton rows: grey label block + shimmer bar + number placeholder.

### Error State
If `resumeHealth` missing from payload (schema guard), show inline "Couldn't load health report" + Retry within the card; other sections unaffected.

---

## 5. Career Readiness Section (HERO)

### Layout
```
┌─ Career Readiness ════════════════════ (gradient border) ┐
│                                                          │
│        ╭───────────╮     Strengths                       │
│        │    68     │     ✓ Solid JavaScript fundamentals │
│        │  / 100    │     ✓ Has a real API project        │
│        │ ◜gauge◝   │                                      │
│        ╰───────────╯     Weaknesses                       │
│      "You're on track"   ✗ No database experience        │
│                          ✗ Few quantified achievements    │
│                                                          │
│  Recommended next actions                                │
│  → Build one MongoDB CRUD project                        │
│  → Add metrics to 3 resume bullets                       │
│  [ Ask the Mentor about my readiness → ]                 │
└──────────────────────────────────────────────────────────┘
```

### Components
`ReadinessCard` (featured, gradient border), `ScoreGauge` (large circular SVG, gradient stroke, count-up number, qualitative label below: <50 "Early" / 50–79 "On track" / 80+ "Interview-ready"), `StrengthsList` (success ticks), `WeaknessesList` (danger marks), `NextActionsList` (arrow CTAs), inline `Ask the Mentor` button (deep-links chat with prefilled "Am I ready for internships?").

### Visual Hierarchy
The big gauge number is the single most important pixel in the product. Gradient border + count-up animation make it the centerpiece. Strengths/weaknesses flank it; next actions form the conversion to the Mentor.

### User Flow
Auto-animates gauge on load (the "wow"). "Ask the Mentor about my readiness" opens chat pre-seeded → bridges insight to conversation.

### Mobile Design
Gauge centered on top, full-width. Strengths/weaknesses stack below in two collapsible groups. Next actions full-width. CTA sticky within card.

### Empty State
N/A (score always present). For score `0` edge case, gauge shows 0 with "Just getting started" + emphasize next actions.

### Loading State
Gauge skeleton (grey ring) + 2-line skeleton lists. Number placeholder pulses.

### Error State
If readiness missing, card shows "Readiness unavailable" + Retry; rest of dashboard still usable.

---

## 6. Skill Gap Section

### Layout
```
┌─ Skill Gap · Backend Developer ───────── 3/7 matched ─┐
│                                                       │
│  Required skills                                      │
│  [✓ Node.js] [✓ Express.js] [✓ Git]                  │  ← have chips (green)
│  [✗ REST APIs] [✗ MongoDB] [✗ SQL] [✗ Authentication]│  ← missing chips (red)
│                                                       │
│  ⚡ Quick wins        🎯 Long-term                     │
│  REST APIs, Auth      MongoDB, SQL                    │
│                                                       │
│  Recommendations (evidence-based)                     │
│  ┌──────────────────────────────────────────────┐    │
│  │ ✗ MongoDB                                      │    │
│  │ Build one MongoDB CRUD project. Your           │    │
│  │ E-commerce API can store products & orders.    │    │
│  └──────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

### Components
`SkillGapCard`, `MatchSummary` (X/Y matched + progress ring), `SkillChip` (✅ green / ❌ red, `CheckCircle2`/`XCircle`), `PriorityGroups` (Quick wins ⚡ / Long-term 🎯), `RecommendationCard` list (one per missing skill, references resume evidence). Header shows match ratio.

### Visual Hierarchy
The ✅/❌ chip grid is the signature "this isn't ChatGPT" visual — bold, scannable, color-coded. Recommendation cards below give the evidence-based payoff. Quick-wins highlighted to create momentum.

### User Flow
Scan chips → see what's missing → read specific recommendations. Each recommendation card has subtle "Ask Mentor" affordance ("How do I learn this?") that opens chat seeded with that skill.

### Mobile Design
Chips wrap in a flex grid. Priority groups stack. Recommendation cards full-width, swipeable feel. Tap chip → scrolls to its recommendation.

### Empty / Edge States
- **All matched (rare):** celebratory state — confetti micro-animation, "You meet all required skills! Focus on projects & metrics." (still shows nice-to-haves if available).
- **None matched:** all red — frame positively: "Here's your starting path" + emphasize quick wins.

### Loading State
Chip skeletons (rounded grey pills) + 2 recommendation skeleton cards.

### Error State
If `skillGap` missing, inline "Couldn't load skill gap" + Retry. Chips degrade gracefully from `matchObject` if recommendations fail.

---

## 7. Roadmap Section

### Layout
```
┌─ Your Roadmap · 24 weeks (fixed) ──────────┐
│                                                │
│   ●─── Week 1–4 ── REST APIs                    │
│   │    Refactor E-commerce API to REST          │
│   │    📚 MDN REST design                        │
│   │                                             │
│   ●─── Week 5–10 ── MongoDB                      │
│   │    Add MongoDB persistence                   │
│   │    📚 MongoDB University M001                 │
│   │                                             │
│   ●─── Week 11–16 ── Authentication              │
│   ●─── Week 17–24 ── SQL                          │
└─────────────────────────────────────────────────┘
```

### Components
`RoadmapCard`, vertical `Timeline` of `MilestoneCard`s (node dot + connecting line, `phase` label e.g. "Week 1-4", skill badge linking to its `gapAddressed`, `project` task, `resource` with `BookOpen` icon). Each milestone tagged with the gap it closes. Roadmap is a bare `RoadmapMilestone[]`, fixed 24 weeks (no duration control).

### Visual Hierarchy
Vertical timeline guides the eye top→bottom = now→future. Skill badges color-coded to match Skill Gap section. Project (the action) is bold; resource is secondary. The connecting line conveys progression/journey.

### User Flow
Read sequentially. Change duration → loading → roadmap re-renders (milestone count adapts). Each milestone: "Ask Mentor about this step" affordance.

### Mobile Design
Timeline stays vertical (natural for mobile). Milestone cards full-width with left rail line. Duration selector becomes a horizontal scrollable segment.

### Empty State
If no missing skills → "You've closed the major gaps! Next: polish projects and prep interviews." (timeline replaced by 1–2 advisory cards).

### Loading State
3–4 milestone skeletons with node dots + shimmer lines.

### Error State
If roadmap missing, inline "Couldn't build roadmap" + Retry; rest intact.

---

## 8. AI Mentor Chat (THE WOW FACTOR)

### Layout (slide-over panel, desktop) / (full-screen sheet, mobile)
```
┌─ Sparkles  AI Career Mentor ───────────── ✕ ─┐
│  Grounded in your resume · Backend Developer  │  ← context strip
├───────────────────────────────────────────────┤
│                                               │
│  ◆ Mentor:  Hi! I've reviewed your resume for │  ← intro, left bubble
│   Backend Developer. Your readiness is 68.     │
│   Ask me anything about your path.             │
│                                               │
│                    You: Am I ready? ▸          │  ← right bubble (brand)
│                                               │
│  ◆ Mentor: Your readiness is 68. You're ready │
│   for frontend-leaning internships now, but    │
│   for backend close MongoDB & Auth first…      │
│   [● ● ●  typing]                              │
├───────────────────────────────────────────────┤
│  Suggested: [What do I learn next?]            │  ← chips
│             [Can I be backend-ready in 6mo?]   │
│  ┌───────────────────────────────┐  [ ➤ Send ]│
│  │ Ask your mentor…              │            │
│  └───────────────────────────────┘            │
└───────────────────────────────────────────────┘
```

### Components
`MentorChat` panel, `ContextStrip` (shows grounding: role + readiness, builds trust that answers are personal), `MessageBubble` (mentor=left/surface, user=right/brand-gradient), `TypingIndicator` (3-dot pulse), `SuggestedQuestions` chips (from PRD examples + `suggestedFollowups` from responses), `ChatInput` (auto-grow textarea, Enter to send, Shift+Enter newline, 500-char counter), `Composer` send button.

### Visual Hierarchy
Conversation is the focus. The context strip at top is the credibility cue ("grounded in YOUR resume"). Suggested chips lower friction and double as the demo script. User bubbles use brand gradient to feel premium.

### User Flow
Open via FAB / sidebar / section deep-links (pre-seeds a question). Type or tap a chip → optimistic user bubble → typing indicator (cosmetic loader shown while awaiting) → full `answer` rendered when the single non-streaming response resolves → new `suggestedFollowups` chips appear. History kept in `AppContext` (sent each turn per stateless API).

### Mobile Design
Full-screen sheet sliding up. Sticky input above keyboard. Chips horizontally scrollable above input. Context strip condenses to "Grounded · Backend · 68".

### Empty State (first open)
Warm mentor greeting referencing their data (target role + readiness score; **never a name** — there is no name field) + 3 suggested questions. Makes the first interaction effortless and shows grounding immediately.

### Loading State
Per-message: typing 3-dot indicator in a mentor bubble. If response > 8s: "Thinking through your roadmap…" micro-copy. Input disabled while awaiting (prevents double-send).

### Error States
- **`AI_TIMEOUT`/502:** mentor bubble becomes "I couldn't reach my thoughts just now." + inline Retry on that message (resends last question).
- **Validation (empty/too long):** input border red + counter turns red at 500.
- **Network drop:** banner "Reconnecting…"; queued message preserved in input.

---

## Appendix A — Tailwind Token Setup (excerpt)
```js
// tailwind.config.js (theme.extend)
colors: {
  brand: { 400:'#818CF8',500:'#6366F1',600:'#4F46E5' },
  surface: { DEFAULT:'#FAFAFB', 2:'#F4F4F6' },
  ink: { DEFAULT:'#16181D', soft:'#5B6068', muted:'#8A8F98' },
  success:'#16A34A', warning:'#D97706', danger:'#DC2626', info:'#0EA5E9',
},
borderRadius: { xl:'12px','2xl':'16px' },
boxShadow: {
  card:'0 1px 2px rgba(16,18,29,.04),0 1px 3px rgba(16,18,29,.06)',
  cardHover:'0 4px 12px rgba(16,18,29,.08),0 2px 4px rgba(16,18,29,.04)',
},
fontFamily: { sans:['Inter','system-ui','sans-serif'], mono:['JetBrains Mono','monospace'] },
```

## Appendix B — Component → Screen Map
| Component | Screens |
|-----------|---------|
| `Button`, `Card`, `Loader`, `ErrorBanner`, `ScoreGauge` | global |
| `FileDropzone`, `RoleSelector` | Upload |
| `DashboardHeader`, `SectionNav`, `MentorFab` | Dashboard |
| `HealthReportCard` + `DimensionRow`, `ProgressBar` | Health |
| `ReadinessCard`, `ScoreGauge`, Strengths/Weakness/NextActions lists | Readiness |
| `SkillGapCard`, `SkillChip`, `RecommendationCard`, `PriorityGroups` | Skill Gap |
| `RoadmapCard`, `Timeline`, `MilestoneCard` | Roadmap |
| `MentorChat`, `MessageBubble`, `TypingIndicator`, `SuggestedQuestions`, `ChatInput`, `ContextStrip` | Mentor |

## Appendix C — Accessibility & Polish Checklist
- WCAG-AA contrast on all text (verified for score bands on surfaces).
- All score colors paired with an icon/label (never color alone) — colorblind-safe.
- Keyboard: full tab order, focus rings, Enter/Esc in chat, `/` focuses chat input.
- `prefers-reduced-motion` disables transforms.
- Loading = skeletons (not spinners) wherever layout is known.
- Every error is recoverable (Retry) and never shows a stack trace.
- Empty states always offer a next action.

*End of Document.*
