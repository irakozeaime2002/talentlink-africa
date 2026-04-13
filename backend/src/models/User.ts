import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "recruiter" | "applicant" | "admin";
  plan: "free" | "pro" | "enterprise";
  planExpiresAt?: Date;
  screeningsUsed: number;
  screeningsResetAt?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  residence?: string;
  father_name?: string;
  mother_name?: string;
  national_id?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["recruiter", "applicant", "admin"], required: true },
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    planExpiresAt: Date,
    screeningsUsed: { type: Number, default: 0 },
    screeningsResetAt: Date,
    resetToken: String,
    resetTokenExpiry: Date,
    phone: String,
    date_of_birth: String,
    gender: String,
    nationality: String,
    residence: String,
    father_name: String,
    mother_name: String,
    national_id: String,
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
