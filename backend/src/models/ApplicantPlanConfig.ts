import { Schema, model, Document } from "mongoose";

export interface IApplicantPlanConfig extends Document {
  plan: "free" | "pro";
  maxApplications: number;  // -1 = unlimited
  maxCVUploads: number;     // -1 = unlimited
  profileHighlight: boolean; // shows a badge on application visible to recruiter
  monthlyPrice: number;      // Price in RWF
  yearlyPrice: number;       // Price in RWF
  updatedAt: Date;
}

const ApplicantPlanConfigSchema = new Schema<IApplicantPlanConfig>(
  {
    plan: { type: String, enum: ["free", "pro"], required: true, unique: true },
    maxApplications: { type: Number, default: 5 },
    maxCVUploads: { type: Number, default: 1 },
    profileHighlight: { type: Boolean, default: false },
    monthlyPrice: { type: Number, default: 0 },
    yearlyPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ApplicantPlanConfig = model<IApplicantPlanConfig>("ApplicantPlanConfig", ApplicantPlanConfigSchema);
