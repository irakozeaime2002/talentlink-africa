# TalentLink Africa

> AI-powered talent screening platform built for the **Umurava AI Hackathon 2026** — "AI Products for the Human Resources Industry"

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://linkafrica.vercel.app |
| Backend API | https://talentlink-africa.onrender.com/api |

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Recruiter | nadine@gmail.com | 123456 |
| Applicant | jacky@gmail.com | 123456 |

> Both accounts contain dummy data for testing — jobs, candidates, applications, and screening results are pre-loaded.

---

## Problem Statement

Recruiters today face two major challenges:

1. **High application volumes** that significantly increase time-to-hire
2. **Difficulty objectively comparing candidates** across diverse profiles and formats

**The Challenge:**

How can AI be used to accurately, transparently, and efficiently screen and shortlist job applicants across both structured talent profiles and unstructured resumes while preserving human-led hiring decisions?

**Our Solution:**

TalentLink Africa uses Google Gemini AI to automatically screen and rank job applicants, supporting both:
- **Structured talent profiles** (Umurava platform schema)
- **Unstructured inputs** (CSV uploads, PDF resumes)

Humans remain in control of all final hiring decisions.

---

## Product Scope & Usage Scenarios

### Scenario 1: Screening Applicants from Umurava Platform

**Input:**
- Job details (role, requirements, skills, experience)
- Structured talent profiles following Umurava schema

**AI Responsibilities:**
- Analyze all applicants against job criteria
- Score and rank candidates using weighted dimensions
- Generate a ranked shortlist (Top 10 or Top 20)
- Provide clear reasoning for each shortlisted candidate

**Constraints:**
- Strictly follows Umurava Talent Profile Schema
- AI output is fully explainable with strengths, gaps, and relevance

### Scenario 2: Screening Applicants from External Job Boards

**Input:**
- Manually entered job details
- Uploaded spreadsheet (CSV / Excel)
- Resume links or PDF uploads

**AI Responsibilities:**
- Parse resumes and applicant data
- Match applicants to job requirements
- Rank and shortlist Top 10 or 20 candidates
- Generate explainable reasoning per candidate

---

## Umurava Talent Profile Schema

TalentLink Africa fully implements the Umurava standardized talent profile schema:

### Core Profile Fields
```typescript
{
  // Basic Information
  firstName: string;
  lastName: string;
  name: string;              // Full name (firstName + lastName)
  email: string;
  headline: string;          // Professional tagline (e.g., "Backend Engineer – Node.js & AI Systems")
  bio: string;               // Professional biography
  location: string;          // Current city and country
  
  // Skills (40% weight in AI scoring)
  skills: [
    {
      name: string;                                    // Skill name (e.g., "Node.js")
      level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
      yearsOfExperience: number;                       // Years practicing this skill
    }
  ];
  
  // Languages
  languages: [
    {
      name: string;                                    // Language name
      proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
    }
  ];
  
  // Work Experience (30% weight in AI scoring)
  experience: [
    {
      company: string;
      role: string;                                    // Job title
      startDate: string;                               // ISO date or "YYYY-MM"
      endDate: string;                                 // ISO date, "YYYY-MM", or "Present"
      description: string;                             // Responsibilities and achievements
      technologies: string[];                          // Tech stack used
      isCurrent: boolean;                              // Currently working here
    }
  ];
  
  // Education (10% weight in AI scoring)
  education: [
    {
      institution: string;                             // University/school name
      degree: string;                                  // Degree type (e.g., "Bachelor's")
      fieldOfStudy: string;                            // Major/field (e.g., "Computer Science")
      startYear: number;
      endYear: number;                                 // Or expected graduation year
    }
  ];
  
  // Professional Certifications
  certifications: [
    {
      name: string;                                    // Certification name
      issuer: string;                                  // Issuing organization
      issueDate: string;                               // ISO date or "YYYY-MM"
    }
  ];
  
  // Portfolio Projects (20% weight in AI scoring)
  projects: [
    {
      name: string;                                    // Project name
      description: string;                             // What was built and impact
      technologies: string[];                          // Tech stack
      role: string;                                    // Your role in the project
      link: string;                                    // GitHub, live demo, or portfolio URL
      startDate: string;                               // ISO date or "YYYY-MM"
      endDate: string;                                 // ISO date, "YYYY-MM", or empty if ongoing
    }
  ];
  
  // Availability
  availability: {
    status: "Available" | "Open to Opportunities" | "Not Available";
    type: "Full-time" | "Part-time" | "Contract";
    startDate: string;                                 // When available to start
  };
  
  // Social & Professional Links
  socialLinks: {
    [platformName: string]: string;                    // Dynamic key-value pairs
    // Examples: "LinkedIn", "GitHub", "Portfolio", "Twitter", etc.
  };
  
  // Documents
  cv_filename: string;                                 // Uploaded CV filename
  cv_data: string;                                     // CV text content (parsed)
  
  // Metadata
  source: "profile" | "csv" | "resume";               // How candidate was added
  recruiter_id: ObjectId;                              // Who added this candidate
  job_id: ObjectId;                                    // Associated job (if any)
}
```

### Schema Compliance

✅ **All fields are stored in MongoDB** using Mongoose schemas  
✅ **Frontend forms** collect structured data matching the schema  
✅ **AI screening** reads all schema fields for accurate matching  
✅ **Seed data** (`/api/seed/candidates`) generates 10 dummy profiles following this schema  
✅ **CSV/Resume uploads** are parsed and mapped to this schema  

---

## Functional Requirements

The application provides a complete recruiter-facing interface that supports:

✅ **Job Creation and Editing** — Full CRUD operations for job listings  
✅ **Applicant Ingestion** — Structured profiles, CSV/XLSX uploads, PDF resume parsing  
✅ **AI-Based Screening Trigger** — One-click screening with candidate selection  
✅ **Ranked Shortlist Viewing** — Top 10/20 candidates with scores and rankings  
✅ **AI-Generated Reasoning** — Detailed explanation per candidate (strengths, gaps, recommendation)  
✅ **Application Management** — Status tracking (pending → reviewed → shortlisted → rejected)  
✅ **Screening History** — View and manage past screening runs per job  
✅ **Public Job Board** — Applicants can browse and apply without recruiter intervention  

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
- **Share Job** — Copy job link to share with potential candidates

### For Applicants
- **Job Board** — Browse all open jobs publicly; filter and view full job details
- **Structured Applications** — Submit applications with skills, experience, education, projects, cover letter, custom Q&A answers, and required documents
- **Profile Auto-attach** — Professional profile (filled once) auto-attaches to all applications
- **Edit Applications** — Edit submitted applications before the job deadline while status is still "pending"
- **My Applications** — Track all submitted applications and their current status in one place

### AI Screening Engine
- **Gemini AI Integration** — Uses `gemini-flash-latest` with automatic fallback through 5 models on quota/availability errors
- **Multi-model Fallback** — `gemini-flash-latest` → `gemini-pro-latest` → `gemini-3-flash-preview` → `gemini-2.0-flash-lite` → `gemini-2.5-flash-lite`
- **Timeout Protection** — 30-second timeout per model attempt prevents hanging on slow/unavailable models
- **4-Dimension Scoring** — Skills (40%), Experience (30%), Projects (20%), Education (10%)
- **Deterministic Output** — Temperature set to 0 with server-side score recomputation to guarantee formula consistency
- **Explainability** — Every candidate gets strengths, gaps, a narrative reason, and a recommendation label
- **Recommendations** — Strongly Recommend / Recommend / Consider / Do Not Recommend derived strictly from score ranges
- **Document Quality Evaluation** — Uploaded documents are parsed and cross-checked against job requirements; missing or low-quality documents penalize the score
- **Document Type Validation** — AI validates that uploaded document content matches the requested type (e.g., rejects cover letter when CV is required); wrong document type results in -8 point penalty
- **Supported Document Types** — CV/Resume, Certificate, Diploma, Portfolio, Cover Letter, Transcript, and any custom document type with intelligent content validation
- **Candidate Detail Modal** — Full AI report opens in a centered portal modal covering the full viewport

### AI Chat Assistant
- **TalentLink Africa AI Assistant** — In-app chat powered by Gemini, context-aware for both recruiter and applicant workflows
- **Multi-model fallback** — Tries multiple Gemini models with exponential backoff on rate limits
- **Privacy-aware** — Never reveals AI scoring details or ranking algorithms to applicants

### Platform & UI
- **Dark Mode** — Toggle between light and dark themes, persisted in localStorage
- **Accent Color Themes** — 6 accent color options (Default, Indigo, Violet, Blue, Green, Rose) applied globally via CSS variables
- **Responsive Design** — Fully responsive across mobile, tablet, and desktop
- **Role-based Access** — Recruiter and Applicant roles with separate dashboards and protected routes
- **JWT Authentication** — 7-day token expiry with Axios interceptor for automatic header injection
- **Forgot Password** — Email-based password reset via Resend with 1-hour expiry token
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
| `/auth/forgot-password` | Public | Password reset request |
| `/auth/reset-password` | Public | Set new password via token |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                  Next.js 14 + Tailwind CSS                  │
│                    Redux Toolkit (state)                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Recruiter    │  │ Public Job   │  │ Applicant        │  │
│  │ Dashboard    │  │ Board        │  │ Dashboard        │  │
│  │ /jobs        │  │ /board       │  │ /my-applications │  │
│  │ /candidates  │  │ /board/[id]  │  │ /profile         │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                         │ Axios + JWT                       │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                        BACKEND                              │
│               Node.js + Express + TypeScript                │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────┐  │
│  │   Auth   │ │   Jobs   │ │ Candidates │ │ Screening   │  │
│  │  Routes  │ │  Routes  │ │  Routes    │ │  Routes     │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────┬──────┘  │
│                                                   │         │
│  ┌────────────────────────────────────────────────▼──────┐  │
│  │                    AI Service                         │  │
│  │  buildPrompt() → Gemini API → parseOutput()           │  │
│  │  Server-side score recomputation → ScreeningResult    │  │
│  └───────────────────────────────────────────────────────┘  │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      DATABASE                               │
│                    MongoDB Atlas                            │
│                                                             │
│   Users │ Jobs │ Candidates │ Applications │ ScreeningResults│
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     GEMINI API                              │
│         gemini-flash-latest (primary model)                 │
│   Fallback: gemini-pro-latest → gemini-3-flash-preview      │
│      → gemini-2.0-flash-lite → gemini-2.5-flash-lite        │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

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
│           ├── emailService.ts     # Resend password reset emails
│           └── parserService.ts    # PDF text extraction, CSV parsing
│
└── frontend/                       # Next.js 14 + Tailwind + Redux
    ├── app/
    │   ├── page.tsx                # Landing / Recruiter dashboard
    │   ├── about/
    │   ├── pricing/
    │   ├── contact/
    │   ├── auth/login/
    │   ├── auth/register/
    │   ├── auth/forgot-password/
    │   ├── auth/reset-password/
    │   ├── board/                  # Public job board
    │   ├── board/[id]/             # Job detail + application form
    │   ├── jobs/                   # Recruiter job management
    │   ├── jobs/[id]/              # Job detail + Applications + AI Screening tabs
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
2. Applicants register, browse, and submit structured applications with documents
3. Each application auto-creates/updates a Candidate record in the pool
4. Recruiter clicks "Screen Applicants" — matched candidates are auto-loaded for AI screening
5. Uploaded documents (CV, portfolio, certificates) are parsed and included as evidence in the AI prompt

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

Each candidate in the shortlist receives:

- **`rank`** — Position in shortlist (1 = best match)
- **`match_score`** — Weighted score 0–100 (recomputed server-side for accuracy)
- **`score_breakdown`** — Individual scores per dimension:
  - `skills` (0–100)
  - `experience` (0–100)
  - `projects` (0–100)
  - `education` (0–100)
- **`strengths[]`** — Concrete positives referencing actual skills, job titles, companies, and project names
- **`gaps[]`** — Missing required skills, missing documents, experience gaps, or other risks
- **`reason`** — 2–3 sentence narrative explaining the match
- **`recommendation`** — Label derived strictly from score range:
  - **Strongly Recommend** (80–100)
  - **Recommend** (60–79)
  - **Consider** (40–59)
  - **Do Not Recommend** (0–39)

### Example AI Output

```json
{
  "rank": 1,
  "candidate_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "match_score": 87,
  "score_breakdown": {
    "skills": 92,
    "experience": 85,
    "projects": 88,
    "education": 75
  },
  "strengths": [
    "5 years of Node.js experience with Advanced proficiency matches the Senior Backend Engineer requirement perfectly",
    "Led 3 production projects using TypeScript, MongoDB, and Express – exact tech stack for this role",
    "Bachelor's in Computer Science from University of Rwanda with AWS Certified Developer certification"
  ],
  "gaps": [
    "Missing preferred skill: Docker (mentioned in job description)",
    "No evidence of Kubernetes experience listed in preferred skills"
  ],
  "reason": "John is an excellent match with 5 years of relevant backend experience and proven expertise in the exact tech stack. His portfolio demonstrates strong problem-solving skills through 3 production-grade projects. Minor gap in containerization tools but core competencies are solid.",
  "recommendation": "Strongly Recommend"
}
```

### Prompt Engineering

The AI prompt is structured in 5 explicit steps:

**STEP 1 — Job Understanding**
The prompt injects the full job object (title, description, required skills, preferred skills, experience level, responsibilities, required documents, application questions) as JSON. Gemini is instructed to extract must-have skills, preferred skills, seniority bar, and day-to-day responsibilities before scoring.

**STEP 2 — Candidate Understanding**
Each candidate's full profile is injected: skills, experience, projects, education, certifications, CV text (from PDF parse), cover letter, application answers, and attached document texts. Documents are labeled by filename so Gemini knows what each file is.

**STEP 3 — Dimension Scoring (0–100 each)**
Gemini follows strict algorithmic rubrics — not free-form judgment:
- **Skills**: required skill match ratio × 100 + preferred skill bonuses (capped at +20)
- **Experience**: fixed seniority matrix (candidate level vs job level) + domain relevance adjustment
- **Projects**: relevance count scale (0→10, 1→50, 2→70, 3+→85) + quality bonus per project
- **Education**: fixed scale from "no data" (25) to "related degree + multiple certs" (95)
- **Documents**: AI validates both presence AND content type matching:
  - Missing required document = −10 points per document (capped at -30)
  - Wrong document type uploaded (e.g., cover letter when CV required) = −8 points
  - Low-quality content (correct type but incomplete) = −5 points
  - High-quality matching document = positive evidence across all dimensions
  - Supported types: CV/Resume, Certificate, Diploma, Portfolio, Cover Letter, Transcript, plus intelligent validation for any custom document type

**STEP 4 — Score Computation**
Gemini computes the weighted formula. The backend then **recomputes** the score independently from the breakdown to guarantee formula consistency regardless of any Gemini rounding.

**STEP 5 — Output Generation**
Strengths must reference specific skill names, job titles, companies, or project names. Gaps must list every missing required skill and every missing/low-quality required document. Reason is exactly 2–3 sentences.

**Determinism Guarantees:**
- `temperature: 0` — no randomness in Gemini output
- Server-side recomputation — scores are always recalculated from breakdown
- Re-ranking server-side — candidates are re-sorted and re-ranked after recomputation
- Structured JSON output only — no markdown, no free-form text outside JSON

### Explainability Principles
- Gemini references actual skills, job titles, and project names — no vague statements
- Missing data is explicitly flagged and scored low
- All output is structured JSON — no free-form hallucination
- Temperature set to 0; scores recomputed server-side for full determinism
- Multi-model fallback: 5 Gemini models tried sequentially with 30s timeout each
- Models verified via API: `gemini-flash-latest`, `gemini-pro-latest`, `gemini-3-flash-preview`, `gemini-2.0-flash-lite`, `gemini-2.5-flash-lite`

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key
- Resend account (for password reset emails)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, GEMINI_API_KEY, JWT_SECRET, RESEND_API_KEY
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
MONGODB_URI=my_mongodb_atlas_connection_string
GEMINI_API_KEY=my_gemini_api_key
JWT_SECRET=my_jwt_secret_key
CLIENT_URL=http://localhost:3000
RESEND_API_KEY=my_resend_api_key
RESEND_FROM=TalentLink Africa <onboarding@resend.dev>
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
| POST | /api/auth/forgot-password | Request password reset email |
| POST | /api/auth/reset-password | Reset password with token |

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
| GET | /api/candidates | List all imported candidates |
| DELETE | /api/candidates/:id | Remove single candidate |
| POST | /api/candidates/bulk-delete | Delete multiple candidates |
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
| PATCH | /api/applications/:id | Applicant | Edit application |
| PATCH | /api/applications/:id/status | Recruiter | Update status |
| DELETE | /api/applications/:id | Applicant | Cancel application |

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

| Layer | Technology | Hackathon Requirement |
|---|---|---|
| Language | **TypeScript** | ✅ Required |
| Frontend | **Next.js 14** | ✅ Required |
| State Management | **Redux Toolkit** | ✅ Required |
| Styling | **Tailwind CSS** | ✅ Required |
| Backend | **Node.js + Express** | ✅ Required |
| Database | **MongoDB Atlas** | ✅ Required |
| AI / LLM | **Google Gemini API** | ✅ Mandatory |
| Auth | JWT (bcryptjs + jsonwebtoken) | ✅ Implemented |
| Email | Resend (password reset) | ✅ Implemented |
| File Parsing | pdf-parse, xlsx | ✅ Implemented |
| Theming | CSS variables, React Context | ✅ Implemented |
| Deployment | Vercel (frontend), Render (backend) | ✅ Live |

### Gemini API Integration

**Primary Model:** `gemini-flash-latest`  
**Fallback Chain:** `gemini-pro-latest` → `gemini-3-flash-preview` → `gemini-2.0-flash-lite` → `gemini-2.5-flash-lite`  
**Temperature:** 0 (deterministic output)  
**Prompt Engineering:** 5-step structured prompt with algorithmic scoring rubrics  
**Output Format:** Structured JSON only (no markdown, no free-form text)  
**Multi-model Resilience:** Automatically tries 5 different Gemini models with 30-second timeout per model to ensure high availability

---

## Team Composition

This project was built by a team with the following roles:

### 1. Front-End Engineer
**Skills:** Advanced React/Next.js, Redux Toolkit, Tailwind CSS, Form handling, API integration  
**Responsibilities:**
- Recruiter-facing UI (job management, candidate pool, screening dashboard)
- Applicant-facing UI (job board, application forms, profile management)
- Data visualization (shortlists, score breakdowns, screening history)
- Responsive design across mobile, tablet, and desktop
- Dark mode and accent color theming

### 2. Back-End Engineer
**Skills:** Node.js with TypeScript, REST API design, MongoDB/Mongoose, JWT authentication  
**Responsibilities:**
- Business logic implementation (jobs, candidates, applications, screening)
- Data ingestion pipelines (CSV parsing, PDF text extraction)
- AI request orchestration (Gemini API integration)
- Authentication and role-based access control
- Error handling and API security

### 3. AI Software Engineer
**Skills:** LLM prompt engineering, Gemini API, Text analysis, AI explainability  
**Responsibilities:**
- Designing AI decision flow (5-step prompt structure)
- Implementing weighted scoring model (Skills 40%, Experience 30%, Projects 20%, Education 10%)
- Ensuring reliable and interpretable outputs (strengths, gaps, reasoning)
- Server-side score recomputation for determinism
- Multi-model fallback strategy
- Documenting AI assumptions and limitations

---

## Assumptions & Limitations

### AI & Screening
- PDF resume parsing extracts raw text; Gemini handles semantic interpretation
- AI screening is deterministic at temperature 0; scores are recomputed server-side after Gemini responds
- Document quality evaluation is AI-driven — Gemini interprets document content based on extracted text
- AI model availability depends on Gemini API quota; multi-model fallback handles temporary outages
- Shortlist size is configurable (Top 10 or Top 20) but defaults to Top 20

### Data Ingestion
- CSV must have columns: `name`, `email`, `skills` (comma-separated), `experience`, `certifications`
- Structured profiles from Umurava platform strictly follow the provided schema
- Resume uploads support PDF format only (other formats can be added)

### Authentication & Security
- JWT tokens expire after 7 days (refresh tokens not implemented)
- Password reset tokens expire after 1 hour
- Resend free tier only sends to verified account email; custom domain needed for production

### Privacy & Ethics
- Applicants cannot see their AI scores — only application status is exposed to preserve hiring integrity
- Humans remain in control of all final hiring decisions
- AI provides recommendations, not automated rejections

### Storage & Scale
- Resume files stored as base64 in MongoDB; AWS S3 recommended for production scale
- No file size limits enforced (should be added for production)
- Database indexes not optimized for large-scale queries (10,000+ candidates)

### Known Limitations
- No real-time notifications (email notifications only for password reset)
- No candidate communication features (messaging, interview scheduling)
- No analytics dashboard for recruiter insights
- No integration with external ATS (Applicant Tracking Systems)

---

## Deployment

### Live Application

✅ **Frontend:** https://linkafrica.vercel.app (Vercel)  
✅ **Backend API:** https://talentlink-africa.onrender.com/api (Render)  
✅ **Database:** MongoDB Atlas (cloud-hosted)  
✅ **Environment Variables:** Securely configured in hosting dashboards  
✅ **Error Handling:** Production-ready error responses  

### Deployment Instructions

### Frontend (Vercel)
```bash
cd frontend && npm run build
# Deploy to Vercel — set NEXT_PUBLIC_API_URL to your backend URL
```

### Backend (Render)
```bash
cd backend && npm run build
# Set all environment variables in the Render dashboard
# Build command: npm run build
# Start command: node dist/index.js
```

---

## Hackathon Compliance Checklist

### ✅ Mandatory Requirements
- [x] **Gemini API** used as the underlying LLM
- [x] **Prompt engineering** intentional and documented (5-step structured prompt)
- [x] **AI outputs** clean, structured, and recruiter-friendly (JSON format)
- [x] **TypeScript** used throughout (frontend + backend)
- [x] **Next.js** for frontend
- [x] **Redux Toolkit** for state management
- [x] **Tailwind CSS** for styling
- [x] **Node.js** for backend
- [x] **MongoDB** for database
- [x] **Deployed online** and accessible (Vercel + Render)

### ✅ Functional Requirements
- [x] Job creation and editing
- [x] Applicant ingestion (profiles + uploads)
- [x] AI-based screening trigger
- [x] Ranked shortlist viewing (Top 10/20)
- [x] AI-generated reasoning per candidate
- [x] Application status management

### ✅ AI Capabilities
- [x] Multi-candidate evaluation in single prompt
- [x] Weighted scoring (Skills 40%, Experience 30%, Projects 20%, Education 10%)
- [x] Natural-language explanation per candidate
- [x] Explainable AI (strengths, gaps, reasoning)
- [x] Deterministic output (temperature 0, server-side recomputation)

### ✅ Scenario Support
- [x] **Scenario 1:** Screening from Umurava Platform (structured profiles)
- [x] **Scenario 2:** Screening from External Job Boards (CSV/PDF uploads)
- [x] Umurava Talent Profile Schema compliance
- [x] Resume parsing and data ingestion

### ✅ Documentation
- [x] Clean, structured repository
- [x] Comprehensive README.md
- [x] Architecture diagram
- [x] Setup instructions
- [x] Environment variables documented
- [x] AI decision flow explained
- [x] Assumptions and limitations listed

### ✅ Code Quality
- [x] TypeScript throughout
- [x] Modular architecture (controllers, services, routes)
- [x] Error handling implemented
- [x] API security (JWT authentication, role-based access)
- [x] Clean code structure

---

