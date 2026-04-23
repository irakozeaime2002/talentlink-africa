import { Router } from "express";
import {
  applyToJob,
  getJobApplications,
  getJobApplicantCandidates,
  getMyApplications,
  updateApplicationStatus,
  updateMyApplication,
  deleteMyApplication,
  getMyJobsCandidates,
  getApplicantProfile,
  getApplicantUser,
  getApplication,
  getMyProfile,
  updateMyProfile,
  uploadMyCV,
  getAllJobEntries,
  updateCandidateStatus,
  sendBulkEmail,
  sendSingleEmail,
} from "../controllers/applicationController";
import { authenticate, requireRole } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { limitApplications, limitCVUpload } from "../middleware/planLimits";

const router = Router();

router.get("/applicant/:applicant_id/profile", authenticate, requireRole("recruiter"), getApplicantProfile);
router.get("/applicant/:applicant_id/user", authenticate, requireRole("recruiter"), getApplicantUser);
router.get("/my-jobs-candidates", authenticate, requireRole("recruiter"), getMyJobsCandidates);
router.get("/my-profile", authenticate, requireRole("applicant"), getMyProfile);
router.put("/my-profile", authenticate, requireRole("applicant"), updateMyProfile);
router.post("/my-cv", authenticate, requireRole("applicant"), limitCVUpload, upload.single("cv"), uploadMyCV);
router.post("/job/:job_id", authenticate, requireRole("applicant"), limitApplications, upload.any(), applyToJob);
router.post("/job/:job_id/email", authenticate, requireRole("recruiter"), sendBulkEmail);
router.post("/email-one", authenticate, requireRole("recruiter"), sendSingleEmail);
router.get("/job/:job_id/all", authenticate, requireRole("recruiter"), getAllJobEntries);
router.patch("/candidate/:id/status", authenticate, requireRole("recruiter"), updateCandidateStatus);
router.get("/job/:job_id", authenticate, requireRole("recruiter"), getJobApplications);
router.get("/job/:job_id/candidates", authenticate, requireRole("recruiter"), getJobApplicantCandidates);
router.get("/my", authenticate, requireRole("applicant"), getMyApplications);
router.patch("/:id", authenticate, requireRole("applicant"), upload.any(), updateMyApplication);
router.delete("/:id", authenticate, requireRole("applicant"), deleteMyApplication);
router.patch("/:id/status", authenticate, requireRole("recruiter"), updateApplicationStatus);
router.get("/:id", authenticate, getApplication);

export default router;
