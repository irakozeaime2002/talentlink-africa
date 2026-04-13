import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("[Error]", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error("[Error Stack]", err.stack);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e: any) => e.message).join(", ");
    res.status(400).json({ error: messages });
    return;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    res.status(409).json({ error: `${field} already exists.` });
    return;
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    res.status(400).json({ error: "Invalid ID format." });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    res.status(401).json({ error: "Session expired. Please log in again." });
    return;
  }

  // Gemini / external API quota
  if (err.message?.includes("429") || err.message?.includes("quota")) {
    res.status(429).json({ error: "AI service is busy. Please wait a moment and try again." });
    return;
  }

  // Gemini model not found
  if (err.message?.includes("404") && err.message?.includes("model")) {
    res.status(500).json({ error: "AI model unavailable. Please contact support." });
    return;
  }

  // JSON parse error from Gemini response
  if (err.message?.includes("JSON") || err.name === "SyntaxError") {
    res.status(500).json({ error: "AI returned an unexpected response. Please try again." });
    return;
  }

  // All Gemini models unavailable
  if (err.message?.includes("All Gemini models unavailable")) {
    res.status(503).json({ error: "AI service is temporarily unavailable. Please try again in a few minutes." });
    return;
  }

  res.status(500).json({ error: err.message || "Something went wrong. Please try again." });
};
