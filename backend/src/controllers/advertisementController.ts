import { Request, Response, NextFunction } from "express";
import { Advertisement } from "../models/Advertisement";

export const getAds = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ads = await Advertisement.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) { next(err); }
};

export const getPublicAds = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ads = await Advertisement.find({ active: true }).sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) { next(err); }
};

export const createAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ad = await Advertisement.create(req.body);
    res.status(201).json(ad);
  } catch (err) { next(err); }
};

export const updateAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ad) { res.status(404).json({ error: "Ad not found" }); return; }
    res.json(ad);
  } catch (err) { next(err); }
};

export const deleteAd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Advertisement.findByIdAndDelete(req.params.id);
    res.json({ message: "Ad deleted" });
  } catch (err) { next(err); }
};
