import { Schema, model, Document } from "mongoose";

export interface IApplication extends Document {
  job_id: Schema.Types.ObjectId;
  applicant_id: Schema.Types.ObjectId;
  cover_letter: string;
  answers: { question: string; answer: string }[];
  resume_url?: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected";
  // Structured profile fields (mirrors Candidate)
  skills: string[];
  education: { degree: string; field: string; institution: string; year?: number }[];
  experience: { title: string; company: string; duration: string; description?: string }[];
  projects: { name: string; description: string; technologies?: string[] }[];
  certifications: string[];
  documents?: { name: string; filename: string; data: string }[];
  createdAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    job_id: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    applicant_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cover_letter: { type: String, default: "" },
    answers: [{ question: String, answer: String }],
    resume_url: String,
    status: { type: String, enum: ["pending", "reviewed", "shortlisted", "rejected"], default: "pending" },
    skills: [String],
    education: [{ degree: String, field: String, institution: String, year: Number }],
    experience: [{ title: String, company: String, duration: String, description: String }],
    projects: [{ name: String, description: String, technologies: [String] }],
    certifications: [String],
    documents: [{ name: String, filename: String, data: String }],
  },
  { timestamps: true }
);

export const Application = model<IApplication>("Application", ApplicationSchema);
