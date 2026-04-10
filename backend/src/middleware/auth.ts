import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) { res.status(401).json({ error: "No token" }); return; }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { id: string; email: string; role: string };
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes((req as any).user?.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
