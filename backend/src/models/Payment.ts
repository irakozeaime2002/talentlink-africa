import { Schema, model, Document } from "mongoose";

export interface IPayment extends Document {
  user_id: Schema.Types.ObjectId;
  ref: string;
  plan: "pro" | "enterprise";
  billing: "monthly" | "yearly";
  amount: number;
  phone: string;
  status: "pending" | "successful" | "failed";
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ref: { type: String, required: true, unique: true },
    plan: { type: String, enum: ["pro", "enterprise"], required: true },
    billing: { type: String, enum: ["monthly", "yearly"], required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ["pending", "successful", "failed"], default: "pending" },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>("Payment", PaymentSchema);
