import { Router } from "express";
import { getStats } from "../controllers/seedController";

const router = Router();

// Platform stats
router.get("/stats", getStats);

export default router;
