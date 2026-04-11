import { Router } from "express";
import { upgradePlan, getPlan } from "../controllers/planController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("recruiter"));
router.get("/", getPlan);
router.post("/upgrade", upgradePlan);

export default router;
