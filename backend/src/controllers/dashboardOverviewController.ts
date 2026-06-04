import { Request, Response } from "express";
import { dashboardOverviewService } from "../services/dashboard/dashboardOverviewService";

export const getReadinessScore = async (req: Request, res: Response) => {
  res.json(await dashboardOverviewService.getReadinessScore(req.currentUser!._id));
};

export const getStreakTracking = async (req: Request, res: Response) => {
  res.json(await dashboardOverviewService.getStreakTracking(req.currentUser!._id));
};

export const getRecentActivity = async (req: Request, res: Response) => {
  res.json(await dashboardOverviewService.getRecentActivity(req.currentUser!._id));
};

export const getWeeklyPerformance = async (req: Request, res: Response) => {
  res.json(await dashboardOverviewService.getWeeklyPerformance(req.currentUser!._id));
};

export const getStudyAnalytics = async (req: Request, res: Response) => {
  res.json(await dashboardOverviewService.getStudyAnalytics(req.currentUser!._id));
};

export const getContestSummary = async (req: Request, res: Response) => {
  res.json(await dashboardOverviewService.getContestSummary(req.currentUser!._id));
};
