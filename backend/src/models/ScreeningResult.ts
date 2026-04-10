import { Schema, model, Document } from "mongoose";
import { RankedCandidate } from "../types";

export interface IScreeningResult extends Document {
  job_id: Schema.Types.ObjectId;
  job_summary: {
    role: string;
    key_requirements: string[];
    must_have_skills: string[];
    preferred_skills: string[];
  };
  ranking: RankedCandidate[];
  createdAt: Date;
}

const RankedCandidateSchema = new Schema({
  rank: Number,
  candidate_id: String,
  name: String,
  match_score: Number,
  score_breakdown: {
    skills: Number,
    experience: Number,
    education: Number,
    projects: Number,
  },
  strengths: [String],
  gaps: [String],
  reason: String,
  recommendation: String,
});

const ScreeningResultSchema = new Schema<IScreeningResult>(
  {
    job_id: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    job_summary: {
      role: String,
      key_requirements: [String],
      must_have_skills: [String],
      preferred_skills: [String],
    },
    ranking: [RankedCandidateSchema],
  },
  { timestamps: true }
);

export const ScreeningResult = model<IScreeningResult>("ScreeningResult", ScreeningResultSchema);
