import { Schema, model, Document } from "mongoose";

export interface ICandidate extends Document {
  // Basic Info
  firstName: string;
  lastName: string;
  name: string; // kept for backward compat (firstName + lastName)
  email?: string;
  headline?: string;
  bio?: string;
  location?: string;

  // Skills & Languages
  skills: { name: string; level?: "Beginner" | "Intermediate" | "Advanced" | "Expert"; yearsOfExperience?: number }[];
  languages?: { name: string; proficiency?: "Basic" | "Conversational" | "Fluent" | "Native" }[];

  // Experience
  experience: {
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    technologies?: string[];
    isCurrent?: boolean;
  }[];

  // Education
  education: {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
  }[];

  // Certifications
  certifications: { name: string; issuer?: string; issueDate?: string }[];

  // Projects
  projects: {
    name: string;
    description: string;
    technologies?: string[];
    role?: string;
    link?: string;
    startDate?: string;
    endDate?: string;
  }[];

  // Availability
  availability?: {
    status?: "Available" | "Open to Opportunities" | "Not Available";
    type?: "Full-time" | "Part-time" | "Contract";
    startDate?: string;
  };

  // Social Links
  socialLinks?: Record<string, string>;

  source: "profile" | "csv" | "resume";
  recruiter_id?: Schema.Types.ObjectId;
  job_id?: Schema.Types.ObjectId;
  applicant_id?: Schema.Types.ObjectId;
  import_id?: string; // Unique ID for CSV/PDF imports (since they don't have applicant_id)
  cv_filename?: string;
  cv_data?: string;
  status?: "pending" | "reviewed" | "shortlisted" | "rejected";
}

const CandidateSchema = new Schema<ICandidate>(
  {
    firstName: String,
    lastName: String,
    name: { type: String, required: true },
    email: String,
    headline: String,
    bio: String,
    location: String,
    skills: [
      {
        name: { type: String, required: true },
        level: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Expert"] },
        yearsOfExperience: Number,
      },
    ],
    languages: [
      {
        name: String,
        proficiency: { type: String, enum: ["Basic", "Conversational", "Fluent", "Native"] },
      },
    ],
    experience: [
      {
        company: String,
        role: String,
        startDate: String,
        endDate: String,
        description: String,
        technologies: [String],
        isCurrent: Boolean,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        issueDate: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
        role: String,
        link: String,
        startDate: String,
        endDate: String,
      },
    ],
    availability: {
      status: { type: String, enum: ["Available", "Open to Opportunities", "Not Available"] },
      type: { type: String, enum: ["Full-time", "Part-time", "Contract"] },
      startDate: String,
    },
    socialLinks: {
      type: Map,
      of: String,
    },
    source: { type: String, enum: ["profile", "csv", "resume"], default: "profile" },
    recruiter_id: { type: Schema.Types.ObjectId, ref: "User" },
    job_id: { type: Schema.Types.ObjectId, ref: "Job" },
    applicant_id: { type: Schema.Types.ObjectId, ref: "User" },
    import_id: { type: String, unique: true, sparse: true }, // Unique ID for imports
    cv_filename: String,
    cv_data: String,
    status: { type: String, enum: ["pending", "reviewed", "shortlisted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const Candidate = model<ICandidate>("Candidate", CandidateSchema);
