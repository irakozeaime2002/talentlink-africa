import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User";
import { sendPasswordResetEmail } from "../services/emailService";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    if (!["recruiter", "applicant"].includes(role)) {
      res.status(400).json({ error: "Role must be recruiter or applicant" });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) { res.status(409).json({ error: "Email already registered" }); return; }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, plan: user.plan }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }

    // Auto-downgrade expired plan
    if (user.plan !== "free" && user.planExpiresAt && user.planExpiresAt < new Date()) {
      user = await User.findByIdAndUpdate(
        user._id,
        { $set: { plan: "free" }, $unset: { planExpiresAt: "" } },
        { new: true }
      ) as typeof user;
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, plan: user.plan }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan } });
  } catch (err) {
    next(err);
  }
};

export const upgradePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan, billing } = req.body;
    if (!["free", "pro", "enterprise"].includes(plan)) {
      res.status(400).json({ error: "Invalid plan" }); return;
    }
    // Calculate expiry: monthly = 30 days, yearly = 365 days
    const days = billing === "yearly" ? 365 : 30;
    const planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      (req as any).user.id,
      { plan, planExpiresAt },
      { new: true }
    ).select("-password");

    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Issue new token with updated plan info
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({ user, token });
  } catch (err) { next(err); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let user = await User.findById((req as any).user.id).select("-password");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Auto-downgrade expired plan
    if (user.plan !== "free" && user.planExpiresAt && user.planExpiresAt < new Date()) {
      user = await User.findByIdAndUpdate(
        user._id,
        { $set: { plan: "free" }, $unset: { planExpiresAt: "" } },
        { new: true }
      ).select("-password") as typeof user;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowed = ["name", "email", "phone", "date_of_birth", "gender", "nationality", "residence", "father_name", "mother_name", "national_id"];
    const update: Record<string, string> = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(
      (req as any).user.id,
      update,
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) { res.json({ message: "If that email exists, a reset link has been sent." }); return; }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, { resetToken: token, resetTokenExpiry: expiry });

    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;
    console.log("[ForgotPassword] Sending reset email to:", user.email);
    console.log("[ForgotPassword] Reset URL:", resetUrl);
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
      console.log("[ForgotPassword] Email sent successfully");
    } catch (emailErr: any) {
      console.error("[ForgotPassword] Email send failed:", emailErr.message, emailErr);
    }

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      res.status(400).json({ error: "Token and password (min 6 chars) are required" }); return;
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) { res.status(400).json({ error: "Invalid or expired reset link" }); return; }

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashed,
      $unset: { resetToken: "", resetTokenExpiry: "" },
    });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) { next(err); }
};
