# TalentLink Africa

> AI-powered talent screening platform built for the **Umurava AI Hackathon** — "AI Products for the Human Resources Industry"

## Overview

TalentLink Africa helps African companies hire smarter and faster by automatically screening and ranking job applicants using Google Gemini AI. It supports both structured talent profiles (Umurava platform schema) and unstructured inputs (CSV uploads, PDF resumes). Humans remain in control of all final hiring decisions.

---

## Features

### For Recruiters
- **Job Management** — Create, edit, and delete job listings with required/preferred skills, experience level, responsibilities, salary (RWF), deadline, location, and custom screening questions
- **Public Job Board** — Published jobs appear on a public board accessible to all applicants without login
- **AI Screening** — Select candidates and trigger Gemini AI to rank and shortlist them with detailed scoring and reasoning
- **Screening History** — View all past screening runs per job, each with a ranked shortlist and AI job summary; delete old runs
- **Candidate Pool** — Manage a pool of candidates separate from job applicants; import via CSV/XLSX or PDF resume bulk upload
- **Applications Management** — View all applications per job, update application status (pending → reviewed → shortlisted → rejected)
- **Screen Applicants CTA** — One-click shortcut to screen all applicants who applied to a specific job

### For Applicants
- **Job Board** — Browse all open jobs publicly; filter and view full job details
- **Structured Applications** — Submit applications with skills, experience, education, projects, cover letter, and custom Q&A answers
- **Profile Auto-attach** — Professional profile (filled once) auto-attaches to all applications
- **Edit Applications** — Edit submitted applications before the job deadline while status is still "pending"
- **My Applications** — Track all submitted applications and their current status in one place

### AI Screening Engine
- **Gemini AI Integration** — Uses `gemini-2.5-flash` with automatic fallback through multiple models on quota/availability errors
- **4-Dimension Scoring** — Skills (40%), Experience (30%), Projects (20%), Education (10%)
- **Deterministic Output** — Temperature set to 0 with server-side score recomputation to guarantee formula consistency
- **Explainability** — Every candidate gets strengths, gaps, a narrative reason, and a recommendation label
- **Recommendations** — Strongly Recommend / Recommend / Consider / Do Not Recommend derived strictly from score ranges
- **Candidate Detail Modal** — Full AI report opens in a centered portal modal (covers full viewport on any screen size)

### AI Chat Assistant
- **TalentLink Africa AI Assistant** — In-app chat powered by Gemini, context-aware for both recruiter and applicant workflows
- **Multi-model fallback** — Tries `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash` with exponential backoff on rate limits
- **Privacy-aware** — Never reveals AI scoring details or ranking algorithms to applicants

### Platform & UI
- **Dark Mode** — Toggle between light and dark themes, persisted in localStorage
- **Accent Color Themes** — 6 accent color options (Default, Indigo, Violet, Blue, Green, Rose) applied globally via CSS variables
- **Responsive Design** — Fully responsive across mobile, tablet, and desktop
- **Role-based Access** — Recruiter and Applicant roles with separate dashboards and protected routes
- **JWT Authentication** — 7-day token expiry with Axios interceptor for automatic header injection
- **Seed Data** — Load 10 Umurava dummy candidate profiles instantly via `/api/seed/candidates`
- **Platform Stats** — Live stats endpoint at `/api/seed/stats`

### Pages
| Page | Access | Description |
|---|---|---|
| `/` | Public | Landing / Recruiter dashboard |
| `/board` | Public | Public job board |
| `/board/[id]` | Public | Job detail + application form |
| `/jobs` | Recruiter | Job management list |
| `/jobs/new` | Recruiter | Create job |
| `/jobs/[id]` | Auth | Job detail with Applications, AI Screening, and History tabs |
| `/jobs/[id]/edit` | Recruiter | Edit job |
| `/candidates` | Recruiter | Candidate pool management |
| `/my-applications` | Applicant | Submitted applications tracker |
| `/profile` | Auth | User profile (both roles) |
| `/about` | Public | About TalentLink Africa |
| `/pricing` | Public | Free / Pro / Enterprise plans |
| `/contact` | Public | Contact form + FAQ |

---

## Architecture

```
job_recruiter/
├── backend/                        # Node.js + TypeScript REST API
│   └── src/
│       ├── config/db.ts            # MongoDB Atlas connection
│       ├── models/
│       │   ├── User.ts             # Recruiter & Applicant accounts
│       │   ├── Job.ts              # Job listings
│       │   ├── Candidate.ts        # Candidate profiles (Umurava schema)
│       │   ├── Application.ts      # Applicant submissions per job
│       │   └── ScreeningResult.ts  # AI screening output (ranked shortlists)
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── jobController.ts
│       │   ├── candidateController.ts
│       │   ├── screeningController.ts
│       │   ├── applicationController.ts
│       │   ├── chatController.ts   # AI chat assistant
│       │   └── seedController.ts
│       ├── middleware/
│       │   ├── auth.ts             # JWT authenticate + requireRole
│       │   ├── upload.ts           # Multer (PDF/CSV/XLSX)
│       │   └── errorHandler.ts
│       ├── routes/
│       └── services/
│           ├── aiService.ts        # Gemini screening + multi-model fallback
│           └── parserService.ts    # PDF text extraction, CSV parsing
│
└── frontend/                       # Next.js 14 + Tailwind + Redux
    ├── app/
    │   ├── page.tsx                # Landing / Recruiter dashboard
    │   ├── about/                  # About page
    │   ├── pricing/                # Pricing plans
    │   ├── contact/                # Contact form
    │   ├── auth/login/
    │   ├── auth/register/
    │   ├── board/                  # Public job board
    │   ├── board/[id]/             # Job detail + application form
    │   ├── jobs/                   # Recruiter job management
    │   ├── jobs/[id]/              # Job detail + Applications + AI Screening tabs
    │   ├── jobs/[id]/edit/
    │   ├── jobs/new/
    │   ├── candidates/             # Candidate pool
    │   ├── my-applications/        # Applicant's applications
    │   └── profile/
    ├── components/
    │   ├── applications/ApplicationsPanel.tsx
    │   ├── candidates/CandidateSelector.tsx
    │   ├── candidates/CandidateUpload.tsx
    │   ├── jobs/JobForm.tsx
    │   ├── jobs/JobCard.tsx
    │   ├── screening/ShortlistTable.tsx
    │   ├── screening/CandidateModal.tsx  # Full-viewport portal modal
    │   └── ui/Navbar.tsx, Badge.tsx, ScoreBar.tsx, AuthLoader.tsx, ThemeControls.tsx, Footer.tsx
    ├── context/ThemeContext.tsx    # Dark mode + accent color
    ├── store/slices/               # Redux Toolkit: auth, jobs, candidates, screening, applications
    ├── lib/api.ts                  # Axios client with JWT interceptor
    └── types/index.ts
```

---

## AI Decision Flow

### Scenario 1 — Umurava Platform Profiles
1. Recruiter creates a job with skills, experience level, responsibilities, and custom questions
2. Structured candidate profiles are loaded from the talent pool (or seeded via `/api/seed/candidates`)
3. Recruiter selects candidates and triggers AI screening
4. Backend sends job + candidates to Gemini with a strict deterministic prompt
5. Gemini returns a ranked JSON shortlist; scores are recomputed server-side to guarantee formula accuracy

### Scenario 2 — External Job Board Applicants
1. Job is published to `/board`
2. Applicants register, browse, and submit structured applications
3. Each application auto-creates/updates a Candidate record in the pool
4. Recruiter clicks "Screen Applicants" — matched candidates are auto-loaded for AI screening

### Gemini Scoring Model

| Dimension | Weight | What is evaluated |
|---|---|---|
| Skills relevance | **40%** | Match between candidate skills and required + preferred skills |
| Experience relevance | **30%** | Seniority, years of experience, domain alignment |
| Projects / practical evidence | **20%** | Real-world projects demonstrating applied skills |
| Education | **10%** | Degree relevance, field alignment, certifications |

**Formula:** `match_score = (skills × 0.4) + (experience × 0.3) + (projects × 0.2) + (education × 0.1)`

### Recommendation Thresholds
| Score | Recommendation |
|---|---|
| 80–100 | Strongly Recommend |
| 60–79 | Recommend |
| 40–59 | Consider |
| 0–39 | Do Not Recommend |

### AI Output Per Candidate
- `rank` — position in shortlist
- `match_score` — weighted score 0–100 (recomputed server-side)
- `score_breakdown` — individual scores per dimension
- `strengths[]` — concrete positives referencing actual skills, titles, and project names
- `gaps[]` — missing requirements or risks
- `reason` — 2–3 sentence narrative
- `recommendation` — label derived strictly from score range

### Explainability Principles
- Gemini references actual skills, job titles, and project names — no vague statements
- Missing data is explicitly flagged and scored low
- All output is structured JSON — no free-form hallucination
- Temperature set to 0; scores recomputed server-side for full determinism
- Multi-model fallback: `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.0-flash-001` → `gemini-pro-latest`

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, GEMINI_API_KEY, JWT_SECRET
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

### Frontend `.env`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register (recruiter or applicant) |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/me | Update profile |

### Jobs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/jobs/public | None | Public job board |
| GET | /api/jobs/public/:id | None | Public job detail |
| POST | /api/jobs | Recruiter | Create job |
| GET | /api/jobs | Recruiter | List own jobs |
| GET | /api/jobs/:id | Auth | Get job |
| PUT | /api/jobs/:id | Recruiter | Update job |
| DELETE | /api/jobs/:id | Recruiter | Delete job |

### Candidates
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/candidates | Create profile |
| GET | /api/candidates | List all |
| DELETE | /api/candidates/:id | Remove |
| POST | /api/candidates/upload/csv | Upload CSV/XLSX |
| POST | /api/candidates/upload/resumes | Upload PDF resumes |

### Screening
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/screening | Run AI screening |
| GET | /api/screening/job/:job_id | Get all results for a job |
| GET | /api/screening/:id | Get single result |
| DELETE | /api/screening/:id | Delete screening result |

### Applications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/applications/job/:job_id | Applicant | Submit application |
| GET | /api/applications/job/:job_id | Recruiter | View applications for job |
| GET | /api/applications/my | Applicant | View own applications |
| PATCH | /api/applications/:id/status | Recruiter | Update status |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/chat | Send message to AI assistant |

### Seed & Stats
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/seed/candidates | Load 10 Umurava dummy profiles |
| GET | /api/seed/stats | Platform statistics |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini API (gemini-2.5-flash + fallback chain) |
| Auth | JWT (bcryptjs + jsonwebtoken, 7-day expiry) |
| File Parsing | pdf-parse, xlsx |
| Theming | CSS variables, React Context (dark mode + 6 accent colors) |
| Deployment | Vercel (frontend), Railway/Render (backend) |

---

## Assumptions & Limitations

- PDF resume parsing extracts raw text; Gemini handles semantic interpretation
- CSV must have columns: `name`, `email`, `skills` (comma-separated), `experience`, `certifications`
- AI screening is deterministic at temperature 0; scores are recomputed server-side after Gemini responds
- No email notifications (can be added with SendGrid/Resend)
- No resume file storage (can be added with AWS S3 or Cloudinary)
- Refresh tokens not implemented (JWT 7-day expiry only)
- Applicants cannot see their AI scores — only application status is exposed

---

## Deployment

### Frontend (Vercel)
```bash
cd frontend && npm run build
# Deploy to Vercel — set NEXT_PUBLIC_API_URL to your backend URL
```

### Backend (Railway / Render)
```bash
cd backend && npm run build
# Set all environment variables in the hosting dashboard
# Start command: node dist/index.js
```
