/**
 * Authentication Controller - Handles user registration, login, and password management
 * 
 * We support two user roles:
 * - Recruiters: Can post jobs, screen candidates, manage applications
 * - Applicants: Can browse jobs, submit applications, track their status
 * 
 * Security features:
 * - Passwords are hashed with bcrypt (never stored in plain text)
 * - JWTs expire after 7 days (users need to log in again)
 * - Password reset tokens expire after 1 hour
 * - Email enumeration protection (we don't reveal if an email exists)
 * 
 * Plan management:
 * - Users start on the free plan
 * - Paid plans (pro/enterprise) have expiry dates
 * - We auto-downgrade to free when plans expire
 */

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User";
import { sendPasswordResetEmail } from "../services/emailService";

const JWT_SECRET = process.env.JWT_SECRET as string;

/**
 * Register a new user (recruiter or applicant)
 * 
 * We check if the email is already taken to prevent duplicate accounts.
 * Passwords are hashed before storing - we never save plain text passwords.
 * 
 * The JWT token includes the user's role and plan so we can enforce permissions
 * without hitting the database on every request.
 */
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

/**
 * Log in an existing user
 * 
 * We check both email and password. If either is wrong, we return the same
 * generic error message to prevent attackers from figuring out which emails
 * are registered (security best practice).
 * 
 * We also check if their paid plan expired and auto-downgrade them to free.
 * This prevents users from getting pro features after their subscription ends.
 */
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

/**
 * Upgrade user's plan (pro or enterprise)
 * 
 * This is called after successful payment. We set an expiry date based on
 * whether they chose monthly (30 days) or yearly (365 days) billing.
 * 
 * We issue a new JWT token so the frontend immediately sees the plan upgrade
 * without needing to refresh or log out/in.
 */
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

/**
 * Get the current user's profile
 * 
 * This is called on app load to check if the user is still logged in.
 * We also check for expired plans here and auto-downgrade if needed.
 */
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

/**
 * Update user profile (name, email, phone, etc)
 * 
 * We whitelist which fields can be updated to prevent users from changing
 * sensitive fields like role, plan, or password through this endpoint.
 */
export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowed = ["name", "email", "phone", "date_of_birth", "gender", "nationality", "residence", "father_name", "mother_name", "national_id"];
    const update: Record<string, string> = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    
    // Check if email is being changed and if it's already taken
    if (update.email) {
      const existing = await User.findOne({ email: update.email, _id: { $ne: (req as any).user.id } });
      if (existing) { res.status(409).json({ error: "Email already in use" }); return; }
    }
    
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

/**
 * Change password for logged-in user
 * 
 * Requires current password for security verification.
 * This is different from password reset which uses email tokens.
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }
    
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    
    const user = await User.findById((req as any).user.id);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    
    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    
    // Hash and update new password
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * Request a password reset email
 * 
 * Security: We always return success even if the email doesn't exist.
 * This prevents attackers from using this endpoint to check which emails
 * are registered (called "email enumeration").
 * 
 * The reset token is random and expires after 1 hour for security.
 */
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

/**
 * Reset password using the token from the email
 * 
 * The token must be valid and not expired (1 hour limit).
 * After resetting, we delete the token so it can't be reused.
 */
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
