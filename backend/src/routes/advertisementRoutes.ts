import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { getAds, createAd, updateAd, deleteAd } from "../controllers/advertisementController";

const router = Router();
const admin = [authenticate, requireRole("admin")];

router.get("/", ...admin, getAds);
router.post("/", ...admin, createAd);
router.put("/:id", ...admin, updateAd);
router.delete("/:id", ...admin, deleteAd);

export default router;
