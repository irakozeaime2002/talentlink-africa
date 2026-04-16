import { Router } from "express";
import { chat } from "../controllers/chatController";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Optional authentication - chat works for both logged-in users and guests
const optionalAuth = (req: any, res: any, next: any) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as { id: string; email: string; role: string };
      req.user = payload;
    } catch {
      // Invalid token - treat as guest
      req.user = null;
    }
  } else {
    // No token - treat as guest
    req.user = null;
  }
  next();
};

router.post("/", optionalAuth, chat);

export default router;
