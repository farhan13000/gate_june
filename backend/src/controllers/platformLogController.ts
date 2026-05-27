import { Request, Response } from "express";
import PlatformLog from "../models/PlatformLog";

export const getPlatformLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 300);
    const filter: Record<string, unknown> = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.requestId) filter.requestId = req.query.requestId;

    const logs = await PlatformLog.find(filter)
      .populate("performedBy", "fullName email")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(logs);
  } catch {
    res.status(500).json({ message: "Failed to fetch platform logs" });
  }
};
