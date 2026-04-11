import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  getStats, getUsers, getUser, updateUser, deleteUser, resetUserPassword,
  getJobs, deleteJob, updateJobStatus,
  getApplications, getScreenings, createAdmin,
  getPlanConfigs, updatePlanConfig,
  getApplicantPlanConfigs, updateApplicantPlanConfig,
  getSubscriptions, updateUserPlan,
} from "../controllers/adminController";

const router = Router();
const admin = [authenticate, requireRole("admin")];

router.get("/stats", ...admin, getStats);

router.get("/users", ...admin, getUsers);
router.get("/users/:id", ...admin, getUser);
router.put("/users/:id", ...admin, updateUser);
router.delete("/users/:id", ...admin, deleteUser);
router.post("/users/:id/reset-password", ...admin, resetUserPassword);

router.get("/jobs", ...admin, getJobs);
router.delete("/jobs/:id", ...admin, deleteJob);
router.patch("/jobs/:id/status", ...admin, updateJobStatus);

router.get("/applications", ...admin, getApplications);
router.get("/screenings", ...admin, getScreenings);

router.post("/create-admin", ...admin, createAdmin);

router.get("/plan-configs", ...admin, getPlanConfigs);
router.put("/plan-configs/:plan", ...admin, updatePlanConfig);
router.get("/applicant-plan-configs", ...admin, getApplicantPlanConfigs);
router.put("/applicant-plan-configs/:plan", ...admin, updateApplicantPlanConfig);

router.get("/subscriptions", ...admin, getSubscriptions);
router.patch("/subscriptions/:id/plan", ...admin, updateUserPlan);

export default router;
