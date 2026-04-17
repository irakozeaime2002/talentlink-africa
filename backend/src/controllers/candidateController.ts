import { Request, Response, NextFunction } from "express";
import { Candidate } from "../models/Candidate";
import { parseCSV, parsePDF, resumeTextToCandidate } from "../services/parserService";

/**
 * Candidate Controller - Manages the recruiter's talent pool
 * 
 * This handles all the ways recruiters can add candidates to their pool:
 * - Manual profile creation (structured data entry)
 * - CSV/Excel bulk upload (for importing from other systems)
 * - PDF resume upload (for traditional resume files)
 * 
 * Candidates can come from two sources:
 * 1. Job applicants (source="profile") - people who applied through the job board
 * 2. Imported candidates (source="csv" or "resume") - bulk uploads by recruiters
 * 
 * The imported pool is separate so recruiters can build a talent database
 * even before posting jobs.
 */

// Helper to get the logged-in recruiter's ID from the JWT token
const recruiterId = (req: Request) => (req as any).user?.id;

/**
 * Create a single candidate profile manually
 * Used when recruiters want to add someone they met at an event, got a referral, etc.
 */
export const createCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidate = await Candidate.create({ ...req.body, source: "profile", recruiter_id: recruiterId(req) });
    res.status(201).json(candidate);
  } catch (err) { next(err); }
};

/**
 * Get all imported candidates (CSV and resume uploads only)
 * 
 * We filter by source to show only the "imported pool" - candidates the recruiter
 * added themselves, not job applicants. This keeps the candidate pool clean and
 * separate from active applications.
 */
export const getCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidates = await Candidate.find({ recruiter_id: recruiterId(req), source: { $in: ["csv", "resume"] } })
      .populate("job_id", "title")
      .sort({ createdAt: -1 });
    // Add a jobs_applied array to show which jobs this candidate applied to
    // This helps recruiters see if someone in their pool has already applied
    const result = candidates.map((c) => ({
      ...c.toObject(),
      jobs_applied: c.job_id ? [{ _id: (c.job_id as any)._id?.toString() || c.job_id.toString(), title: (c.job_id as any).title || "" }] : [],
    }));
    res.json(result);
  } catch (err) { next(err); }
};

/**
 * Get a single candidate by ID
 * Security: Only returns candidates owned by the logged-in recruiter
 */
export const getCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter_id: recruiterId(req) });
    if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
    res.json(candidate);
  } catch (err) { next(err); }
};

/**
 * Delete a single candidate
 * Security: Only allows deleting candidates owned by the logged-in recruiter
 */
export const deleteCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Candidate.findOneAndDelete({ _id: req.params.id, recruiter_id: recruiterId(req) });
    res.json({ message: "Candidate deleted" });
  } catch (err) { next(err); }
};

/**
 * Delete multiple candidates at once
 * 
 * Useful when recruiters import a CSV, realize it has bad data, and want to
 * clean up quickly. Much better UX than deleting one by one.
 * 
 * Security: We check recruiter_id to prevent users from deleting other people's candidates.
 */
export const bulkDeleteCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "No candidate IDs provided" });
      return;
    }
    const result = await Candidate.deleteMany({ _id: { $in: ids }, recruiter_id: recruiterId(req) });
    res.json({ message: `${result.deletedCount} candidate(s) deleted`, deletedCount: result.deletedCount });
  } catch (err) { next(err); }
};

/**
 * Upload a CSV or Excel file with candidate data
 * 
 * This is super flexible - we try to detect common column names like
 * "skills", "experience", "education" but also store ALL the raw CSV data
 * in the bio field so the AI can extract anything we missed.
 * 
 * Common use case: Recruiter exports candidates from LinkedIn, Indeed, or
 * their old ATS and imports them here.
 */
export const uploadCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const { job_id } = req.body;
    const parsed = parseCSV(req.file.buffer);
    const recId = recruiterId(req);
    const timestamp = Date.now();
    
    const candidates = await Candidate.insertMany(
      parsed.map((c, index) => ({
        ...c,
        source: "csv",
        recruiter_id: recId,
        import_id: `csv-${recId}-${timestamp}-${index}`, // Unique ID for this import
        ...(job_id ? { job_id } : {})
      }))
    );
    res.status(201).json({ inserted: candidates.length, candidates });
  } catch (err) { next(err); }
};

/**
 * Upload PDF resumes in bulk
 * 
 * We extract the text from each PDF and create a basic candidate profile.
 * The AI will read the full resume text during screening to extract skills,
 * experience, etc. This is less structured than CSV but works with traditional resumes.
 * 
 * Limitation: We can't perfectly parse every resume format, but the AI is smart
 * enough to understand unstructured text.
 */
export const uploadResumes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ error: "No files uploaded" }); return; }
    const { job_id } = req.body;
    const recId = recruiterId(req);
    const timestamp = Date.now();
    
    const parsed = await Promise.all(
      files.map(async (file, i) => {
        const text = await parsePDF(file.buffer);
        return resumeTextToCandidate(text, i);
      })
    );
    const candidates = await Candidate.insertMany(
      parsed.map((c, index) => ({
        ...c,
        source: "resume",
        recruiter_id: recId,
        import_id: `resume-${recId}-${timestamp}-${index}`, // Unique ID for this import
        ...(job_id ? { job_id } : {})
      }))
    );
    res.status(201).json({ inserted: candidates.length, candidates });
  } catch (err) { next(err); }
};
