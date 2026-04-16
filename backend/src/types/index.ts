export interface JobInput {
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  responsibilities: string[];
  required_documents?: string[];
  application_questions?: string[];
}

export interface CandidateInput {
  id?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: SkillEntry[];
  languages?: LanguageEntry[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  availability?: AvailabilityEntry;
  socialLinks?: { linkedin?: string; github?: string; portfolio?: string; [key: string]: string | undefined };
  cv_text?: string;
  cover_letter?: string;
  application_answers?: { question: string; answer: string }[];
  attached_documents?: string;
}

export interface SkillEntry {
  name: string;
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience?: number;
}

export interface LanguageEntry {
  name: string;
  proficiency?: "Basic" | "Conversational" | "Fluent" | "Native";
}

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  isCurrent?: boolean;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies?: string[];
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface AvailabilityEntry {
  status?: "Available" | "Open to Opportunities" | "Not Available";
  type?: "Full-time" | "Part-time" | "Contract";
  startDate?: string;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  projects: number;
  documents?: number;  // Document quality score
  answers?: number;    // Application answers quality score
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
