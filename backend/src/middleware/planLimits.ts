import { Request, Response, NextFunction } from "express";
import { Job } from "../models/Job";
import { ScreeningResult } from "../models/ScreeningResult";
import { PlanConfig, IPlanConfig } from "../models/PlanConfig";
import { ApplicantPlanConfig } from "../models/ApplicantPlanConfig";
import { Application } from "../models/Application";
import { Candidate } from "../models/Candidate";

// Default fallback limits (used if DB not seeded yet)
const DEFAULTS: Record<string, IPlanConfig> = {
  free:       { plan: "free",       maxJobs: 3,  maxScreeningsPerMonth: 5,  csvUpload: false, resumeUpload: false } as any,
  pro:        { plan: "pro",        maxJobs: -1, maxScreeningsPerMonth: -1, csvUpload: true,  resumeUpload: true  } as any,
  enterprise: { plan: "enterprise", maxJobs: -1, maxScreeningsPerMonth: -1, csvUpload: true,  resumeUpload: true  } as any,
};

async function getConfig(plan: string): Promise<IPlanConfig> {
  const config = await PlanConfig.findOne({ plan });
  return config || (DEFAULTS[plan] as IPlanConfig);
}

const userPlan = (req: Request): string => {
  const plan = (req as any).user?.plan;
  return plan && ["free", "pro", "enterprise"].includes(plan) ? plan : "free";
};

export const limitJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const config = await getConfig(userPlan(req));
  if (config.maxJobs === -1) { next(); return; }
  const count = await Job.countDocuments({ recruiter_id: (req as any).user?.id });
  if (count >= config.maxJobs) {
    res.status(403).json({ error: `Your plan allows only ${config.maxJobs} active job post${config.maxJobs !== 1 ? "s" : ""}. Upgrade to post more.` });
    return;
  }
  next();
};

export const limitScreening = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const config = await getConfig(userPlan(req));
  if (config.maxScreeningsPerMonth === -1) { next(); return; }
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const recruiterJobs = await Job.find({ recruiter_id: (req as any).user?.id }).select("_id");
  const jobIds = recruiterJobs.map((j) => j._id);
  const count = await ScreeningResult.countDocuments({ job_id: { $in: jobIds }, createdAt: { $gte: start } });
  if (count >= config.maxScreeningsPerMonth) {
    res.status(403).json({ error: `Your plan allows only ${config.maxScreeningsPerMonth} AI screening run${config.maxScreeningsPerMonth !== 1 ? "s" : ""} per month. Upgrade for unlimited screening.` });
    return;
  }
  next();
};

export const requireCSVUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const config = await getConfig(userPlan(req));
  if (!config.csvUpload) {
    res.status(403).json({ error: "CSV/XLSX upload is not available on your current plan. Upgrade to use bulk import." });
    return;
  }
  next();
};

export const requireResumeUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const config = await getConfig(userPlan(req));
  if (!config.resumeUpload) {
    res.status(403).json({ error: "Bulk resume upload is not available on your current plan. Upgrade to use this feature." });
    return;
  }
  next();
};

// ── Applicant limits ──────────────────────────────────────────────────────────
async function getApplicantConfig(plan: string) {
  const config = await ApplicantPlanConfig.findOne({ plan });
  return config || { maxApplications: 5, maxCVUploads: 1, profileHighlight: false };
}

export const limitApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const plan = userPlan(req);
  const config = await getApplicantConfig(plan);
  if (config.maxApplications === -1) { next(); return; }
  const count = await Application.countDocuments({ applicant_id: (req as any).user?.id });
  if (count >= config.maxApplications) {
    res.status(403).json({ error: `Your plan allows only ${config.maxApplications} job application${config.maxApplications !== 1 ? "s" : ""}. Upgrade to apply to more jobs.` });
    return;
  }
  next();
};

export const limitCVUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const plan = userPlan(req);
  const config = await getApplicantConfig(plan);
  if (config.maxCVUploads === -1) { next(); return; }
  const candidate = await Candidate.findOne({ applicant_id: (req as any).user?.id });
  const uploads = candidate?.cv_data ? 1 : 0;
  if (uploads >= config.maxCVUploads) {
    res.status(403).json({ error: `Your plan allows only ${config.maxCVUploads} CV upload${config.maxCVUploads !== 1 ? "s" : ""}. Upgrade for more uploads.` });
    return;
  }
  next();
};
