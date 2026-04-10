import { Router } from "express";
import { createJob, getJobs, getJob, updateJob, deleteJob, getPublicJobs } from "../controllers/jobController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Public job board
router.get("/public", getPublicJobs);
router.get("/public/:id", getJob);

// Recruiter-only
router.post("/", authenticate, requireRole("recruiter"), createJob);
router.get("/", authenticate, requireRole("recruiter"), getJobs);
router.get("/:id", authenticate, getJob);
router.put("/:id", authenticate, requireRole("recruiter"), updateJob);
router.delete("/:id", authenticate, requireRole("recruiter"), deleteJob);

export default router;
