import { Request, Response } from "express";
import { analyticsAggregationService } from "../services/dashboard/analyticsAggregationService";

export const getDashboardFoundation = async (req: Request, res: Response) => {
  try {
    const summary = await analyticsAggregationService.getDashboardFoundationSummary(req.currentUser!._id);
    res.json({
      baseRoute: "/api/dashboard",
      architecture: {
        routing: "modular",
        services: "analyticsAggregationService",
        cache: "in-memory ttl cache",
        auth: "jwt requireAuth + role middleware ready",
        aggregation: "MongoDB aggregation ready",
      },
      summary,
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard foundation unavailable" });
  }
};
