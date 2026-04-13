import { Request, Response, NextFunction } from "express";
import { PlanConfig } from "../models/PlanConfig";

// Get all plan configurations
export const getAllPlanConfigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const configs = await PlanConfig.find().sort({ plan: 1 });
    res.json(configs);
  } catch (err) {
    next(err);
  }
};

// Get single plan configuration
export const getPlanConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = await PlanConfig.findOne({ plan: req.params.plan });
    if (!config) {
      res.status(404).json({ error: "Plan configuration not found" });
      return;
    }
    res.json(config);
  } catch (err) {
    next(err);
  }
};

// Update plan configuration (admin only)
export const updatePlanConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { maxJobs, maxScreeningsPerMonth, csvUpload, resumeUpload } = req.body;
    
    let config = await PlanConfig.findOne({ plan: req.params.plan });
    
    if (!config) {
      // Create if doesn't exist
      config = await PlanConfig.create({
        plan: req.params.plan,
        maxJobs,
        maxScreeningsPerMonth,
        csvUpload,
        resumeUpload,
      });
    } else {
      // Update existing
      if (maxJobs !== undefined) config.maxJobs = maxJobs;
      if (maxScreeningsPerMonth !== undefined) config.maxScreeningsPerMonth = maxScreeningsPerMonth;
      if (csvUpload !== undefined) config.csvUpload = csvUpload;
      if (resumeUpload !== undefined) config.resumeUpload = resumeUpload;
      await config.save();
    }
    
    res.json(config);
  } catch (err) {
    next(err);
  }
};

// Initialize default plan configurations
export const initializePlanConfigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const defaults = [
      { plan: "free", maxJobs: 3, maxScreeningsPerMonth: 5, csvUpload: false, resumeUpload: false },
      { plan: "pro", maxJobs: 50, maxScreeningsPerMonth: 50, csvUpload: true, resumeUpload: true },
      { plan: "enterprise", maxJobs: -1, maxScreeningsPerMonth: -1, csvUpload: true, resumeUpload: true },
    ];

    const results = [];
    for (const def of defaults) {
      const existing = await PlanConfig.findOne({ plan: def.plan });
      if (!existing) {
        const created = await PlanConfig.create(def);
        results.push(created);
      } else {
        results.push(existing);
      }
    }

    res.json({ message: "Plan configurations initialized", configs: results });
  } catch (err) {
    next(err);
  }
};
