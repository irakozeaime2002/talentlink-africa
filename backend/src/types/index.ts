export interface JobInput {
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  responsibilities: string[];
}

export interface CandidateInput {
  id?: string;
  name: string;
  email?: string;
  skills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  cv_text?: string;
  cover_letter?: string;
  application_answers?: { question: string; answer: string }[];
  attached_documents?: string;
}

export interface EducationEntry {
  degree: string;
  field: string;
  institution: string;
  year?: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies?: string[];
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

export interface ScreeningOutput {
  job_summary: {
    role: string;
    key_requirements: string[];
    must_have_skills: string[];
    preferred_skills: string[];
  };
  ranking: RankedCandidate[];
}
