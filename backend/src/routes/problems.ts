import express from "express";
import { getApprovedQuestions, getQuestionById, toggleUpvote, getApprovedTheories, getTheoryById } from "../controllers/problemController";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

// Theory routes MUST come before /:id to avoid conflict
router.get("/theories/all", getApprovedTheories);
router.get("/theories/:id", getTheoryById);

// Question routes
router.get("/", getApprovedQuestions);
router.get("/:id", getQuestionById);
router.post("/:id/upvote", requireAuth, toggleUpvote);

export default router;
