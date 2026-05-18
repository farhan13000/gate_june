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
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

// All admin routes are protected
router.use(requireAuth, requireAdmin);

// Users
router.get("/users", getAllUsers);

// Questions - Full CRUD
router.get("/questions", getQuestions);
router.post("/questions", createQuestion);
router.put("/questions/:id", updateQuestion);
router.put("/questions/:id/approve", approveQuestion);
router.delete("/questions/:id", deleteQuestion);

// Theory - Full CRUD
router.get("/theories", getTheories);
router.post("/theories", createTheory);
router.put("/theories/:id", updateTheory);
router.put("/theories/:id/approve", approveTheory);
router.delete("/theories/:id", deleteTheory);

// Bulk Upload
router.post("/bulk-upload", bulkUpload);

export default router;
