import { Request, Response } from "express";
import { timeAnalysisService } from "../services/dashboard/timeAnalysisService";

export const getTimeAnalysisIntelligence = async (req: Request, res: Response) => {
  try {
    res.json(await timeAnalysisService.getTimeAnalysis(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Time analysis unavailable" });
  }
};

export const getPacingAnalysis = async (req: Request, res: Response) => {
  try {
    res.json(await timeAnalysisService.getPacing(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Pacing analysis unavailable" });
  }
};

export const getSessionAnalysis = async (req: Request, res: Response) => {
  try {
    res.json(await timeAnalysisService.getSessionAnalysis(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Session analysis unavailable" });
  }
};

export const getTimeDistribution = async (req: Request, res: Response) => {
  try {
    res.json(await timeAnalysisService.getTimeDistribution(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Time distribution unavailable" });
  }
};
