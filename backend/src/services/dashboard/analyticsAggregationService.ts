import type { Types } from "mongoose";
import Submission from "../../models/Submission";
import TheoryProgress from "../../models/TheoryProgress";
import UserActivityLog from "../../models/UserActivityLog";
import UserRevisionLog from "../../models/UserRevisionLog";
import RecommendationLog from "../../models/RecommendationLog";
import { getDashboardCache, setDashboardCache } from "../../utils/dashboard/dashboardCache";

export interface DashboardFoundationSummary {
  activityEvents: number;
  submittedProblems: number;
  theoryProgressRecords: number;
  revisionRecords: number;
  pendingRecommendations: number;
  aggregationReady: boolean;
  aiReadySignals: string[];
}

export async function getDashboardFoundationSummary(userId: Types.ObjectId): Promise<DashboardFoundationSummary> {
  const cacheKey = `dashboard:foundation:${userId.toString()}`;
  const cached = getDashboardCache<DashboardFoundationSummary>(cacheKey);
  if (cached) return cached;

  const [
    activityEvents,
    submittedProblems,
    theoryProgressRecords,
    revisionRecords,
    pendingRecommendations,
  ] = await Promise.all([
    UserActivityLog.countDocuments({ userId }),
    Submission.countDocuments({ userId }),
    TheoryProgress.countDocuments({ userId }),
    UserRevisionLog.countDocuments({ userId }),
    RecommendationLog.countDocuments({ userId, status: { $in: ["pending", "in_progress"] } }),
  ]);

  return setDashboardCache(cacheKey, {
    activityEvents,
    submittedProblems,
    theoryProgressRecords,
    revisionRecords,
    pendingRecommendations,
    aggregationReady: true,
    aiReadySignals: [
      "activity_stream",
      "submission_accuracy",
      "theory_progress",
      "revision_confidence_delta",
      "recommendation_feedback",
    ],
  });
}

export const analyticsAggregationService = {
  getDashboardFoundationSummary,
};
