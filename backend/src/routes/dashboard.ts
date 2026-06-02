import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getOverview,
  getPerformance,
  getSubjects,
  getSubjectDetail,
  getTestHistory,
  getTimeAnalysis,
  getWeakAreas,
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

const router = Router();

// General Overview
router.get("/overview", requireAuth, getOverview);
router.get("/intelligence-index", requireAuth, getIntelligenceIndex);

// Skills & Mastery
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
router.get("/subjects", requireAuth, getSubjects);
router.get("/subjects/:subjectId", requireAuth, getSubjectDetail);
router.get("/time-analysis", requireAuth, getTimeAnalysis);
router.get("/weak-areas", requireAuth, getWeakAreas);
router.get("/recommendations", requireAuth, getRecommendations);
router.get("/leaderboard", requireAuth, getLeaderboard);

// Activity
router.get("/activity", requireAuth, getActivity);
router.get("/activity/heatmap", requireAuth, getActivity);
router.get("/activity/timeline", requireAuth, getActivityTimeline);

router.get("/stream", requireAuth, streamDashboard);

export default router;
