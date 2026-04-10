import { Router } from "express";
import { runScreening, getScreeningResults, getScreeningResult, deleteScreeningResult } from "../controllers/screeningController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, requireRole("recruiter"), runScreening);
router.get("/job/:job_id", authenticate, requireRole("recruiter"), getScreeningResults);
router.delete("/:id", authenticate, requireRole("recruiter"), deleteScreeningResult);
router.get("/:id", authenticate, getScreeningResult);

export default router;
