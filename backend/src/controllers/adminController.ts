import { Request, Response } from "express";
import crypto from "crypto";
import User from "../models/User";
import Question from "../models/Question";
import Theory from "../models/Theory";
import Contest from "../models/Contest";
import Subject from "../models/Subject";
import Chapter from "../models/Chapter";
import Topic from "../models/Topic";
import Subtopic from "../models/Subtopic";
import { invalidateHomeCache } from "../utils/homeCache";

const APPROVAL_TAGS = ["GATE", "GATE DA", "Olympiad", "Advanced"] as const;
type ApprovalTag = (typeof APPROVAL_TAGS)[number];

const getApprovalTag = (tag: unknown): ApprovalTag | null => {
  if (typeof tag !== "string") return null;
  const normalized = tag.trim();
  return APPROVAL_TAGS.find((allowedTag) => allowedTag === normalized) || null;
};

const addApprovalTag = (tags: string[] | undefined, tag: ApprovalTag): string[] => {
  const currentTags = Array.isArray(tags) ? tags : [];
  return currentTags.includes(tag) ? currentTags : [...currentTags, tag];
};

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
    invalidateHomeCache();
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
    invalidateHomeCache();
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
    invalidateHomeCache();
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete question" });
  }
};

export const approveQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, tag } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    question.status = status;
    if (status === "approved") {
      const approvalTag = getApprovalTag(tag);
      if (tag !== undefined && !approvalTag) {
        res.status(400).json({ message: "Invalid approval tag" });
        return;
      }
      question.approvedBy = req.currentUser!._id;
      question.tags = addApprovalTag(question.tags, approvalTag || "GATE DA");
    }
    question.auditLog.push({
      action: status === "approved" ? "Approved" : "Rejected",
      performedBy: req.currentUser!._id,
      timestamp: new Date(),
    });

    await question.save();
    invalidateHomeCache();
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
    invalidateHomeCache();
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
    invalidateHomeCache();
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
    invalidateHomeCache();
    res.json({ message: "Theory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete theory" });
  }
};

export const approveTheory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, tag } = req.body;

    const theory = await Theory.findById(id);
    if (!theory) {
      res.status(404).json({ message: "Theory not found" });
      return;
    }

    theory.status = status;
    if (status === "approved") {
      const approvalTag = getApprovalTag(tag);
      if (tag !== undefined && !approvalTag) {
        res.status(400).json({ message: "Invalid approval tag" });
        return;
      }
      theory.approvedBy = req.currentUser!._id;
      theory.tags = addApprovalTag(theory.tags, approvalTag || "GATE DA");
    }
    theory.auditLog.push({
      action: status === "approved" ? "Approved" : "Rejected",
      performedBy: req.currentUser!._id,
      timestamp: new Date(),
    });

    await theory.save();
    invalidateHomeCache();
    res.json(theory);
  } catch (error: any) {
    console.error("[approveTheory] Error saving theory:", error);
    res.status(500).json({ message: error.message || "Failed to approve theory" });
  }
};

export const exportAdminContent = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [subjects, chapters, topics, subtopics, questions, theories] = await Promise.all([
      Subject.find().sort({ order: 1, name: 1 }).lean(),
      Chapter.find().sort({ order: 1, name: 1 }).lean(),
      Topic.find().sort({ order: 1, name: 1 }).lean(),
      Subtopic.find().sort({ order: 1, name: 1 }).lean(),
      Question.find().lean(),
      Theory.find().lean(),
    ]);

    const validSubtopicIds = new Set(subtopics.map((subtopic) => subtopic.subtopicId));
    const problemsBySubtopic = new Map<string, any[]>();
    const theoriesBySubtopic = new Map<string, any[]>();
    const unmappedProblems: any[] = [];
    const unmappedTheories: any[] = [];

    for (const question of questions) {
      const subtopicId = question.subtopicId;
      if (subtopicId && validSubtopicIds.has(subtopicId)) {
        if (!problemsBySubtopic.has(subtopicId)) problemsBySubtopic.set(subtopicId, []);
        problemsBySubtopic.get(subtopicId)!.push(question);
      } else {
        unmappedProblems.push(question);
      }
    }

    for (const theory of theories) {
      const subtopicId = theory.subtopicId;
      if (subtopicId && validSubtopicIds.has(subtopicId)) {
        if (!theoriesBySubtopic.has(subtopicId)) theoriesBySubtopic.set(subtopicId, []);
        theoriesBySubtopic.get(subtopicId)!.push(theory);
      } else {
        unmappedTheories.push(theory);
      }
    }

    const tree = subjects.map((subject) => ({
      subjectId: subject.subjectId,
      name: subject.name,
      code: subject.code,
      chapters: chapters
        .filter((chapter) => chapter.subjectId === subject.subjectId)
        .map((chapter) => ({
          chapterId: chapter.chapterId,
          name: chapter.name,
          topics: topics
            .filter((topic) => topic.chapterId === chapter.chapterId)
            .map((topic) => ({
              topicId: topic.topicId,
              name: topic.name,
              subtopics: subtopics
                .filter((subtopic) => subtopic.topicId === topic.topicId)
                .map((subtopic) => ({
                  subtopicId: subtopic.subtopicId,
                  name: subtopic.name,
                  problems: problemsBySubtopic.get(subtopic.subtopicId) || [],
                  theories: theoriesBySubtopic.get(subtopic.subtopicId) || [],
                })),
            })),
        })),
    }));

    res.json({ tree, unmappedProblems, unmappedTheories });
  } catch (error) {
    console.error("[exportAdminContent] Failed to build export tree:", error);
    res.status(500).json({ message: "Failed to export admin content" });
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
    const itemsToSave = data.map((item: any) => {
      // Manually generate contentId because pre("save") does not execute on insertMany()
      let generatedId = item.contentId;
      if (!generatedId) {
        const topicCode = (item.topic || "GEN")
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .substring(0, 4)
          .padEnd(4, "X");
        const uniqueHash = crypto.randomBytes(3).toString("hex").toUpperCase();
        generatedId = type === "Problem"
          ? `${topicCode}-${item.questionType || "MCQ"}-${uniqueHash}`
          : `${topicCode}-TH-${uniqueHash}`;
      }

      return {
        ...item,
        contentId: generatedId,
        createdBy: userId,
        status: "pending_review",
        auditLog: [{ action: "Bulk Imported", performedBy: userId, timestamp: new Date() }],
      };
    });

    if (type === "Problem") {
      try {
        const docs = await Question.insertMany(itemsToSave, { ordered: false });
        invalidateHomeCache();
        res.status(201).json({ message: `Successfully added ${docs.length} problems for review` });
      } catch (err: any) {
        const insertedCount = err.insertedDocs ? err.insertedDocs.length : 0;
        const duplicateCount = err.writeErrors ? err.writeErrors.length : itemsToSave.length - insertedCount;
        invalidateHomeCache();
        res.status(201).json({
          message: `Successfully added ${insertedCount} problems for review${duplicateCount > 0 ? ` (${duplicateCount} items skipped as duplicates)` : ""}`
        });
      }
    } else if (type === "Theory Article") {
      try {
        const docs = await Theory.insertMany(itemsToSave, { ordered: false });
        invalidateHomeCache();
        res.status(201).json({ message: `Successfully added ${docs.length} theory articles for review` });
      } catch (err: any) {
        const insertedCount = err.insertedDocs ? err.insertedDocs.length : 0;
        const duplicateCount = err.writeErrors ? err.writeErrors.length : itemsToSave.length - insertedCount;
        invalidateHomeCache();
        res.status(201).json({
          message: `Successfully added ${insertedCount} theory articles for review${duplicateCount > 0 ? ` (${duplicateCount} items skipped as duplicates)` : ""}`
        });
      }
    } else {
      res.status(400).json({ message: "Invalid type" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to process bulk upload" });
  }
};
