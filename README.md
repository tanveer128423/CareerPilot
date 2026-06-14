# 🧭 CareerPilot

> Your AI-powered career copilot — from resume to dream role.
> Check it out here - https://career-pilot-rust-tau.vercel.app/

CareerPilot is an **evidence-based AI career copilot** for students and fresh
graduates. Upload your resume, pick a target role, and instantly get a
**Resume Health Report**, a **Career Readiness Score**, an **evidence-backed
Skill Gap analysis**, a **personalized Career Roadmap**, and an **AI Career
Mentor** you can chat with.

What makes it different from "ChatGPT for careers": **every recommendation is
grounded** in your real resume compared against a curated role–skill dataset.
No vague advice — only specific, actionable next steps backed by evidence.

**Three principles:** `deterministic · grounded · evidence-based`

---

## ✨ Features

- 📄 **Resume parsing** — PDF / DOCX upload, text extraction, and structured
  parsing into skills, experience, and projects.
- 📊 **Skill Gap analysis** — deterministic matching of your skills against
  real role requirements (matched / missing / nice-to-have).
- 🩺 **Resume Health Report** — actionable feedback on your resume's quality.
- 🎯 **Career Readiness Score** — a 0–100 score showing how ready you are.
- 🗺️ **Personalized Roadmap** — what to learn and build next, in priority order.
- 🤖 **AI Career Mentor** — grounded, conversational guidance about next steps.
- 🛟 **Demo Mode** — pre-baked, network-free results for reliable demos.

**Supported roles:** Frontend Developer · Backend Developer · Full Stack
Developer · React Developer · Node.js Developer · Software Engineer Intern.

---

## 🏗️ Tech Stack

| Layer    | Stack |
|----------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router |
| Backend  | Node.js, Express, TypeScript, AJV validation |
| AI       | Google Gemini (`@google/generative-ai`) |
| Parsing  | `pdf-parse`, `mammoth` (DOCX) |
| Testing  | Vitest, Testing Library, Supertest |

The backend is **stateless** — no database, no stored user data.

---

## 📁 Project Structure

```
CareerPilot/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/         # Landing, Upload, Dashboard
│       ├── components/     # UI components (upload, dashboard, mentor, common)
│       ├── hooks/          # useAnalysis, useMentorChat
│       ├── api/            # API client
│       └── demo/           # Demo Mode fixtures
├── server/          # Express + TypeScript API
│   └── src/
│       ├── controllers/    # health, roles, parse, analyze, mentor
│       ├── services/       # parsing, matching, readiness, roadmap, mentor
│       ├── data/           # roles.json, skillAliases.json
│       ├── middleware/     # upload, error handling
│       └── utils/          # validators, logger, apiKey, jsonGuard
└── *.md             # README, PITCH
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Google Gemini API key — https://aistudio.google.com/app/apikey

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # then add your GEMINI_API_KEY
npm run dev               # starts on http://localhost:8080
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env      # defaults work for local dev
npm run dev               # starts on http://localhost:5173
```

Open http://localhost:5173 and upload a resume.

> 💡 Users can also **bring their own Gemini key** in the UI — it's sent via the
> `X-Gemini-Api-Key` header and is never logged or stored.

---

## ⚙️ Environment Variables

### `server/.env`
| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | optional* | Gemini API key (\*or supplied per-request by the user) |
| `PORT` | no | Server port (default `8080`) |
| `ALLOWED_ORIGIN` | no | CORS allow-list origin (default `http://localhost:5173`) |
| `GEMINI_MODEL` | no | Override model (default `gemini-2.5-flash`) |

### `client/.env`
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:8080`) |
| `VITE_DEMO_MODE` | `true` serves pre-baked offline results |

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Health check |
| `GET`  | `/roles`  | Supported roles + skill requirements |
| `POST` | `/parse`  | Upload resume → structured resume (multipart) |
| `POST` | `/analyze`| Structured resume + role → full analysis |
| `POST` | `/mentor` | Grounded mentor chat (non-streaming) |
| `POST` | `/extract-role` | Pasted job description → structured custom role |
| `POST` | `/validate-key` | Verify a user-supplied Gemini API key |

---

## 🧪 Testing

```bash
cd server && npm test     # 76 tests
cd client && npm test     # 27 tests
```

---

## 🏗️ Build

```bash
cd server && npm run build && npm start
cd client && npm run build && npm run preview
```

---

## 📚 Documentation

- [`PITCH.md`](./PITCH.md) — Judge one-pager (problem, moat, demo proof points)
- [`server/TESTING.md`](./server/TESTING.md) — Manual & automated testing guide

---

## 🔒 Security

- The backend is **stateless** — no resume data or chat history is persisted.
- API keys are **never logged or stored**; per-request keys are used only to
  construct the Gemini client for that request.
- Never commit your `.env` — only `.env.example` belongs in version control.

