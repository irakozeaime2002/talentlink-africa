import { Request, Response, NextFunction } from "express";
import { Job } from "../models/Job";
import { Candidate } from "../models/Candidate";
import { Application } from "../models/Application";
import { ScreeningResult } from "../models/ScreeningResult";
import { screenCandidates } from "../services/aiService";
import { CandidateInput, JobInput } from "../types";

export const runScreening = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { job_id, candidate_ids, top_n = 20 } = req.body as {
      job_id: string;
      candidate_ids: string[];
      top_n?: number;
    };

    if (!job_id || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      res.status(400).json({ error: "job_id and candidate_ids are required" });
      return;
    }

    const job = await Job.findById(job_id);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    const candidates = await Candidate.find({ _id: { $in: candidate_ids } });
    if (candidates.length === 0) { res.status(400).json({ error: "No candidates found" }); return; }

    // Fetch applications for this job to get cover letters, answers, and ALL documents
    const applications = await Application.find({ job_id });
    const User = (await import("../models/User")).User;
    const emailToAppData: Record<string, {
      cover_letter: string;
      answers: { question: string; answer: string }[];
      documents: { name: string; text: string }[];
    }> = {};

    for (const app of applications) {
      const user = await User.findById(app.applicant_id).select("email");
      if (!user?.email) continue;

      // Extract text from all uploaded documents using type-aware extractor
      const docTexts: { name: string; text: string }[] = [];
      for (const doc of (app.documents || [])) {
        try {
          const buf = Buffer.from(doc.data, "base64");
          const { extractDocumentText } = await import("../services/parserService");
          const text = await extractDocumentText(buf, doc.filename);
          if (text.trim()) docTexts.push({ name: doc.filename, text: text.slice(0, 3000) });
        } catch {}
      }

      emailToAppData[user.email] = {
        cover_letter: app.cover_letter || "",
        answers: app.answers || [],
        documents: docTexts,
      };
    }

    const jobInput: JobInput = {
      title: job.title,
      description: job.description,
      required_skills: job.required_skills,
      preferred_skills: job.preferred_skills,
      experience_level: job.experience_level,
      responsibilities: job.responsibilities,
    };

    const candidateInputs: CandidateInput[] = candidates.map((c) => {
      const appData = c.email ? emailToAppData[c.email] : undefined;
      // Decode CV from base64 if present
      let cvText: string | undefined;
      if (c.cv_data) {
        try {
          cvText = Buffer.from(c.cv_data, "base64").toString("utf-8").slice(0, 4000);
        } catch { cvText = c.cv_data.slice(0, 4000); }
      }
      // Build combined document text from all uploaded docs
      const docTexts = appData?.documents?.map((d) =>
        `[Document: ${d.name}]\n${d.text}`
      ).join("\n\n") || "";

      return {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        skills: c.skills,
        education: c.education,
        experience: c.experience,
        projects: c.projects,
        certifications: c.certifications,
        ...(cvText ? { cv_text: cvText } : {}),
        ...(docTexts ? { attached_documents: docTexts } : {}),
        ...(appData?.cover_letter ? { cover_letter: appData.cover_letter } : {}),
        ...(appData?.answers?.length ? { application_answers: appData.answers } : {}),
      };
    });

    const output = await screenCandidates(jobInput, candidateInputs, top_n);
    const result = await ScreeningResult.create({ job_id, ...output });
    res.status(201).json(result);
  } catch (err) {
    console.error("[Screening error]", (err as Error).message);
    next(err);
  }
};

export const deleteScreeningResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ScreeningResult.findByIdAndDelete(req.params.id);
    if (!result) { res.status(404).json({ error: "Result not found" }); return; }
    res.json({ message: "Deleted" });
  } catch (err) { next(err); }
};

export const getScreeningResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await ScreeningResult.find({ job_id: req.params.job_id })
      .sort({ createdAt: -1 })
      .populate("job_id", "title");
    res.json(results);
  } catch (err) { next(err); }
};

export const getScreeningResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ScreeningResult.findById(req.params.id).populate("job_id", "title");
    if (!result) { res.status(404).json({ error: "Result not found" }); return; }
    res.json(result);
  } catch (err) { next(err); }
};
