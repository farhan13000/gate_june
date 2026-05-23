import { Request, Response } from "express";
import Question from "../models/Question";
import Submission from "../models/Submission";

// POST /api/problems/:id/submit
export const submitAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionId = req.params.id;
    if (!req.currentUser) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const userId = req.currentUser._id;
    const { mcqSelected, msqSelected, natAnswer, timeTaken } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    let isCorrect = false;

    if (question.questionType === "MCQ") {
      if (!mcqSelected) {
        res.status(400).json({ message: "No option selected for MCQ" });
        return;
      }
      const correctOpt = question.options?.find((o: any) => o.isCorrect);
      isCorrect = !!(correctOpt && (correctOpt as any)._id.toString() === mcqSelected);
    } else if (question.questionType === "MSQ") {
      if (!msqSelected || !Array.isArray(msqSelected)) {
        res.status(400).json({ message: "No options selected for MSQ" });
        return;
      }
      const correctOptIds = question.options?.filter((o: any) => o.isCorrect).map((o: any) => (o as any)._id.toString()) || [];
      isCorrect =
        msqSelected.length === correctOptIds.length &&
        msqSelected.every((id: string) => correctOptIds.includes(id));
    } else if (question.questionType === "NAT") {
      if (!natAnswer || typeof natAnswer !== "string") {
        res.status(400).json({ message: "No answer provided for NAT" });
        return;
      }
      
      let correctValue = "";
      const sol = question.solution;
      
      if (sol && typeof sol === "object") {
        // If solution is an object (e.g. from structured JSON renderer)
        const finalAnswerBlock = sol.blocks?.find((b: any) => b.type === "finalAnswer");
        if (finalAnswerBlock) {
          correctValue = String(finalAnswerBlock.content).trim();
        }
      } else if (typeof sol === "string") {
        try {
          const parsed = JSON.parse(sol);
          const finalAnswerBlock = parsed.blocks?.find((b: any) => b.type === "finalAnswer");
          if (finalAnswerBlock) {
            correctValue = String(finalAnswerBlock.content).trim();
          }
        } catch {
          // If it's a plain string and not JSON
          correctValue = sol.trim();
        }
      }

      const normSubmitted = natAnswer.trim().toLowerCase();
      const normCorrect = correctValue.toLowerCase();

      if (normSubmitted === normCorrect) {
        isCorrect = true;
      } else {
        // Try numerical comparison (to handle trailing zeroes or float representation)
        const numSub = parseFloat(normSubmitted);
        const numCorr = parseFloat(normCorrect);
        if (!isNaN(numSub) && !isNaN(numCorr)) {
          isCorrect = Math.abs(numSub - numCorr) < 1e-4;
        } else {
          // Substring fallback
          isCorrect = normCorrect.includes(normSubmitted) || (typeof sol === "string" && sol.toLowerCase().includes(normSubmitted));
        }
      }
    }

    const marksAwarded = isCorrect
      ? (question.markingScheme?.positive ?? 1)
      : -(question.markingScheme?.negative ?? 0);

    const submission = new Submission({
      userId,
      questionId,
      submittedOptionIds: question.questionType === "MCQ" ? [mcqSelected] : (question.questionType === "MSQ" ? msqSelected : []),
      natAnswer: question.questionType === "NAT" ? natAnswer : undefined,
      isCorrect,
      marksAwarded,
      timeTaken: timeTaken || 120, // default to 120s if not sent
    });

    await submission.save();

    res.status(201).json({
      message: "Submission saved successfully",
      submission: {
        _id: submission._id,
        isCorrect: submission.isCorrect,
        marksAwarded: submission.marksAwarded,
        createdAt: submission.createdAt,
      },
    });
  } catch (error) {
    console.error("submitAnswer error:", error);
    res.status(500).json({ message: "Failed to submit answer" });
  }
};

// GET /api/problems/:id/submissions
export const getQuestionSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionId = req.params.id;
    if (!req.currentUser) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const userId = req.currentUser._id;

    const submissions = await Submission.find({ userId, questionId }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error("getQuestionSubmissions error:", error);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};
