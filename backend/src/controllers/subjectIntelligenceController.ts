import { Request, Response } from "express";
import { subjectIntelligenceService } from "../services/dashboard/subjectIntelligenceService";

export const getSubjectIntelligence = async (req: Request, res: Response) => {
  try {
    res.json(await subjectIntelligenceService.getSubjectIntelligence(req.currentUser!._id));
  } catch (error) {
    res.status(500).json({ message: "Subject intelligence unavailable" });
  }
};

export const getSubjectDetailIntelligence = async (req: Request, res: Response) => {
  try {
    res.json(await subjectIntelligenceService.getSubjectDetailIntelligence(req.currentUser!._id, String(req.params.subjectId)));
  } catch (error) {
    res.status(500).json({ message: "Subject detail intelligence unavailable" });
  }
};
