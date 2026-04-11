import { Router } from "express";
import { initiatePayment, verifyPayment, getPaymentHistory } from "../controllers/paymentController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("recruiter"));
router.post("/initiate", initiatePayment);
router.get("/verify/:ref", verifyPayment);
router.get("/history", getPaymentHistory);

export default router;
