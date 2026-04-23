import { Request, Response, NextFunction } from "express";
import { Application } from "../models/Application";
import { Candidate } from "../models/Candidate";
import { Job } from "../models/Job";
import { User } from "../models/User";
import { sendStatusEmail } from "../services/emailService";

export const uploadMyCV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicant_id = (req as any).user.id;
    const user = await User.findById(applicant_id).select("email name");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const cv_data = req.file.buffer.toString("base64");
    const cv_filename = req.file.originalname;
    const candidate = await Candidate.findOneAndUpdate(
      { applicant_id },
      { $set: { name: user.name, email: user.email, source: "profile", applicant_id, cv_data, cv_filename } },
      { upsert: true, new: true }
    );
    res.json({ cv_filename: candidate.cv_filename });
  } catch (err) { next(err); }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicant_id = (req as any).user.id;
    const candidate = await Candidate.findOne({ applicant_id });
    res.json(candidate || null);
  } catch (err) { next(err); }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicant_id = (req as any).user.id;
    const user = await User.findById(applicant_id).select("email name");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const candidate = await Candidate.findOneAndUpdate(
      { applicant_id },
      { $set: { name: user.name, email: user.email, source: "profile", applicant_id, ...req.body } },
      { upsert: true, new: true }
    );
    res.json(candidate);
  } catch (err) { next(err); }
};

export const applyToJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicant_id = (req as any).user.id;
    const { job_id } = req.params;

    const existing = await Application.findOne({ job_id, applicant_id });
    if (existing) { res.status(409).json({ error: "Already applied to this job" }); return; }

    const job = await Job.findById(job_id);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    const user = await User.findById(applicant_id).select("name email");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Parse answers if sent as JSON string (multipart/form-data)
    const body = { ...req.body };
    if (typeof body.answers === "string") {
      try { body.answers = JSON.parse(body.answers); } catch { body.answers = []; }
    }

    const app = await Application.create({ ...body, job_id, applicant_id });

    // Parse uploaded documents and extract text for AI screening
    const files = (req.files as Express.Multer.File[]) || [];
    const documents: { name: string; filename: string; data: string }[] = [];
    let extractedText = "";
    for (const file of files) {
      const data = file.buffer.toString("base64");
      documents.push({ name: file.fieldname || file.originalname, filename: file.originalname, data });
      try {
        const { extractDocumentText } = await import("../services/parserService");
        const text = await extractDocumentText(file.buffer, file.originalname);
        if (text.trim()) extractedText += text + "\n";
      } catch {}
    }
    if (documents.length > 0) {
      await Application.findByIdAndUpdate(app._id, { documents });
    }

    // Upsert candidate record by applicant_id
    const existingCandidate = await Candidate.findOne({ applicant_id });
    await Candidate.findOneAndUpdate(
      { applicant_id },
      {
        $set: {
          name: user.name,
          email: user.email,
          source: "profile",
          applicant_id,
          skills: existingCandidate?.skills?.length ? existingCandidate.skills : body.skills || [],
          education: existingCandidate?.education?.length ? existingCandidate.education : body.education || [],
          experience: existingCandidate?.experience?.length ? existingCandidate.experience : body.experience || [],
          projects: existingCandidate?.projects?.length ? existingCandidate.projects : body.projects || [],
          certifications: existingCandidate?.certifications?.length ? existingCandidate.certifications : body.certifications || [],
          ...(extractedText ? { cv_data: extractedText.slice(0, 10000) } : {}),
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json(app);
  } catch (err) { next(err); }
};

export const getJobApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    const apps = await Application.find({ job_id: req.params.job_id })
      .populate("applicant_id", "name email phone date_of_birth gender nationality residence")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Application.countDocuments({ job_id: req.params.job_id });
    
    res.json({
      applications: apps,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (err) { next(err); }
};

export const getJobApplicantCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job_id = req.params.job_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Get applicants who applied via the board
    const apps = await Application.find({ job_id })
      .populate("applicant_id", "email name")
      .skip(skip)
      .limit(limit);
    
    const totalApps = await Application.countDocuments({ job_id });
    const applicantIds = apps.map((a) => a.applicant_id).filter(Boolean);
    const applicantCandidates = applicantIds.length > 0 ? await Candidate.find({ applicant_id: { $in: applicantIds } }) : [];

    // Auto-create missing candidate records for applicants
    const foundIds = new Set(applicantCandidates.map((c) => c.applicant_id?.toString()));
    for (const app of apps) {
      const u = app.applicant_id as any;
      const uid = u?._id?.toString();
      if (uid && !foundIds.has(uid)) {
        const created = await Candidate.create({
          name: u.name || "Unknown", email: u.email, applicant_id: uid,
          skills: [], education: [], experience: [], projects: [], certifications: [],
          source: "profile",
        });
        applicantCandidates.push(created);
        foundIds.add(uid);
      }
    }

    // Also get CSV/resume candidates uploaded directly for this job (with pagination)
    const importedCandidates = await Candidate.find({ job_id, source: { $in: ["csv", "resume"] } })
      .skip(skip)
      .limit(limit);
    const totalImported = await Candidate.countDocuments({ job_id, source: { $in: ["csv", "resume"] } });

    // Merge, deduplicate by _id
    const all = [...applicantCandidates];
    for (const c of importedCandidates) {
      if (!all.find((x) => x._id.toString() === c._id.toString())) all.push(c);
    }

    res.json({
      candidates: all,
      pagination: {
        page,
        limit,
        total: totalApps + totalImported,
        pages: Math.ceil((totalApps + totalImported) / limit),
        hasMore: page * limit < (totalApps + totalImported)
      }
    });
  } catch (err) { next(err); }
};

export const getMyApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apps = await Application.find({ applicant_id: (req as any).user.id })
      .populate("job_id", "title experience_level location deadline required_documents")
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) { next(err); }
};

export const updateApplicationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    res.json(app);
  } catch (err) { next(err); }
};

export const updateMyApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicant_id = (req as any).user.id;
    const app = await Application.findOne({ _id: req.params.id, applicant_id }).populate("job_id", "deadline");
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }

    const job = app.job_id as any;
    if (job?.deadline && new Date(job.deadline) < new Date()) {
      res.status(403).json({ error: "Cannot edit application after the job deadline has passed." });
      return;
    }

    const { cover_letter, answers } = req.body;
    app.cover_letter = cover_letter ?? app.cover_letter;
    if (typeof answers === "string") {
      try { app.answers = JSON.parse(answers); } catch {}
    } else if (answers) {
      app.answers = answers;
    }

    // Handle re-uploaded documents
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length > 0) {
      const newDocs: { name: string; filename: string; data: string }[] = [];
      let extractedText = "";
      for (const file of files) {
        newDocs.push({ name: file.fieldname || file.originalname, filename: file.originalname, data: file.buffer.toString("base64") });
        try {
          const { extractDocumentText } = await import("../services/parserService");
          const text = await extractDocumentText(file.buffer, file.originalname);
          if (text.trim()) extractedText += text + "\n";
        } catch {}
      }
      // Merge: replace docs with same name, keep others
      const existing = (app as any).documents || [];
      const newNames = new Set(newDocs.map((d) => d.name));
      const merged = [...existing.filter((d: any) => !newNames.has(d.name)), ...newDocs];
      (app as any).documents = merged;

      if (extractedText) {
        const applicant_id = (req as any).user.id;
        await Candidate.findOneAndUpdate({ applicant_id }, { $set: { cv_data: extractedText.slice(0, 10000) } });
      }
    }

    await app.save();
    res.json(app);
  } catch (err) { next(err); }
};

export const deleteMyApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicant_id = (req as any).user.id;
    const app = await Application.findOne({ _id: req.params.id, applicant_id }).populate("job_id", "deadline");
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }

    const job = app.job_id as any;
    if (job?.deadline && new Date(job.deadline) < new Date()) {
      res.status(403).json({ error: "Cannot cancel application after the job deadline has passed." });
      return;
    }
    if (app.status !== "pending") {
      res.status(403).json({ error: "Only pending applications can be cancelled." });
      return;
    }

    await app.deleteOne();
    res.json({ message: "Application cancelled" });
  } catch (err) { next(err); }
};

export const getMyJobsCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recruiter_id = (req as any).user.id;
    const jobs = await Job.find({ recruiter_id }).select("_id title");
    if (jobs.length === 0) { res.json([]); return; }

    const jobIds = jobs.map((j) => j._id);
    const jobMap: Record<string, string> = {};
    jobs.forEach((j) => { jobMap[j._id.toString()] = j.title; });

    // Only applicants who applied via the board (source: profile, matched by applicant_id)
    const apps = await Application.find({ job_id: { $in: jobIds } }).populate("applicant_id", "email name");
    const applicantJobsMap: Record<string, { _id: string; title: string; status: string }[]> = {};
    for (const app of apps) {
      const applicantId = (app.applicant_id as any)?._id?.toString();
      const jobId = app.job_id.toString();
      if (!applicantId) continue;
      if (!applicantJobsMap[applicantId]) applicantJobsMap[applicantId] = [];
      const existing = applicantJobsMap[applicantId].find((j) => j._id === jobId);
      if (!existing)
        applicantJobsMap[applicantId].push({ _id: jobId, title: jobMap[jobId] || "Unknown", status: app.status });
      else
        existing.status = app.status; // keep latest status
    }

    const applicantIds = Object.keys(applicantJobsMap);
    if (applicantIds.length === 0) { res.json([]); return; }

    // Only profile-source candidates (board applicants)
    const candidates = await Candidate.find({ applicant_id: { $in: applicantIds }, source: "profile" });

    // Auto-create missing
    const foundIds = new Set(candidates.map((c) => c.applicant_id?.toString()));
    for (const app of apps) {
      const u = app.applicant_id as any;
      const uid = u?._id?.toString();
      if (uid && !foundIds.has(uid)) {
        const created = await Candidate.create({
          name: u.name || "Unknown", email: u.email, applicant_id: uid,
          skills: [], education: [], experience: [], projects: [], certifications: [],
          source: "profile",
        });
        candidates.push(created);
        foundIds.add(uid);
      }
    }

    const result = candidates.map((c) => ({
      ...c.toObject(),
      jobs_applied: c.applicant_id ? (applicantJobsMap[c.applicant_id.toString()] || []) : [],
    }));

    res.json(result);
  } catch (err) { next(err); }
};

/**
 * Get applicant's User record for recruiters
 * Returns all non-sensitive user information:
 * - Personal: name, email, phone, date_of_birth, gender, nationality, residence, national_id, father_name, mother_name
 * - Account: role, createdAt
 * Excludes sensitive information:
 * - Security: password, resetToken, resetTokenExpiry
 * - Billing: plan, planExpiresAt, screeningsUsed, screeningsResetAt
 */
export const getApplicantUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Exclude only sensitive fields: password, reset tokens, plan/billing info
    const user = await User.findById(req.params.applicant_id).select(
      "-password -resetToken -resetTokenExpiry -plan -planExpiresAt -screeningsUsed -screeningsResetAt"
    );
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) { next(err); }
};

/**
 * Get applicant's Candidate profile for recruiters
 * Returns complete professional profile including:
 * - Basic: firstName, lastName, name, email, headline, bio, location
 * - Skills: skills[], languages[]
 * - Experience: experience[], projects[], certifications[]
 * - Education: education[]
 * - Availability: availability{}
 * - Social: socialLinks{}
 * - Documents: cv_filename, cv_data
 */
export const getApplicantProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicant_id = req.params.applicant_id;
    const candidate = await Candidate.findOne({ applicant_id });
    res.json(candidate || null);
  } catch (err) { next(err); }
};

export const getApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("applicant_id", "name email phone date_of_birth gender nationality residence father_name mother_name national_id")
      .populate("job_id", "title");
    if (!app) { res.status(404).json({ error: "Not found" }); return; }
    res.json(app);
  } catch (err) { next(err); }
};

// Returns all applications + csv/resume candidates for a job as a unified list
export const getAllJobEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { job_id } = req.params;

    // Get board applications
    const apps = await Application.find({ job_id })
      .populate("applicant_id", "name email phone date_of_birth gender nationality residence")
      .sort({ createdAt: -1 });
    const appEntries = apps.map((a) => ({ type: "application" as const, _id: a._id.toString(), data: a.toObject() }));

    // Get the job to find recruiter_id
    const job = await Job.findById(job_id).select("recruiter_id");
    if (!job) { res.json(appEntries); return; }

    // Find csv/resume candidates by this recruiter (the full pool, same as screening tab)
    // Also include candidates explicitly linked to this job_id
    const csvCandidates = await Candidate.find({
      source: { $in: ["csv", "resume"] },
      $or: [{ recruiter_id: job.recruiter_id }, { job_id }],
    }).sort({ createdAt: -1 });

    // Deduplicate by _id
    const seen = new Set<string>();
    const candidateEntries = csvCandidates
      .filter((c) => { const id = c._id.toString(); if (seen.has(id)) return false; seen.add(id); return true; })
      .map((c) => ({ type: "candidate" as const, _id: c._id.toString(), data: c.toObject() }));

    res.json([...appEntries, ...candidateEntries]);
  } catch (err) { next(err); }
};

// Update status on a csv/resume candidate
export const updateCandidateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
    res.json(candidate);
  } catch (err) { next(err); }
};

// Send email to all candidates for a job matching a status filter
export const sendBulkEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { job_id } = req.params;
    const { status, customMessage } = req.body; // status: "all" | "pending" | "reviewed" | "shortlisted" | "rejected"
    const recruiter = await User.findById((req as any).user.id).select("name");
    const job = await Job.findById(job_id).select("title recruiter_id");
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    // Collect recipients from Applications with their actual status
    const appQuery: any = { job_id };
    if (status && status !== "all") appQuery.status = status;
    const apps = await Application.find(appQuery).populate("applicant_id", "name email");

    // Collect recipients from csv/resume Candidates with their actual status
    const candQuery: any = { source: { $in: ["csv", "resume"] }, $or: [{ recruiter_id: job.recruiter_id }, { job_id }] };
    if (status && status !== "all") candQuery.status = status;
    const candidates = await Candidate.find(candQuery);

    const recipients: { name: string; email: string; status: string }[] = [];
    for (const app of apps) {
      const u = app.applicant_id as any;
      if (u?.email) recipients.push({ name: u.name || "Candidate", email: u.email, status: app.status });
    }
    for (const c of candidates) {
      if (c.email) recipients.push({ name: c.name, email: c.email, status: c.status || "pending" });
    }

    // Deduplicate by email
    const seen = new Set<string>();
    const unique = recipients.filter(r => { if (seen.has(r.email)) return false; seen.add(r.email); return true; });

    if (unique.length === 0) { res.status(400).json({ error: "No candidates with email addresses found for this filter" }); return; }

    let sent = 0, failed = 0;
    for (const r of unique) {
      try {
        await sendStatusEmail({ to: r.email, candidateName: r.name, jobTitle: job.title, status: r.status, customMessage, recruiterName: recruiter?.name });
        sent++;
      } catch { failed++; }
    }

    res.json({ sent, failed, total: unique.length });
  } catch (err) { next(err); }
};

// Send email to a single candidate (application or csv/resume)
export const sendSingleEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to, candidateName, jobTitle, status, customMessage } = req.body;
    if (!to || !candidateName || !jobTitle || !status) {
      res.status(400).json({ error: "to, candidateName, jobTitle, and status are required" }); return;
    }
    const recruiter = await User.findById((req as any).user.id).select("name");
    await sendStatusEmail({ to, candidateName, jobTitle, status, customMessage, recruiterName: recruiter?.name });
    res.json({ message: "Email sent" });
  } catch (err) { next(err); }
};
