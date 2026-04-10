# TalentScreen AI

> AI-powered talent screening system built for the **Umurava AI Hackathon** — "AI Products for the Human Resources Industry"

## Overview

TalentScreen AI augments recruiter decision-making by automatically screening and ranking job applicants using Google Gemini AI. It supports both structured talent profiles (Umurava platform schema) and unstructured inputs (CSV uploads, PDF resumes). Humans remain in control of all final hiring decisions.

---

## Architecture

```
job_recruiter/
├── backend/                        # Node.js + TypeScript REST API
│   └── src/
│       ├── config/db.ts            # MongoDB Atlas connection
│       ├── models/
│       │   ├── User.ts             # Recruiter & Applicant accounts
│       │   ├── Job.ts              # Job listings (status, location, salary, questions)
│       │   ├── Candidate.ts        # Candidate profiles (Umurava schema)
│       │   ├── Application.ts      # Applicant submissions per job
│       │   └── ScreeningResult.ts  # AI screening output (ranked shortlists)
│       ├── controllers/
│       │   ├── authController.ts   # Register, login, profile
│       │   ├── jobController.ts    # CRUD + public board
│       │   ├── candidateController.ts  # Profile, CSV, PDF ingestion
│       │   ├── screeningController.ts  # AI screening orchestration
│       │   ├── applicationController.ts # Apply, status management
│       │   └── seedController.ts   # Umurava dummy profiles + stats
│       ├── middleware/
│       │   ├── auth.ts             # JWT authenticate + requireRole
│       │   ├── upload.ts           # Multer (PDF/CSV/XLSX)
│       │   └── errorHandler.ts
│       ├── routes/                 # Express routers
│       └── services/
│           ├── aiService.ts        # Gemini API integration + prompt engineering
│           └── parserService.ts    # PDF text extraction, CSV parsing
│
└── frontend/                       # Next.js 14 + Tailwind + Redux
    ├── app/
    │   ├── page.tsx                # Landing / Recruiter dashboard
    │   ├── auth/login/             # Sign in
    │   ├── auth/register/          # Sign up (recruiter or applicant)
    │   ├── board/                  # Public job board (applicants)
    │   ├── board/[id]/             # Job detail + application form
    │   ├── jobs/                   # Recruiter job management
    │   ├── jobs/[id]/              # Job detail + Applications + AI Screening
    │   ├── jobs/[id]/edit/         # Edit job
    │   ├── jobs/new/               # Create job
    │   ├── candidates/             # Candidate pool management
    │   ├── my-applications/        # Applicant's submitted applications
    │   └── profile/                # User profile (both roles)
    ├── components/
    │   ├── applications/ApplicationsPanel.tsx
    │   ├── candidates/CandidateSelector.tsx
    │   ├── candidates/CandidateUpload.tsx
    │   ├── jobs/JobForm.tsx
    │   ├── jobs/JobCard.tsx
    │   ├── screening/ShortlistTable.tsx
    │   ├── screening/CandidateModal.tsx
    │   └── ui/Navbar.tsx, Badge.tsx, ScoreBar.tsx, AuthLoader.tsx
    ├── store/                      # Redux Toolkit slices
    │   └── slices/auth, jobs, candidates, screening, applications
    ├── lib/api.ts                  # Axios client with JWT interceptor
    └── types/index.ts              # Shared TypeScript interfaces
```

---

## AI Decision Flow

### Scenario 1 — Umurava Platform Profiles
1. Recruiter creates a job (title, description, required/preferred skills, experience level, responsibilities, custom questions)
2. Structured candidate profiles are loaded from the Umurava talent pool (or seeded via `/api/seed/candidates`)
3. Recruiter selects candidates and triggers AI screening
4. Backend sends job + candidates to Gemini API with a documented prompt
5. Gemini evaluates each candidate and returns a ranked JSON shortlist

### Scenario 2 — External Job Board Applicants
1. Job is published to the public board (`/board`)
2. Applicants register, browse jobs, and submit structured applications (skills, experience, education, projects, cover letter, custom Q&A)
3. Each application auto-creates/updates a Candidate record in the pool
4. Recruiter clicks "Screen Applicants" — matched candidates are auto-loaded for AI screening

### Gemini Scoring Model

| Dimension | Weight | What is evaluated |
|---|---|---|
| Skills relevance | **40%** | Match between candidate skills and required + preferred skills |
| Experience relevance | **30%** | Seniority, years of experience, domain alignment |
| Projects / practical evidence | **20%** | Real-world projects demonstrating applied skills |
| Education | **10%** | Degree relevance, field alignment, institution |

**Formula:** `match_score = (skills × 0.4) + (experience × 0.3) + (projects × 0.2) + (education × 0.1)`

### AI Output Per Candidate
- `rank` — position in shortlist
- `match_score` — weighted score 0–100
- `score_breakdown` — individual scores for each dimension
- `strengths[]` — concrete positives referencing actual data
- `gaps[]` — missing requirements or risks
- `reason` — 2–4 sentence narrative explanation
- `recommendation` — Strongly Recommend | Recommend | Consider | Do Not Recommend

### Explainability Principles
- Gemini is instructed to reference actual skills, job titles, and project names — no vague statements
- Missing data is explicitly flagged as "insufficient information" and scored low
- All outputs are structured JSON — no hallucinated free-form text
- Temperature set to 0.2 for consistent, deterministic outputs

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
| GET | /api/jobs/public | None | Public job board (open jobs only) |
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

### Applications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/applications/job/:job_id | Applicant | Submit application |
| GET | /api/applications/job/:job_id | Recruiter | View applications for job |
| GET | /api/applications/my | Applicant | View own applications |
| PATCH | /api/applications/:id/status | Recruiter | Update status |

### Seed & Stats
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/seed/candidates | Load 10 Umurava dummy profiles |
| GET | /api/seed/stats | Platform statistics |

---

## Assumptions & Limitations

- PDF resume parsing extracts raw text; Gemini handles semantic interpretation
- CSV must have columns: `name`, `email`, `skills` (comma-separated), `experience`, `certifications`
- Gemini `gemini-1.5-flash` is used for cost efficiency; `gemini-1.5-pro` can be swapped for higher accuracy
- AI screening is non-deterministic at temperature > 0; set to 0.2 for consistency
- No email notifications (can be added with SendGrid/Resend)
- No resume file storage (can be added with AWS S3 or Cloudinary)
- Authentication uses JWT (7-day expiry); refresh tokens not implemented

---

## Tech Stack

| Layer | Technology |
|---|---|
| Fronutend | Next.js 14, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini API (gemini-1.5-flash) |
| Auth | JWT (bcryptjs + jsonwebtoken) |
| File Parsing | pdf-parse, xlsx |
| Deployment | Vercel (frontend), Railway/Render (backend) |

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
