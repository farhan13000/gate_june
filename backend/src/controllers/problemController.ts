import { Request, Response } from "express";
import Question from "../models/Question";
import Theory from "../models/Theory";

function buildQuestionFilter(query: Request["query"]): Record<string, unknown> {
  const filter: Record<string, unknown> = { status: "approved" };
  if (query.subjectId) filter.subjectId = query.subjectId;
  if (query.chapterId) filter.chapterId = query.chapterId;
  if (query.topicId) filter.topicId = query.topicId;
  if (query.subtopicId) filter.subtopicId = query.subtopicId;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.questionType) filter.questionType = query.questionType;
  if (query.search) {
    filter.title = { $regex: String(query.search), $options: "i" };
  }
  return filter;
}

export const getApprovedQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = buildQuestionFilter(req.query);
    const sort = String(req.query.sort || "newest");
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"), 10)));
    const skip = (page - 1) * limit;

    let sortOpt: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "difficulty") sortOpt = { difficulty: 1, createdAt: -1 };
    if (sort === "title") sortOpt = { title: 1 };

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .select("-solution -approvedBy -createdBy -auditLog")
        .sort(sortOpt)
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter),
    ]);

    res.json({ questions, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};

export const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await Question.findOne({ _id: req.params.id, status: "approved" });
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch question" });
  }
};

export const toggleUpvote = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionId = req.params.id;
    const userId = req.currentUser!._id;

    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    const hasUpvoted = question.upvotedBy.some(id => id.toString() === userId.toString());

    if (hasUpvoted) {
      question.upvotedBy = question.upvotedBy.filter(id => id.toString() !== userId.toString());
      question.upvotes -= 1;
    } else {
      question.upvotedBy.push(userId);
      question.upvotes += 1;
    }

    await question.save();

    res.json({ upvotes: question.upvotes, hasUpvoted: !hasUpvoted });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle upvote" });
  }
};

export const getApprovedTheories = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { status: "approved" };
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.topicId) filter.topicId = req.query.topicId;
    if (req.query.subtopicId) filter.subtopicId = req.query.subtopicId;

    const theories = await Theory.find(filter)
      .select("-auditLog -createdBy -approvedBy")
      .sort({ subjectId: 1, chapterId: 1, topicId: 1, subtopicId: 1 });
    res.json(theories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch theories" });
  }
};

export const getTheoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const theory = await Theory.findOne({ _id: req.params.id, status: "approved" });
    if (!theory) {
      res.status(404).json({ message: "Theory not found" });
      return;
    }
    res.json(theory);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch theory" });
  }
};
