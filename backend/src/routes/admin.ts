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
} from "../controllers/adminController";
import {
  getHomeSettings,
  setProblemOfTheDay,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getContestsAdmin,
  createContest,
  updateContest,
  deleteContest,
} from "../controllers/homeAdminController";
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
} from "../controllers/taxonomyAdminController";

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

// Home page management
router.get("/home-settings", getHomeSettings);
router.put("/home-settings/problem-of-the-day", setProblemOfTheDay);

router.get("/announcements", getAnnouncements);
router.post("/announcements", createAnnouncement);
router.put("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

router.get("/contests", getContestsAdmin);
router.post("/contests", createContest);
router.put("/contests/:id", updateContest);
router.delete("/contests/:id", deleteContest);

export default router;
