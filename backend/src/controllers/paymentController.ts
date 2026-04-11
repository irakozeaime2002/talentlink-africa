import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { initiateCashin, verifyTransaction } from "../services/paypackService";
import { Payment } from "../models/Payment";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Plan prices in RWF
const PRICES: Record<string, Record<string, number>> = {
  pro:        { monthly: 10000, yearly: 80000  },
  enterprise: { monthly: 30000, yearly: 240000 },
  // applicant pro
  "pro-applicant": { monthly: 5000, yearly: 40000 },
};

function calcExpiry(billing: "monthly" | "yearly"): Date {
  const now = new Date();
  if (billing === "yearly") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
}

export const initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan, billing, phone } = req.body as { plan: string; billing: "monthly" | "yearly"; phone: string };
    const role = (req as any).user?.role;

    if (!["pro", "enterprise"].includes(plan) || !["monthly", "yearly"].includes(billing) || !phone) {
      res.status(400).json({ error: "plan, billing, and phone are required" }); return;
    }

    // Applicants only have pro plan at different price
    const priceKey = role === "applicant" ? "pro-applicant" : plan;
    const amount = PRICES[priceKey]?.[billing];
    if (!amount) { res.status(400).json({ error: "Invalid plan or billing" }); return; }

    const { ref } = await initiateCashin(phone, amount);

    await Payment.create({ user_id: (req as any).user.id, ref, plan, billing, amount, phone });

    res.json({ ref, amount, message: "Payment initiated. Check your phone for the MoMo prompt." });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ref } = req.params;
    const userId = (req as any).user.id;

    const payment = await Payment.findOne({ ref, user_id: userId });
    if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }

    // Already processed
    if (payment.status === "successful") {
      const user = await User.findById(userId).select("-password");
      const token = jwt.sign(
        { id: user!._id, role: user!.role, email: user!.email, plan: user!.plan },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({ status: "successful", token, user }); return;
    }

    if (payment.status === "failed") {
      res.json({ status: "failed" }); return;
    }

    // Poll Paypack
    const status = await verifyTransaction(ref);
    payment.status = status;
    await payment.save();

    if (status === "successful") {
      const planExpiresAt = calcExpiry(payment.billing);

      const user = await User.findByIdAndUpdate(
        userId,
        { plan: payment.plan, planExpiresAt },
        { new: true }
      ).select("-password");

      const token = jwt.sign(
        { id: user!._id, role: user!.role, email: user!.email, plan: user!.plan },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ status: "successful", token, user });
    } else {
      res.json({ status });
    }
  } catch (err) {
    next(err);
  }
};

export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payments = await Payment.find({ user_id: (req as any).user.id }).sort({ createdAt: -1 }).limit(10);
    res.json(payments);
  } catch (err) { next(err); }
};
