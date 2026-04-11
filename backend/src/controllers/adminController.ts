import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { Job } from "../models/Job";
import { Candidate } from "../models/Candidate";
import { Application } from "../models/Application";
import { ScreeningResult } from "../models/ScreeningResult";
import bcrypt from "bcryptjs";

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalJobs, totalApplications, totalCandidates, totalScreenings] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Candidate.countDocuments(),
      ScreeningResult.countDocuments(),
    ]);

    const recruiters = await User.countDocuments({ role: "recruiter" });
    const applicants = await User.countDocuments({ role: "applicant" });
    const openJobs = await Job.countDocuments({ status: "open" });
    const shortlisted = await Application.countDocuments({ status: "shortlisted" });

    // Recent activity (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: since } });
    const newJobs = await Job.countDocuments({ createdAt: { $gte: since } });
    const newApplications = await Application.countDocuments({ createdAt: { $gte: since } });

    res.json({
      totalUsers, totalJobs, totalApplications, totalCandidates, totalScreenings,
      recruiters, applicants, openJobs, shortlisted,
      recentActivity: { newUsers, newJobs, newApplications },
    });
  } catch (err) { next(err); }
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    const total = await User.countDocuments(filter);
    res.json({ users, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) { next(err); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, role, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, phone },
      { new: true }
    ).select("-password");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) { next(err); }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    if (req.params.id === adminId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
    await User.findByIdAndDelete(req.params.id);
    // Clean up their data
    await Application.deleteMany({ applicant_id: req.params.id });
    await Job.deleteMany({ recruiter_id: req.params.id });
    res.json({ message: "User deleted" });
  } catch (err) { next(err); }
};

export const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashed });
    res.json({ message: "Password reset successfully" });
  } catch (err) { next(err); }
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const getJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { organization: { $regex: search, $options: "i" } },
    ];
    const jobs = await Job.find(filter)
      .populate("recruiter_id", "name email")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    const total = await Job.countDocuments(filter);
    res.json({ jobs, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ job_id: req.params.id });
    await ScreeningResult.deleteMany({ job_id: req.params.id });
    res.json({ message: "Job and related data deleted" });
  } catch (err) { next(err); }
};

export const updateJobStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) { next(err); }
};

// ── Applications ──────────────────────────────────────────────────────────────
export const getApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    const applications = await Application.find(filter)
      .populate("applicant_id", "name email")
      .populate("job_id", "title organization")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    const total = await Application.countDocuments(filter);
    res.json({ applications, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
};

// ── Screenings ────────────────────────────────────────────────────────────────
export const getScreenings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const screenings = await ScreeningResult.find()
      .populate("job_id", "title organization")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(screenings);
  } catch (err) { next(err); }
};

// ── Create Admin ──────────────────────────────────────────────────────────────
export const createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) { res.status(409).json({ error: "Email already registered" }); return; }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "admin" });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { next(err); }
};
