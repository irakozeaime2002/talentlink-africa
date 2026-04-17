import { Request, Response, NextFunction } from "express";
import { Job } from "../models/Job";
import { Candidate } from "../models/Candidate";
import { Application } from "../models/Application";
import { ScreeningResult } from "../models/ScreeningResult";
import { screenCandidates } from "../services/aiService";
import { CandidateInput, JobInput } from "../types";

/**
 * Runs AI screening on selected candidates for a job
 * 
 * This is the main endpoint recruiters use to get AI-powered candidate rankings.
 * It handles all the complexity of gathering candidate data, checking plan limits,
 * calling the AI service, and saving the results.
 * 
 * The flow:
 * 1. Validate the request and check if the recruiter has screening credits left
 * 2. Fetch all candidate profiles and their application data (cover letters, answers, documents)
 * 3. Send everything to the AI service for evaluation
 * 4. Save the ranked results and increment the usage counter
 * 
 * Plan limits are enforced here - free users get 5 screenings/month, pro gets 50, enterprise unlimited.
 */
export const runScreening = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { job_id, candidate_ids, top_n = 20 } = req.body as {
      job_id: string;
      candidate_ids: string[];
      top_n?: number;
    };

    console.log(`[Screening] Starting for job ${job_id} with ${candidate_ids.length} candidates`);

    if (!job_id || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      res.status(400).json({ error: "job_id and candidate_ids are required" });
      return;
    }

    const job = await Job.findById(job_id);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    console.log(`[Screening] Job found: ${job.title}`);

    // Check if the recruiter has hit their monthly screening limit
    // Free plan = 5/month, Pro = 50/month, Enterprise = unlimited (-1)
    const User = (await import("../models/User")).User;
    const PlanConfig = (await import("../models/PlanConfig")).PlanConfig;
    const recruiter = await User.findById((req as any).user?.id);
    if (!recruiter) { res.status(404).json({ error: "User not found" }); return; }

    console.log(`[Screening] Recruiter: ${recruiter.email}, Plan: ${recruiter.plan}`);

    // Get plan configuration from database (admin-configurable)
    let planConfig = await PlanConfig.findOne({ plan: recruiter.plan });
    
    // If no config exists, create default
    if (!planConfig) {
      const defaults = {
        free: { maxJobs: 3, maxScreeningsPerMonth: 5, csvUpload: false, resumeUpload: false },
        pro: { maxJobs: 50, maxScreeningsPerMonth: 50, csvUpload: true, resumeUpload: true },
        enterprise: { maxJobs: -1, maxScreeningsPerMonth: -1, csvUpload: true, resumeUpload: true },
      };
      planConfig = await PlanConfig.create({ plan: recruiter.plan, ...defaults[recruiter.plan] });
    }

    const limit = planConfig.maxScreeningsPerMonth;
    const now = new Date();
    const resetDate = recruiter.screeningsResetAt || new Date(0);

    // Reset the counter if it's been more than 30 days since last reset
    // This gives users a fresh batch of screenings each month
    if (now.getTime() - resetDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
      recruiter.screeningsUsed = 0;
      recruiter.screeningsResetAt = now;
      await recruiter.save();
    }

    console.log(`[Screening] Usage: ${recruiter.screeningsUsed}/${limit}`);

    // Check if limit reached (-1 means unlimited)
    if (limit !== -1 && recruiter.screeningsUsed >= limit) {
      res.status(403).json({
        error: "Screening limit reached",
        message: `You have reached your ${recruiter.plan} plan limit of ${limit} screenings per month. Upgrade your plan to continue.`,
        plan: recruiter.plan,
        used: recruiter.screeningsUsed,
        limit,
      });
      return;
    }

    const candidates = await Candidate.find({ _id: { $in: candidate_ids } });
    if (candidates.length === 0) { res.status(400).json({ error: "No candidates found" }); return; }

    console.log(`[Screening] Found ${candidates.length} candidates`);

    // Fetch applications to get cover letters, answers, and uploaded documents
    // These give us way more context than just the basic profile
    const applications = await Application.find({ job_id });
    console.log(`[Screening] Found ${applications.length} applications`);

    const applicantIdToAppData: Record<string, {
      cover_letter: string;
      answers: { question: string; answer: string }[];
      documents: { name: string; text: string }[];
    }> = {};

    for (const app of applications) {
      const applicantId = app.applicant_id.toString();

      // Try to extract text from each uploaded document (CV, certificates, etc)
      // We send this text to the AI so it can validate document quality
      const docTexts: { name: string; text: string }[] = [];
      for (const doc of (app.documents || [])) {
        try {
          const buf = Buffer.from(doc.data, "base64");
          const { extractDocumentText } = await import("../services/parserService");
          const text = await extractDocumentText(buf, doc.filename);
          if (text.trim()) docTexts.push({ name: doc.filename, text: text.slice(0, 3000) });
        } catch {}
      }

      applicantIdToAppData[applicantId] = {
        cover_letter: app.cover_letter || "",
        answers: app.answers || [],
        documents: docTexts,
      };
    }

    console.log(`[Screening] Prepared application data for ${Object.keys(applicantIdToAppData).length} applicants`);

    const jobInput: JobInput = {
      title: job.title,
      description: job.description,
      required_skills: job.required_skills,
      preferred_skills: job.preferred_skills,
      experience_level: job.experience_level,
      responsibilities: job.responsibilities,
      required_documents: (job.required_documents || []).map(d => d.name),
      application_questions: job.application_questions || [],
    };

    const candidateInputs: CandidateInput[] = candidates.map((c) => {
      const appData = c.applicant_id ? applicantIdToAppData[c.applicant_id.toString()] : undefined;
      // Decode the CV from base64 if they uploaded one
      // Limit to 4000 chars to keep the prompt size reasonable
      let cvText: string | undefined;
      if (c.cv_data) {
        try {
          cvText = Buffer.from(c.cv_data, "base64").toString("utf-8").slice(0, 4000);
        } catch { cvText = c.cv_data.slice(0, 4000); }
      }
      // Combine all document texts with labels so the AI knows what each file is
      // Format: [Document: resume.pdf]\n<content>\n\n[Document: certificate.pdf]\n<content>
      const docTexts = appData?.documents?.map((d) =>
        `[Document: ${d.name}]\n${d.text}`
      ).join("\n\n") || "";

      const input = {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        skills: c.skills,
        languages: c.languages || [], // CRITICAL: Include languages for language requirement matching
        education: c.education,
        experience: c.experience,
        projects: c.projects,
        certifications: c.certifications,
        bio: c.bio?.slice(0, 1000), // Limit bio to 1000 chars
        headline: c.headline, // Professional tagline
        location: c.location, // Current location
        ...(cvText ? { cv_text: cvText } : {}),
        ...(docTexts ? { attached_documents: docTexts } : {}),
        ...(appData?.cover_letter ? { cover_letter: appData.cover_letter } : {}),
        ...(appData?.answers?.length ? { application_answers: appData.answers } : {}),
      };
      
      console.log(`[Screening] Candidate ${c.name}: skills=${c.skills.length}, languages=${(c.languages || []).length}, exp=${c.experience.length}, edu=${c.education.length}, bio=${c.bio?.length || 0}`);
      
      return input;
    });

    console.log(`[Screening] Prepared ${candidateInputs.length} candidate inputs, calling AI...`);

    const output = await screenCandidates(jobInput, candidateInputs, top_n);
    
    console.log(`[Screening] AI returned ${output.ranking.length} ranked candidates`);

    const result = await ScreeningResult.create({ job_id, ...output });

    // Increment the screening counter - this is permanent and can't be reset by deleting results
    // This prevents abuse where users delete results to get more free screenings
    recruiter.screeningsUsed += 1;
    await recruiter.save();

    console.log(`[Screening] Success! Result ID: ${result._id}`);

    res.status(201).json(result);
  } catch (err) {
    console.error("[Screening error]", (err as Error).message);
    console.error("[Screening error stack]", (err as Error).stack);
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
    // Set no-cache headers to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const results = await ScreeningResult.find({ job_id: req.params.job_id })
      .sort({ createdAt: -1 });
    
    // Fetch current job details to replace stored job_summary
    const job = await Job.findById(req.params.job_id);
    if (job) {
      const currentJobSummary = {
        role: job.title,
        key_requirements: [],
        must_have_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
      };
      
      // Replace job_summary with current job details
      const updatedResults = results.map(r => ({
        ...r.toObject(),
        job_summary: currentJobSummary,
      }));
      
      res.json(updatedResults);
    } else {
      res.json(results);
    }
  } catch (err) { next(err); }
};

export const getScreeningResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Set no-cache headers to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const result = await ScreeningResult.findById(req.params.id);
    if (!result) { res.status(404).json({ error: "Result not found" }); return; }
    
    // Fetch current job details to replace stored job_summary
    const job = await Job.findById(result.job_id);
    if (job) {
      const currentJobSummary = {
        role: job.title,
        key_requirements: [],
        must_have_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
      };
      
      const updatedResult = {
        ...result.toObject(),
        job_summary: currentJobSummary,
      };
      
      res.json(updatedResult);
    } else {
      res.json(result);
    }
  } catch (err) { next(err); }
};
