import express from "express";
import { getApprovedQuestions, getQuestionById, toggleUpvote, getApprovedTheories, getTheoryById } from "../controllers/problemController";
import { submitAnswer, getQuestionSubmissions } from "../controllers/submissionController";
import { optionalAuth, requireAuth } from "../middleware/auth";

const router = express.Router();

// Theory routes MUST come before /:id to avoid conflict
router.get("/theories/all", getApprovedTheories);
router.get("/theories/:id", getTheoryById);

// Question routes
router.get("/", optionalAuth, getApprovedQuestions);
router.get("/:id", getQuestionById);
router.post("/:id/upvote", requireAuth, toggleUpvote);
router.post("/:id/submit", requireAuth, submitAnswer);
router.get("/:id/submissions", requireAuth, getQuestionSubmissions);

export default router;
