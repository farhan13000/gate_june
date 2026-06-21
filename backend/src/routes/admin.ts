import express from "express";
import {
  getAllUsers,
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  approveQuestion,
  createTheory,
  getTheories,
  updateTheory,
  deleteTheory,
  approveTheory,
  bulkUpload,
  exportAdminContent,
} from "../controllers/adminController";
import {
  getHomeSettings,
  setProblemOfTheDay,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getContestsAdmin,
  getContestAdminDetail,
  getContestAdminClaims,
  getContestAdminStandings,
  streamContestAdminStandings,
  getContestProblemCandidates,
  createContest,
  updateContest,
  updateContestClaim,
  updateContestProblems,
  createContestOnlyQuestion,
  releaseContestAnswerKey,
  openContestClaims,
  closeContestClaims,
  previewContestRatingChanges,
  syncContestLifecyclesNow,
  finalizeContestAndApplyRatings,
  deleteContest,
} from "../controllers/homeAdminController";
import {
  getContestTestRun,
  getContestTestRuns,
  getContestTestSuites,
  startContestTestRun,
  stopContestTestRun,
  streamContestTestRun,
} from "../controllers/contestTestController";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  adminGetSubjects,
  adminCreateSubject,
  adminUpdateSubject,
  adminDeleteSubject,
  adminGetChapters,
  adminCreateChapter,
  adminUpdateChapter,
  adminDeleteChapter,
  adminGetTopics,
  adminCreateTopic,
  adminUpdateTopic,
  adminDeleteTopic,
  adminGetSubtopics,
  adminCreateSubtopic,
  adminUpdateSubtopic,
  adminDeleteSubtopic,
  adminReorderTaxonomy,
  adminBulkTaxonomyJson,
} from "../controllers/taxonomyAdminController";
import { getPlatformLogs } from "../controllers/platformLogController";

const router = express.Router();

// All admin routes are protected
router.use(requireAuth, requireAdmin);

// Taxonomy managers
router.get("/taxonomy/subjects", adminGetSubjects);
router.post("/taxonomy/subjects", adminCreateSubject);
router.put("/taxonomy/subjects/:id", adminUpdateSubject);
router.delete("/taxonomy/subjects/:id", adminDeleteSubject);

router.get("/taxonomy/chapters", adminGetChapters);
router.post("/taxonomy/chapters", adminCreateChapter);
router.put("/taxonomy/chapters/:id", adminUpdateChapter);
router.delete("/taxonomy/chapters/:id", adminDeleteChapter);

router.get("/taxonomy/topics", adminGetTopics);
router.post("/taxonomy/topics", adminCreateTopic);
router.put("/taxonomy/topics/:id", adminUpdateTopic);
router.delete("/taxonomy/topics/:id", adminDeleteTopic);

router.get("/taxonomy/subtopics", adminGetSubtopics);
router.post("/taxonomy/subtopics", adminCreateSubtopic);
router.put("/taxonomy/subtopics/:id", adminUpdateSubtopic);
router.delete("/taxonomy/subtopics/:id", adminDeleteSubtopic);

router.post("/taxonomy/reorder", adminReorderTaxonomy);
router.post("/taxonomy/bulk-json", adminBulkTaxonomyJson);

// Platform logs
router.get("/logs", getPlatformLogs);

// Users
router.get("/users", getAllUsers);

// Questions - Full CRUD
router.get("/questions", getQuestions);
router.post("/questions", createQuestion);
router.put("/questions/:id/approve", approveQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);

// Theory - Full CRUD
router.get("/theories", getTheories);
router.post("/theories", createTheory);
router.put("/theories/:id/approve", approveTheory);
router.put("/theories/:id", updateTheory);
router.delete("/theories/:id", deleteTheory);

// Bulk Upload
router.post("/bulk-upload", bulkUpload);
router.get("/exports/content", exportAdminContent);

// Home page management
router.get("/home-settings", getHomeSettings);
router.put("/home-settings/problem-of-the-day", setProblemOfTheDay);

router.get("/announcements", getAnnouncements);
router.post("/announcements", createAnnouncement);
router.put("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

router.get("/contests", getContestsAdmin);
router.post("/contests", createContest);
router.post("/contests/sync-lifecycle", syncContestLifecyclesNow);
router.get("/contests/problem-candidates", getContestProblemCandidates);
router.get("/contests/:id", getContestAdminDetail);
router.get("/contests/:id/standings", getContestAdminStandings);
router.get("/contests/:id/standings/stream", streamContestAdminStandings);
router.get("/contests/:id/claims", getContestAdminClaims);
router.put("/contests/:id", updateContest);
router.put("/contests/:id/problems", updateContestProblems);
router.post("/contests/:id/contest-only-questions", createContestOnlyQuestion);
router.post("/contests/:id/release-answer-key", releaseContestAnswerKey);
router.post("/contests/:id/open-claims", openContestClaims);
router.post("/contests/:id/close-claims", closeContestClaims);
router.get("/contests/:id/rating-preview", previewContestRatingChanges);
router.post("/contests/:id/finalize-ratings", finalizeContestAndApplyRatings);
router.put("/contests/:id/claims/:claimId", updateContestClaim);
router.delete("/contests/:id", deleteContest);

// Contest QA test runner
router.get("/contest-tests/suites", getContestTestSuites);
router.get("/contest-tests/runs", getContestTestRuns);
router.post("/contest-tests/runs", startContestTestRun);
router.post("/contest-tests/runs/:id/stop", stopContestTestRun);
router.get("/contest-tests/runs/:id", getContestTestRun);
router.get("/contest-tests/runs/:id/stream", streamContestTestRun);

export default router;
