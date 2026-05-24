import { Router } from "express";
import {
  getTaxonomyTree,
  getSubjects,
  getChapters,
  getTopics,
  getSubtopics,
  getTaxonomyStats,
} from "../controllers/taxonomyController";

const router = Router();

router.get("/tree", getTaxonomyTree);
router.get("/subjects", getSubjects);
router.get("/chapters", getChapters);
router.get("/topics", getTopics);
router.get("/subtopics", getSubtopics);
router.get("/stats", getTaxonomyStats);

export default router;
