import { Router } from "express";
import {
  createCandidate,
  getCandidates,
  getCandidate,
  deleteCandidate,
  uploadCSV,
  uploadResumes,
} from "../controllers/candidateController";
import { upload } from "../middleware/upload";
import { authenticate, requireRole } from "../middleware/auth";
import { requireCSVUpload, requireResumeUpload } from "../middleware/planLimits";

const router = Router();

router.use(authenticate, requireRole("recruiter"));

router.post("/", createCandidate);
router.get("/", getCandidates);
router.get("/:id", getCandidate);
router.delete("/:id", deleteCandidate);
router.post("/upload/csv", requireCSVUpload, upload.single("file"), uploadCSV);
router.post("/upload/resumes", requireResumeUpload, upload.array("files", 50), uploadResumes);

export default router;
