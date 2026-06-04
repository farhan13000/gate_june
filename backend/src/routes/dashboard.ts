import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getOverview,
  getPerformance,
  getSubjects,
  getSubjectDetail,
  getTestHistory,
  getTimeAnalysis,
  getRecommendations,
  getContestPerformance,
  getLeaderboard,
  getActivity,
  streamDashboard,
  
  // Advanced Analytics
  getSkillRadar,
  getSkillMastery,
  getTopicGraph,
  getProblemPhaseDiagram,
  getProblemTimeline,
  getIntelligenceIndex,
  getActivityTimeline,
} from "../controllers/dashboardController";
import { getDashboardFoundation } from "../controllers/dashboardFoundationController";
import {
  getContestSummary,
  getReadinessScore,
  getRecentActivity,
  getStreakTracking,
  getStudyAnalytics,
  getWeeklyPerformance,
} from "../controllers/dashboardOverviewController";
import {
  getSubjectDetailIntelligence,
  getSubjectIntelligence,
} from "../controllers/subjectIntelligenceController";
import {
  getPacingAnalysis,
  getSessionAnalysis,
  getTimeAnalysisIntelligence,
  getTimeDistribution,
} from "../controllers/timeAnalysisController";
import {
  getConsistencyProfile,
  getPeerComparisonProfile,
  getSkillProgressProfile,
  getSkillsProfile,
} from "../controllers/skillProfilingController";
import {
  getConceptStability,
  getErrorAnalysis,
  getRevisionRisk,
  getWeakAreaIntelligence,
} from "../controllers/weakAreaController";

const router = Router();

// Phase 1 foundation status
router.get("/foundation", requireAuth, getDashboardFoundation);

// Dashboard Overview command-center APIs
router.get("/readiness-score", requireAuth, getReadinessScore);
router.get("/streak-tracking", requireAuth, getStreakTracking);
router.get("/recent-activity", requireAuth, getRecentActivity);
router.get("/weekly-performance", requireAuth, getWeeklyPerformance);
router.get("/study-analytics", requireAuth, getStudyAnalytics);
router.get("/contest-summary", requireAuth, getContestSummary);

// General Overview
router.get("/overview", requireAuth, getOverview);
router.get("/intelligence-index", requireAuth, getIntelligenceIndex);

// Skills & Mastery
router.get("/skills", requireAuth, getSkillsProfile);
router.get("/peer-comparison", requireAuth, getPeerComparisonProfile);
router.get("/skill-progress", requireAuth, getSkillProgressProfile);
router.get("/consistency", requireAuth, getConsistencyProfile);
router.get("/skills/radar", requireAuth, getSkillRadar);
router.get("/skills/mastery", requireAuth, getSkillMastery);
router.get("/skills/topic-graph", requireAuth, getTopicGraph);

// Problem Analytics
router.get("/problems/summary", requireAuth, getPerformance);
router.get("/problems/phase-diagram", requireAuth, getProblemPhaseDiagram);
router.get("/problems/timeline", requireAuth, getProblemTimeline);

// Contests & Tests
router.get("/contest-performance", requireAuth, getContestPerformance);
router.get("/test-history", requireAuth, getTestHistory);

// Other sections
router.get("/subjects/intelligence", requireAuth, getSubjectIntelligence);
router.get("/subjects/:subjectId/intelligence", requireAuth, getSubjectDetailIntelligence);
router.get("/subjects", requireAuth, getSubjects);
router.get("/subjects/:subjectId", requireAuth, getSubjectDetail);
router.get("/time-analysis", requireAuth, getTimeAnalysisIntelligence);
router.get("/pacing", requireAuth, getPacingAnalysis);
router.get("/session-analysis", requireAuth, getSessionAnalysis);
router.get("/time-distribution", requireAuth, getTimeDistribution);
router.get("/weak-areas", requireAuth, getWeakAreaIntelligence);
router.get("/concept-stability", requireAuth, getConceptStability);
router.get("/revision-risk", requireAuth, getRevisionRisk);
router.get("/error-analysis", requireAuth, getErrorAnalysis);
router.get("/recommendations", requireAuth, getRecommendations);
router.get("/leaderboard", requireAuth, getLeaderboard);

// Activity
router.get("/activity", requireAuth, getActivity);
router.get("/activity/heatmap", requireAuth, getActivity);
router.get("/activity/timeline", requireAuth, getActivityTimeline);

router.get("/stream", requireAuth, streamDashboard);

export default router;
