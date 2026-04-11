import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET as string;

function calcExpiry(billing: "monthly" | "yearly"): Date {
  const now = new Date();
  if (billing === "yearly") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
}

export const upgradePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan, billing } = req.body as { plan: string; billing?: "monthly" | "yearly" };
    if (!["free", "pro", "enterprise"].includes(plan)) {
      res.status(400).json({ error: "Invalid plan" }); return;
    }

    const planExpiresAt = plan === "free" ? undefined : calcExpiry(billing || "monthly");

    const user = await User.findByIdAndUpdate(
      (req as any).user.id,
      { plan, ...(planExpiresAt ? { planExpiresAt } : { $unset: { planExpiresAt: "" } }) },
      { new: true }
    ).select("-password");

    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, plan: user.plan },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) { next(err); }
};

export const getPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id).select("plan planExpiresAt");
    res.json(user);
  } catch (err) { next(err); }
};
