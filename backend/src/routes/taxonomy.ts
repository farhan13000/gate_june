import { Router } from "express";
import {
  getTaxonomyTree,
  getSubjects,
  getChapters,
  getTopics,
  getSubtopics,
  getTaxonomyStats,
} from "../controllers/taxonomyController";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/tree", getTaxonomyTree);
router.get("/subjects", getSubjects);
router.get("/chapters", getChapters);
router.get("/topics", getTopics);
router.get("/subtopics", getSubtopics);
router.get("/stats", optionalAuth, getTaxonomyStats);

export default router;
