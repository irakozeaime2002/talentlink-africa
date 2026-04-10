import { Request, Response, NextFunction } from "express";
import { Job } from "../models/Job";

export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recruiter_id = (req as any).user?.id;
    const job = await Job.create({ ...req.body, recruiter_id });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

// Recruiter's own jobs
export const getJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recruiter_id = (req as any).user?.id;
    const filter = recruiter_id ? { recruiter_id } : {};
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

// Public: all open jobs (for job board)
export const getPublicJobs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

export const getJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
};
