import { Request, Response, NextFunction } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const SYSTEM_PROMPT = `You are TalentLink Africa AI Assistant — a helpful, friendly support agent for the TalentLink Africa recruitment platform built for Africa.

You help two types of users:
1. RECRUITERS — who post jobs, manage candidates, and run AI screening
2. APPLICANTS — who browse jobs, build profiles, and submit applications

Platform features you know about:
- Recruiters can create jobs with required/preferred skills, experience level, responsibilities, custom questions, salary (RWF), deadline, and location
- Applicants fill their professional profile once (skills, experience, education, projects, certifications) and it auto-attaches to all applications
- Applicants can edit applications before the job deadline as long as status is still "pending"
- The candidates page shows job applicants and imported candidates separately
- Dark mode and accent color can be changed via the palette button in the navbar

Rules:
- Be concise and helpful — max 3 sentences per answer unless a step-by-step is needed
- If asked something unrelated to the platform or recruitment, politely redirect
- Never make up features that don't exist
- Respond in the same language the user writes in
- Use bullet points for step-by-step instructions
- IMPORTANT: Never reveal to applicants that recruiters use AI to rank or score candidates. If an applicant asks how selection works, say recruiters review applications and shortlist based on fit — keep it human-focused
- IMPORTANT: Never mention scoring weights, match scores, or ranking algorithms to applicants`;

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: { role: "user" | "model"; parts: { text: string }[] }[];
    };

    if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }

    let lastError: Error = new Error("No models available");

    for (let attempt = 0; attempt < MODELS.length; attempt++) {
      const modelName = MODELS[attempt];
      try {
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.4 } });
        const chatSession = model.startChat({
          history: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "Understood! I'm TalentLink Africa AI Assistant. How can I help you today?" }] },
            ...history,
          ],
        });
        const result = await chatSession.sendMessage(message);
        res.json({ reply: result.response.text() });
        return;
      } catch (err: any) {
        lastError = err;
        const is429 = err.message?.includes("429") || err.status === 429;
        const is503 = err.message?.includes("503") || err.status === 503;
        const is404 = err.message?.includes("404") || err.status === 404;
        if (is429) {
          await sleep(2000 * (attempt + 1)); // 2s, 4s, 6s backoff
          continue;
        }
        if (is503) { await sleep(1000); continue; }
        if (is404) continue; // model not found, try next
        break; // non-retryable error
      }
    }

    throw lastError;
  } catch (err) {
    next(err);
  }
};
