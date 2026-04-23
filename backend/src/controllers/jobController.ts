/**
 * Job Controller - Manages job postings
 * 
 * Jobs have three states:
 * - draft: Not visible to applicants, recruiter is still working on it
 * - open: Published on the job board, accepting applications
 * - closed: No longer accepting applications (either manually closed or deadline passed)
 * 
 * We automatically close jobs when their deadline passes. This happens:
 * 1. When recruiters view their job list
 * 2. When applicants browse the public job board
 * 3. When someone tries to view a specific job
 * 
 * This "lazy" approach is simpler than running a cron job and works fine
 * for most use cases. Jobs get closed within seconds of their deadline.
 */

import { Request, Response, NextFunction } from "express";
import { Job } from "../models/Job";

/**
 * Create a new job posting
 * 
 * The recruiter_id is automatically set from the JWT token so users can only
 * create jobs under their own account (security).
 */
export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recruiter_id = (req as any).user?.id;
    const job = await Job.create({ ...req.body, recruiter_id });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all jobs for the logged-in recruiter
 * 
 * Before returning the list, we auto-close any jobs that passed their deadline.
 * This keeps the job list accurate without needing a background worker.
 */
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

/**
 * Get all open jobs for the public job board
 * 
 * This is what applicants see when they browse available positions.
 * We filter out:
 * - Draft jobs (not ready to publish)
 * - Closed jobs (no longer accepting applications)
 * - Jobs past their deadline (auto-closed)
 * 
 * No authentication required - anyone can browse jobs.
 */
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

/**
 * Get a single job for the public job board
 * 
 * This shows the full job details and application form.
 * We verify the job is still open and hasn't passed its deadline.
 */
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

/**
 * Get a single job (for recruiters)
 * 
 * Unlike the public endpoint, this doesn't filter by status.
 * Recruiters can view their own draft and closed jobs.
 */
export const getJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a job posting
 * 
 * Smart deadline handling:
 * - If deadline is moved to the future, reopen a closed job
 * - If deadline is moved to the past, auto-close the job
 * - If deadline is removed, reopen the job (no expiry)
 * 
 * This prevents recruiters from accidentally leaving jobs open past their deadline.
 */
export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = { ...req.body };
    // Smart status adjustment based on deadline changes
    // If they extend the deadline, we should reopen the job automatically
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

/**
 * Delete a job posting
 * 
 * When a job is deleted:
 * 1. Applications from profile applicants (source: "profile") are set to "rejected" status
 * 2. Screening results for this job are deleted
 * 3. CSV/PDF uploaded candidates (source: "csv" or "resume") linked to this job are deleted
 * 4. The job itself is deleted
 * 
 * Order matters:
 * - Update applications first (they reference job_id but we're not deleting them)
 * - Delete screening results (they reference job_id and candidate_ids)
 * - Delete csv/resume candidates (they reference job_id)
 * - Delete job last (everything else references it)
 */
export const deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job_id = req.params.id;
    
    // Import models
    const { Application } = await import("../models/Application");
    const { Candidate } = await import("../models/Candidate");
    const { ScreeningResult } = await import("../models/ScreeningResult");
    
    // Step 1: Set all profile applicant applications to "rejected"
    // These applications stay in the database so applicants can see their history
    await Application.updateMany({ job_id }, { $set: { status: "rejected" } });
    
    // Step 2: Delete all screening results for this job
    // These reference both job_id and candidate_ids, so delete before candidates
    await ScreeningResult.deleteMany({ job_id });
    
    // Step 3: Delete all csv/resume candidates for this job
    // These were imported specifically for this job, so they're meaningless without it
    await Candidate.deleteMany({ job_id, source: { $in: ["csv", "resume"] } });
    
    // Step 4: Delete the job itself
    await Job.findByIdAndDelete(job_id);
    
    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
};
