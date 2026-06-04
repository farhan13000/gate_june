import { Request, Response } from "express";
import { skillProfilingService } from "../services/dashboard/skillProfilingService";

export const getSkillsProfile = async (req: Request, res: Response) => {
  try {
    res.json(await skillProfilingService.getSkillProfile(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Skill profile unavailable" });
  }
};

export const getPeerComparisonProfile = async (req: Request, res: Response) => {
  try {
    res.json(await skillProfilingService.getPeerComparison(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Peer comparison unavailable" });
  }
};

export const getSkillProgressProfile = async (req: Request, res: Response) => {
  try {
    res.json(await skillProfilingService.getSkillProgress(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Skill progress unavailable" });
  }
};

export const getConsistencyProfile = async (req: Request, res: Response) => {
  try {
    res.json(await skillProfilingService.getConsistencyProfile(req.currentUser!._id));
  } catch {
    res.status(500).json({ message: "Consistency profile unavailable" });
  }
};
