import { Request, Response } from "express";
import Question from "../models/Question";
import Theory from "../models/Theory";

export const getApprovedQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const questions = await Question.find({ status: "approved" })
      .select("-solution -approvedBy -createdBy")
      .sort({ createdAt: -1 });
    res.json(questions);
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

    const hasUpvoted = question.upvotedBy.includes(userId);

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
    const theories = await Theory.find({ status: "approved" }).sort({ topic: 1, chapterId: 1, sectionId: 1 });
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
