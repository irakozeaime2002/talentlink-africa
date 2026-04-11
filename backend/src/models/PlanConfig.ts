import { Schema, model, Document } from "mongoose";

export interface IPlanConfig extends Document {
  plan: "free" | "pro" | "enterprise";
  maxJobs: number;           // -1 = unlimited
  maxScreeningsPerMonth: number; // -1 = unlimited
  csvUpload: boolean;
  resumeUpload: boolean;
  updatedAt: Date;
}

const PlanConfigSchema = new Schema<IPlanConfig>(
  {
    plan: { type: String, enum: ["free", "pro", "enterprise"], required: true, unique: true },
    maxJobs: { type: Number, default: 3 },
    maxScreeningsPerMonth: { type: Number, default: 5 },
    csvUpload: { type: Boolean, default: false },
    resumeUpload: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PlanConfig = model<IPlanConfig>("PlanConfig", PlanConfigSchema);
