import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { seedPlanConfigs } from "./controllers/adminController";
import jobRoutes from "./routes/jobRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import screeningRoutes from "./routes/screeningRoutes";
import authRoutes from "./routes/authRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import seedRoutes from "./routes/seedRoutes";
import adminRoutes from "./routes/adminRoutes";
import chatRoutes from "./routes/chatRoutes";
import planRoutes from "./routes/planRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.CLIENT_URL || "";
    // Allow requests with no origin (mobile, Postman) or matching vercel/localhost
    if (!origin || origin === allowed || origin.includes("vercel.app") || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/screening", screeningRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/payment", paymentRoutes);

// Public plan config endpoints (no auth required)
app.get("/api/public/plan-configs", async (_req, res, next) => {
  try {
    const { PlanConfig } = await import("./models/PlanConfig");
    const configs = await PlanConfig.find().sort({ plan: 1 });
    res.json(configs);
  } catch (err) { next(err); }
});
app.get("/api/public/applicant-plan-configs", async (_req, res, next) => {
  try {
    const { ApplicantPlanConfig } = await import("./models/ApplicantPlanConfig");
    const configs = await ApplicantPlanConfig.find().sort({ plan: 1 });
    res.json(configs);
  } catch (err) { next(err); }
});
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedPlanConfigs();

  // Run expired plan check every hour
  const checkExpiredPlans = async () => {
    try {
      const { User } = await import("./models/User");
      const result = await User.updateMany(
        { plan: { $ne: "free" }, planExpiresAt: { $lt: new Date() } },
        { $set: { plan: "free" }, $unset: { planExpiresAt: "" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Plan] Downgraded ${result.modifiedCount} expired plan(s) to free`);
      }
    } catch (err) { console.error("[Plan] Expiry check failed", err); }
  };

  await checkExpiredPlans();
  setInterval(checkExpiredPlans, 60 * 60 * 1000); // every hour

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
