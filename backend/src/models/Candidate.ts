import { Schema, model, Document } from "mongoose";

export interface ICandidate extends Document {
  name: string;
  email?: string;
  skills: string[];
  education: {
    degree: string;
    field: string;
    institution: string;
    year?: string;
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description?: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies?: string[];
  }[];
  certifications: string[];
  source: "profile" | "csv" | "resume";
  recruiter_id?: Schema.Types.ObjectId;
  job_id?: Schema.Types.ObjectId;
  cv_filename?: string;
  cv_data?: string;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true },
    email: String,
    skills: [String],
    education: [
      {
        degree: String,
        field: String,
        institution: String,
        year: String,
      },
    ],
    experience: [
      {
        title: String,
        company: String,
        duration: String,
        description: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
      },
    ],
    certifications: [String],
    source: { type: String, enum: ["profile", "csv", "resume"], default: "profile" },
    recruiter_id: { type: Schema.Types.ObjectId, ref: "User" },
    job_id: { type: Schema.Types.ObjectId, ref: "Job" },
    cv_filename: String,
    cv_data: String,
  },
  { timestamps: true }
);

export const Candidate = model<ICandidate>("Candidate", CandidateSchema);
