export interface Job {
  _id: string;
  title: string;
  organization: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  responsibilities: string[];
  recruiter_id?: string;
  status: "open" | "closed" | "draft";
  location: string;
  salary_range: string;
  deadline?: string;
  application_questions: string[];
  required_documents: string[];
  createdAt: string;
}

export interface Candidate {
  _id: string;
  name: string;
  email?: string;
  skills: string[];
  education: { degree: string; field: string; institution: string; year?: string }[];
  experience: { title: string; company: string; duration: string; description?: string }[];
  projects: { name: string; description: string; technologies?: string[] }[];
  certifications: string[];
  source: "profile" | "csv" | "resume";
  cv_filename?: string;
  cv_data?: string;
  jobs_applied?: { _id: string; title: string }[];
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  projects: number;
}

export interface RankedCandidate {
  rank: number;
  candidate_id: string;
  name: string;
  match_score: number;
  score_breakdown: ScoreBreakdown;
  strengths: string[];
  gaps: string[];
  reason: string;
  recommendation: string;
}

export interface ScreeningResult {
  _id: string;
  job_id: string | Job;
  job_summary: {
    role: string;
    key_requirements: string[];
    must_have_skills: string[];
    preferred_skills: string[];
  };
  ranking: RankedCandidate[];
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "recruiter" | "applicant" | "admin";
  plan?: "free" | "pro" | "enterprise";
  planExpiresAt?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  residence?: string;
  father_name?: string;
  mother_name?: string;
  national_id?: string;
}

export interface Application {
  _id: string;
  job_id: string | Job;
  applicant_id: string | User;
  cover_letter: string;
  answers: { question: string; answer: string }[];
  status: "pending" | "reviewed" | "shortlisted" | "rejected";
  skills: string[];
  education: { degree: string; field: string; institution: string; year?: string }[];
  experience: { title: string; company: string; duration: string; description?: string }[];
  projects: { name: string; description: string; technologies?: string[] }[];
  certifications: string[];
  documents?: { name: string; filename: string; data?: string }[];
  createdAt: string;
}
