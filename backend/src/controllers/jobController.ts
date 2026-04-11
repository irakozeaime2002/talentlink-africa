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
    const now = new Date();
    // Auto-close expired jobs for this recruiter
    await Job.updateMany(
      { recruiter_id, status: "open", deadline: { $lt: now } },
      { $set: { status: "closed" } }
    );
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
    const now = new Date();
    // Auto-close expired jobs
    await Job.updateMany(
      { status: "open", deadline: { $lt: now } },
      { $set: { status: "closed" } }
    );
    const jobs = await Job.find({
      status: "open",
      $or: [{ deadline: { $exists: false } }, { deadline: null }, { deadline: { $gte: now } }],
    }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

export const getPublicJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const job = await Job.findOne({
      _id: req.params.id,
      status: "open",
      $or: [{ deadline: { $exists: false } }, { deadline: null }, { deadline: { $gte: now } }],
    });
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
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
    const updates = { ...req.body };
    // Auto-adjust status based on deadline change
    if (updates.deadline) {
      const now = new Date();
      const newDeadline = new Date(updates.deadline);
      if (newDeadline < now && updates.status !== "draft") {
        updates.status = "closed";
      } else if (newDeadline >= now && updates.status === "closed") {
        updates.status = "open";
      }
    } else if (updates.deadline === null || updates.deadline === "") {
      // Deadline removed — reopen if it was closed due to deadline
      if (updates.status === "closed") updates.status = "open";
    }
    const job = await Job.findByIdAndUpdate(req.params.id, updates, { new: true });
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
