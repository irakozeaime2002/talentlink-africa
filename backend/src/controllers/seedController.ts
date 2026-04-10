import { Request, Response, NextFunction } from "express";
import { Candidate } from "../models/Candidate";
import { Job } from "../models/Job";

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalJobs, openJobs, totalCandidates, profileCandidates] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Candidate.countDocuments(),
      Candidate.countDocuments({ source: "profile" }),
    ]);
    res.json({ totalJobs, openJobs, totalCandidates, profileCandidates });
  } catch (err) {
    next(err);
  }
};
