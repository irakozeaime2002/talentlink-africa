import { Router } from "express";
import { register, login, getMe, updateMe, upgradePlan, forgotPassword, resetPassword, changePassword } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
router.post("/change-password", authenticate, changePassword);
router.post("/upgrade-plan", authenticate, upgradePlan);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
