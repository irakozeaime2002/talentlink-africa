import { Request, Response, NextFunction } from "express";
import { Application } from "../models/Application";
import { Candidate } from "../models/Candidate";
import { Job } from "../models/Job";
import { User } from "../models/User";

export const uploadMyCV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id).select("email name");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const cv_data = req.file.buffer.toString("base64");
    const cv_filename = req.file.originalname;
    const candidate = await Candidate.findOneAndUpdate(
      { email: user.email },
      { $set: { name: user.name, email: user.email, source: "profile", cv_data, cv_filename } },
      { upsert: true, new: true }
    );
    res.json({ cv_filename: candidate.cv_filename });
  } catch (err) { next(err); }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id).select("email name");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const candidate = await Candidate.findOne({ email: user.email });
    res.json(candidate || null);
  } catch (err) { next(err); }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as any).user.id).select("email name");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const candidate = await Candidate.findOneAndUpdate(
      { email: user.email },
      { $set: { name: user.name, email: user.email, source: "profile", ...req.body } },
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

    // Upsert candidate record by email
    const existingCandidate = await Candidate.findOne({ email: user.email });
    await Candidate.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          name: user.name,
          email: user.email,
          source: "profile",
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
    const apps = await Application.find({ job_id: req.params.job_id })
      .populate("applicant_id", "name email")
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) { next(err); }
};

export const getJobApplicantCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job_id = req.params.job_id;

    // Get applicants who applied via the board
    const apps = await Application.find({ job_id }).populate("applicant_id", "email name");
    const emails = apps.map((a) => (a.applicant_id as any)?.email).filter(Boolean);
    const applicantCandidates = emails.length > 0 ? await Candidate.find({ email: { $in: emails } }) : [];

    // Auto-create missing candidate records for applicants
    const foundEmails = new Set(applicantCandidates.map((c) => c.email));
    for (const app of apps) {
      const u = app.applicant_id as any;
      if (u?.email && !foundEmails.has(u.email)) {
        const created = await Candidate.create({
          name: u.name || "Unknown", email: u.email,
          skills: [], education: [], experience: [], projects: [], certifications: [],
          source: "profile",
        });
        applicantCandidates.push(created);
        foundEmails.add(u.email);
      }
    }

    // Also get CSV/resume candidates uploaded directly for this job
    const importedCandidates = await Candidate.find({ job_id, source: { $in: ["csv", "resume"] } });

    // Merge, deduplicate by _id
    const all = [...applicantCandidates];
    for (const c of importedCandidates) {
      if (!all.find((x) => x._id.toString() === c._id.toString())) all.push(c);
    }

    res.json(all);
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
        const user = await User.findById((req as any).user.id).select("email");
        if (user?.email) {
          await Candidate.findOneAndUpdate({ email: user.email }, { $set: { cv_data: extractedText.slice(0, 10000) } });
        }
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

    // Only applicants who applied via the board (source: profile, matched by email)
    const apps = await Application.find({ job_id: { $in: jobIds } }).populate("applicant_id", "email name");
    const emailJobsMap: Record<string, { _id: string; title: string; status: string }[]> = {};
    for (const app of apps) {
      const email = (app.applicant_id as any)?.email;
      const jobId = app.job_id.toString();
      if (!email) continue;
      if (!emailJobsMap[email]) emailJobsMap[email] = [];
      const existing = emailJobsMap[email].find((j) => j._id === jobId);
      if (!existing)
        emailJobsMap[email].push({ _id: jobId, title: jobMap[jobId] || "Unknown", status: app.status });
      else
        existing.status = app.status; // keep latest status
    }

    const emails = Object.keys(emailJobsMap);
    if (emails.length === 0) { res.json([]); return; }

    // Only profile-source candidates (board applicants)
    const candidates = await Candidate.find({ email: { $in: emails }, source: "profile" });

    // Auto-create missing
    const foundEmails = new Set(candidates.map((c) => c.email));
    for (const app of apps) {
      const u = app.applicant_id as any;
      if (u?.email && !foundEmails.has(u.email)) {
        const created = await Candidate.create({
          name: u.name || "Unknown", email: u.email,
          skills: [], education: [], experience: [], projects: [], certifications: [],
          source: "profile",
        });
        candidates.push(created);
        foundEmails.add(u.email);
      }
    }

    const result = candidates.map((c) => ({
      ...c.toObject(),
      jobs_applied: c.email ? (emailJobsMap[c.email] || []) : [],
    }));

    res.json(result);
  } catch (err) { next(err); }
};

export const getApplicantUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.applicant_id).select("-password");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) { next(err); }
};

export const getApplicantProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.applicant_id).select("email name");
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const candidate = await Candidate.findOne({ email: user.email });
    res.json(candidate || null);
  } catch (err) { next(err); }
};

export const getApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("applicant_id", "name email")
      .populate("job_id", "title");
    if (!app) { res.status(404).json({ error: "Not found" }); return; }
    res.json(app);
  } catch (err) { next(err); }
};
