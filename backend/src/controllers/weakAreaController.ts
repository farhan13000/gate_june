import { Request, Response } from "express";
import { weakAreaService } from "../services/dashboard/weakAreaService";

export const getWeakAreaIntelligence = async (req: Request, res: Response) => {
  try {
    res.json(await weakAreaService.getWeakAreaIntelligence(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Weak area intelligence unavailable" });
  }
};

export const getConceptStability = async (req: Request, res: Response) => {
  try {
    res.json(await weakAreaService.getConceptStability(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Concept stability unavailable" });
  }
};

export const getRevisionRisk = async (req: Request, res: Response) => {
  try {
    res.json(await weakAreaService.getRevisionRisk(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Revision risk unavailable" });
  }
};

export const getErrorAnalysis = async (req: Request, res: Response) => {
  try {
    res.json(await weakAreaService.getErrorAnalysis(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Error analysis unavailable" });
  }
};
