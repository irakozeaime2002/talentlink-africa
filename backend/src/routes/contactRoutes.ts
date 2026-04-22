import { Router } from "express";
import {
  createContactMessage,
  getAllContactMessages,
  getContactMessage,
  updateContactMessageStatus,
  deleteContactMessage,
} from "../controllers/contactController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Public route - anyone can send a message
router.post("/", createContactMessage);

// Admin routes - only admins can view/manage messages
router.get("/", authenticate, requireRole("admin"), getAllContactMessages);
router.get("/:id", authenticate, requireRole("admin"), getContactMessage);
router.patch("/:id/status", authenticate, requireRole("admin"), updateContactMessageStatus);
router.delete("/:id", authenticate, requireRole("admin"), deleteContactMessage);

export default router;
