import { Schema, model, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  organization: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  responsibilities: string[];
  recruiter_id: Schema.Types.ObjectId;
  status: "open" | "closed" | "draft";
  location: string;
  salary_range: string;
  deadline?: Date;
  application_questions: string[];
  required_documents: string[];
  createdAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    organization: { type: String, default: "" },
    description: { type: String, required: true },
    required_skills: [String],
    preferred_skills: [String],
    experience_level: { type: String, required: true },
    responsibilities: [String],
    recruiter_id: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    location: { type: String, default: "Remote" },
    salary_range: { type: String, default: "" },
    deadline: Date,
    application_questions: [String],
    required_documents: [String],
  },
  { timestamps: true }
);

export const Job = model<IJob>("Job", JobSchema);
