import { Request, Response, NextFunction } from "express";
import { Candidate } from "../models/Candidate";
import { parseCSV, parsePDF, resumeTextToCandidate } from "../services/parserService";

const recruiterId = (req: Request) => (req as any).user?.id;

export const createCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidate = await Candidate.create({ ...req.body, source: "profile", recruiter_id: recruiterId(req) });
    res.status(201).json(candidate);
  } catch (err) { next(err); }
};

export const getCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidates = await Candidate.find({ recruiter_id: recruiterId(req), source: { $in: ["csv", "resume"] } })
      .populate("job_id", "title")
      .sort({ createdAt: -1 });
    const result = candidates.map((c) => ({
      ...c.toObject(),
      jobs_applied: c.job_id ? [{ _id: (c.job_id as any)._id?.toString() || c.job_id.toString(), title: (c.job_id as any).title || "" }] : [],
    }));
    res.json(result);
  } catch (err) { next(err); }
};

export const getCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter_id: recruiterId(req) });
    if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
    res.json(candidate);
  } catch (err) { next(err); }
};

export const deleteCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Candidate.findOneAndDelete({ _id: req.params.id, recruiter_id: recruiterId(req) });
    res.json({ message: "Candidate deleted" });
  } catch (err) { next(err); }
};

export const uploadCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const { job_id } = req.body;
    const parsed = parseCSV(req.file.buffer);
    const candidates = await Candidate.insertMany(
      parsed.map((c) => ({ ...c, source: "csv", recruiter_id: recruiterId(req), ...(job_id ? { job_id } : {}) }))
    );
    res.status(201).json({ inserted: candidates.length, candidates });
  } catch (err) { next(err); }
};

export const uploadResumes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ error: "No files uploaded" }); return; }
    const { job_id } = req.body;
    const parsed = await Promise.all(
      files.map(async (file, i) => {
        const text = await parsePDF(file.buffer);
        return resumeTextToCandidate(text, i);
      })
    );
    const candidates = await Candidate.insertMany(
      parsed.map((c) => ({ ...c, source: "resume", recruiter_id: recruiterId(req), ...(job_id ? { job_id } : {}) }))
    );
    res.status(201).json({ inserted: candidates.length, candidates });
  } catch (err) { next(err); }
};
