import { Router } from "express";
import { createJob, getJobs, getJob, updateJob, deleteJob, getPublicJobs, getPublicJob } from "../controllers/jobController";
import { authenticate, requireRole } from "../middleware/auth";
import { limitJobs } from "../middleware/planLimits";

const router = Router();

// Public job board
router.get("/public", getPublicJobs);
router.get("/public/:id", getPublicJob);

// Recruiter-only
router.post("/", authenticate, requireRole("recruiter"), limitJobs, createJob);
router.get("/", authenticate, requireRole("recruiter"), getJobs);
router.get("/:id", authenticate, getJob);
router.put("/:id", authenticate, requireRole("recruiter"), updateJob);
router.delete("/:id", authenticate, requireRole("recruiter"), deleteJob);

export default router;
