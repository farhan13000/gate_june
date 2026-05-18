import { Request, Response } from "express";
import User from "../models/User";
import Question from "../models/Question";
import Theory from "../models/Theory";
import Contest from "../models/Contest";

// --- Users ---
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// --- Questions ---
export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = new Question({
      ...req.body,
      createdBy: req.currentUser!._id,
      status: "pending_review",
      auditLog: [{ action: "Created", performedBy: req.currentUser!._id }],
    });
    await question.save();
    res.status(201).json(question);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create question" });
  }
};

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const questions = await Question.find()
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName")
      .populate("auditLog.performedBy", "fullName")
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note, ...updateData } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    Object.assign(question, updateData);
    question.auditLog.push({
      action: "Edited",
      note: note || "Content updated by admin",
      performedBy: req.currentUser!._id,
      timestamp: new Date(),
    });

    await question.save();
    res.json(question);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update question" });
  }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete question" });
  }
};

export const approveQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    question.status = status;
    if (status === "approved") question.approvedBy = req.currentUser!._id;
    question.auditLog.push({
      action: status === "approved" ? "Approved" : "Rejected",
      performedBy: req.currentUser!._id,
      timestamp: new Date(),
    });

    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Failed to approve question" });
  }
};

// --- Theory ---
export const createTheory = async (req: Request, res: Response): Promise<void> => {
  try {
    const theory = new Theory({
      ...req.body,
      createdBy: req.currentUser!._id,
      status: "pending_review",
      auditLog: [{ action: "Created", performedBy: req.currentUser!._id }],
    });
    await theory.save();
    res.status(201).json(theory);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create theory" });
  }
};

export const getTheories = async (req: Request, res: Response): Promise<void> => {
  try {
    const theories = await Theory.find()
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName")
      .populate("auditLog.performedBy", "fullName")
      .sort({ topic: 1, chapterId: 1, sectionId: 1 });
    res.json(theories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch theories" });
  }
};

export const updateTheory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note, ...updateData } = req.body;

    const theory = await Theory.findById(id);
    if (!theory) {
      res.status(404).json({ message: "Theory not found" });
      return;
    }

    Object.assign(theory, updateData);
    theory.auditLog.push({
      action: "Edited",
      note: note || "Content updated by admin",
      performedBy: req.currentUser!._id,
      timestamp: new Date(),
    });

    await theory.save();
    res.json(theory);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update theory" });
  }
};

export const deleteTheory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const theory = await Theory.findByIdAndDelete(id);
    if (!theory) {
      res.status(404).json({ message: "Theory not found" });
      return;
    }
    res.json({ message: "Theory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete theory" });
  }
};

export const approveTheory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const theory = await Theory.findById(id);
    if (!theory) {
      res.status(404).json({ message: "Theory not found" });
      return;
    }

    theory.status = status;
    if (status === "approved") theory.approvedBy = req.currentUser!._id;
    theory.auditLog.push({
      action: status === "approved" ? "Approved" : "Rejected",
      performedBy: req.currentUser!._id,
      timestamp: new Date(),
    });

    await theory.save();
    res.json(theory);
  } catch (error: any) {
    console.error("[approveTheory] Error saving theory:", error);
    res.status(500).json({ message: error.message || "Failed to approve theory" });
  }
};

// --- Bulk Upload ---
export const bulkUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data } = req.body;

    if (!Array.isArray(data)) {
      res.status(400).json({ message: "Data must be an array" });
      return;
    }

    const userId = req.currentUser!._id;
    const itemsToSave = data.map((item: any) => ({
      ...item,
      createdBy: userId,
      status: "pending_review",
      auditLog: [{ action: "Bulk Imported", performedBy: userId, timestamp: new Date() }],
    }));

    if (type === "Problem") {
      const docs = await Question.insertMany(itemsToSave, { ordered: false });
      res.status(201).json({ message: `Successfully added ${docs.length} problems for review` });
    } else if (type === "Theory Article") {
      const docs = await Theory.insertMany(itemsToSave, { ordered: false });
      res.status(201).json({ message: `Successfully added ${docs.length} theory articles for review` });
    } else {
      res.status(400).json({ message: "Invalid type" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to process bulk upload" });
  }
};
