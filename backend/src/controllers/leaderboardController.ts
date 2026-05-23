import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Submission from "../models/Submission";

const buildPeriodTimestamp = (period?: string): Date | null => {
  const normalized = (period || "all").toString().toLowerCase().trim();
  const now = new Date();
  if (normalized === "this_week" || normalized === "this week") {
    const since = new Date(now);
    since.setDate(now.getDate() - 7);
    return since;
  }
  if (normalized === "this_month" || normalized === "this month") {
    const since = new Date(now);
    since.setMonth(now.getMonth() - 1);
    return since;
  }
  return null;
};

const createHandle = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "learner";
  const handle = parts.length === 1 ? parts[0] : `${parts[0]}_${parts[parts.length - 1]}`;
  return handle.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24);
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const periodRaw = String(req.query.period || "all");
    const sinceDate = buildPeriodTimestamp(periodRaw);

    const users = await User.find({})
      .sort({ rating: -1 })
      .limit(50)
      .lean();

    const userIds = users.map((user) => new mongoose.Types.ObjectId(user._id));

    const match: any = { userId: { $in: userIds }, isCorrect: true };
    if (sinceDate) {
      match.createdAt = { $gte: sinceDate };
    }

    const solvedResults = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$userId",
          solvedQuestions: { $addToSet: "$questionId" },
        },
      },
      {
        $project: {
          solved: { $size: "$solvedQuestions" },
        },
      },
    ]);

    const solvedMap = solvedResults.reduce<Record<string, number>>((acc, item) => {
      acc[item._id.toString()] = item.solved;
      return acc;
    }, {});

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      handle: createHandle(user.fullName),
      fullName: user.fullName,
      institution: user.institution || "Learner",
      rating: user.rating,
      solved: solvedMap[user._id.toString()] ?? 0,
    }));

    res.json({ leaderboard, period: periodRaw });
  } catch (error) {
    console.error("getLeaderboard error:", error);
    res.status(500).json({ message: "Server error building leaderboard" });
  }
};
