import { Schema, model, Document } from "mongoose";

export interface IApplication extends Document {
  job_id: Schema.Types.ObjectId;
  applicant_id: Schema.Types.ObjectId;
  cover_letter: string;
  answers: { question: string; answer: string }[];
  resume_url?: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected";
  skills: { name: string; level?: "Beginner" | "Intermediate" | "Advanced" | "Expert"; yearsOfExperience?: number }[];
  education: { institution: string; degree: string; fieldOfStudy?: string; startYear?: number; endYear?: number }[];
  experience: { company: string; role: string; startDate?: string; endDate?: string; description?: string; technologies?: string[]; isCurrent?: boolean }[];
  projects: { name: string; description: string; technologies?: string[]; role?: string; link?: string; startDate?: string; endDate?: string }[];
  certifications: { name: string; issuer?: string; issueDate?: string }[];
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
    skills: [{ name: { type: String, required: true }, level: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Expert"] }, yearsOfExperience: Number }],
    education: [{ institution: String, degree: String, fieldOfStudy: String, startYear: Number, endYear: Number }],
    experience: [{ company: String, role: String, startDate: String, endDate: String, description: String, technologies: [String], isCurrent: Boolean }],
    projects: [{ name: String, description: String, technologies: [String], role: String, link: String, startDate: String, endDate: String }],
    certifications: [{ name: String, issuer: String, issueDate: String }],
    documents: [{ name: String, filename: String, data: String }],
  },
  { timestamps: true }
);

export const Application = model<IApplication>("Application", ApplicationSchema);
