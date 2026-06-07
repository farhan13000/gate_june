import { Request, Response } from "express";
import User from "../models/User";
import Submission from "../models/Submission";
import RatingHistory from "../models/RatingHistory";
import Contest from "../models/Contest";
import ContestRegistration from "../models/ContestRegistration";
import ContestStanding from "../models/ContestStanding";
import UserActivityLog from "../models/UserActivityLog";
import Question from "../models/Question";
import { getContestState } from "../utils/contestLifecycle";

const subjectsList = [
  "Statistics",
  "Linear Algebra",
  "Probability",
  "Machine Learning",
  "Databases",
  "Python",
  "Optimization",
  "Calculus"
];

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

// --- Helpers (retained and simplified) ---

const getSubjectsForTopic = (topic: string): string[] => {
  const matched: string[] = [];
  const cleanTopic = (topic || "").toLowerCase();
  for (const sub of subjectsList) {
    if (cleanTopic.includes(sub.toLowerCase()) ||
        (sub === "Calculus" && cleanTopic.includes("optimization")) ||
        (sub === "Optimization" && cleanTopic.includes("calculus"))) {
      matched.push(sub);
    }
  }
  if (matched.length === 0) {
    const fallback = topic ? topic.split(/[+&,]/)[0].trim() : "General";
    matched.push(fallback);
  }
  return matched;
};

const calculateUserStats = async (userId: any) => {
  const totalAttempted = await Submission.countDocuments({ userId });
  const totalCorrect = await Submission.countDocuments({ userId, isCorrect: true });
  const overallAccuracy = totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const solvedQuestions = await Submission.distinct("questionId", { userId, isCorrect: true });
  const problemsSolved = solvedQuestions.length;

  const activeDates = await Submission.distinct("createdAt", { userId });
  const formattedDates = Array.from(new Set(
    activeDates.map((d: Date) => new Date(d).toISOString().split("T")[0])
  )).sort().reverse();

  let currentStreakDays = 0;
  if (formattedDates.length > 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const latestDate = formattedDates[0];
    if (latestDate === todayStr || latestDate === yesterdayStr) {
      currentStreakDays = 1;
      let current = new Date(latestDate);
      for (let i = 1; i < formattedDates.length; i++) {
        const prev = new Date(formattedDates[i]);
        const diffTime = Math.abs(current.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreakDays++;
          current = prev;
        } else if (diffDays > 1) {
          break;
        }
      }
    }
  }

  return { totalAttempted, totalCorrect, overallAccuracy, problemsSolved, currentStreakDays };
};

// --- Modular Endpoints ---

export const getOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const stats = await calculateUserStats(userId);
    const user = await User.findById(userId);

    // Get strongest and weakest subject quickly from submissions (could be optimized)
    const submissions = await Submission.find({ userId }).populate("questionId").lean();
    const subjectStatsMap: Record<string, { attempted: number; correct: number; timeSum: number }> = {};
    for (const sub of subjectsList) subjectStatsMap[sub] = { attempted: 0, correct: 0, timeSum: 0 };
    
    submissions.forEach(sub => {
      const q = sub.questionId as any;
      if (!q) return;
      const matchedSubs = getSubjectsForTopic(q.topic);
      matchedSubs.forEach(s => {
        if (!subjectStatsMap[s]) subjectStatsMap[s] = { attempted: 0, correct: 0, timeSum: 0 };
        subjectStatsMap[s].attempted++;
        if (sub.isCorrect) subjectStatsMap[s].correct++;
        subjectStatsMap[s].timeSum += (sub.timeTaken || 120);
      });
    });

    let strongest = { subject: "N/A", accuracy: 0 };
    let weakest = { subject: "N/A", accuracy: 100 };
    const avgTimes: number[] = [];
    
    const subjectPerformance = Object.keys(subjectStatsMap).map(sub => {
      const s = subjectStatsMap[sub];
      if (s.attempted > 0) {
        const acc = Math.round((s.correct / s.attempted) * 100);
        if (acc > strongest.accuracy) strongest = { subject: sub, accuracy: acc };
        if (acc < weakest.accuracy) weakest = { subject: sub, accuracy: acc };
        avgTimes.push(s.timeSum / s.attempted);
        return { subject: sub, attempted: s.attempted, correct: s.correct, accuracy: acc };
      }
      return { subject: sub, attempted: 0, correct: 0, accuracy: 0 };
    });

    const avgTimePerQuestion = avgTimes.length ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length : 0;
    const [difficultyTotals, difficultySolvedRows, difficultyAttemptRows] = await Promise.all([
      Question.aggregate([
        { $match: { status: "approved", difficulty: { $in: ["Easy", "Medium", "Hard"] } } },
        { $group: { _id: "$difficulty", total: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { userId, isCorrect: true } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$questionId" } },
        {
          $lookup: {
            from: "questions",
            localField: "_id",
            foreignField: "_id",
            as: "question",
          },
        },
        { $unwind: "$question" },
        { $match: { "question.status": "approved", "question.difficulty": { $in: ["Easy", "Medium", "Hard"] } } },
        { $group: { _id: "$question.difficulty", solved: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { userId } },
        { $group: { _id: "$questionId", solved: { $max: { $cond: ["$isCorrect", 1, 0] } } } },
        { $match: { solved: 0 } },
        {
          $lookup: {
            from: "questions",
            localField: "_id",
            foreignField: "_id",
            as: "question",
          },
        },
        { $unwind: "$question" },
        { $match: { "question.status": "approved", "question.difficulty": { $in: ["Easy", "Medium", "Hard"] } } },
        { $group: { _id: "$question.difficulty", attempting: { $sum: 1 } } },
      ]),
    ]);

    const totalsByDifficulty = new Map(difficultyTotals.map((row: any) => [row._id, row.total]));
    const solvedByDifficulty = new Map(difficultySolvedRows.map((row: any) => [row._id, row.solved]));
    const attemptingByDifficulty = new Map(difficultyAttemptRows.map((row: any) => [row._id, row.attempting]));
    const problemSolvedByDifficulty = (["Easy", "Medium", "Hard"] as const).map((level) => ({
      level,
      total: totalsByDifficulty.get(level) || 0,
      solved: solvedByDifficulty.get(level) || 0,
      attempting: attemptingByDifficulty.get(level) || 0,
    }));

    const attemptedSubjects = subjectPerformance.filter((item) => item.attempted > 0);
    const weakSubjects = attemptedSubjects
      .filter((item) => item.accuracy < 65)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
    const strongSubjects = attemptedSubjects
      .filter((item) => item.accuracy >= 75)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 2);

    res.json({
      stats: {
        ...stats,
        rating: user?.rating || 0,
        strongestSubject: strongest.subject !== "N/A" ? strongest : null,
        weakestSubject: weakest.subject !== "N/A" ? weakest : null,
        strongSubjects,
        weakSubjects,
        problemSolvedByDifficulty,
        avgTimePerQuestion: Math.round(avgTimePerQuestion), // in seconds
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPerformance = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const { viewType = "subject" } = req.query; // subject | difficulty | questionType | testType
    
    const submissions = await Submission.find({ userId }).populate("questionId").lean();

    if (viewType === "subject") {
      const subjectStatsMap: Record<string, { attempted: number; correct: number; timeSum: number }> = {};
      for (const sub of subjectsList) subjectStatsMap[sub] = { attempted: 0, correct: 0, timeSum: 0 };
      
      submissions.forEach(sub => {
        const q = sub.questionId as any;
        if (!q) return;
        const matchedSubs = getSubjectsForTopic(q.topic);
        matchedSubs.forEach(s => {
          if (!subjectStatsMap[s]) subjectStatsMap[s] = { attempted: 0, correct: 0, timeSum: 0 };
          subjectStatsMap[s].attempted++;
          if (sub.isCorrect) subjectStatsMap[s].correct++;
          subjectStatsMap[s].timeSum += (sub.timeTaken || 120);
        });
      });

      const data = Object.keys(subjectStatsMap)
        .filter(s => subjectStatsMap[s].attempted > 0 || subjectsList.includes(s))
        .map(subject => {
        const stats = subjectStatsMap[subject];
        const accuracy = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;
        const avgTime = stats.attempted ? Math.round((stats.timeSum / stats.attempted / 60) * 10) / 10 : 0;
        return {
          subject,
          attempted: stats.attempted,
          correct: stats.correct,
          accuracy,
          avgTime: avgTime || 2.0,
          weak: stats.attempted > 0 && accuracy < 60
        };
      });
      return res.json({ data });
    }
    
    if (viewType === "difficulty") {
      const diffMap = { Easy: { attempted: 0, correct: 0 }, Medium: { attempted: 0, correct: 0 }, Hard: { attempted: 0, correct: 0 } };
      submissions.forEach(sub => {
        const q = sub.questionId as any;
        if (q && q.difficulty && diffMap[q.difficulty as "Easy" | "Medium" | "Hard"]) {
          diffMap[q.difficulty as "Easy" | "Medium" | "Hard"].attempted++;
          if (sub.isCorrect) diffMap[q.difficulty as "Easy" | "Medium" | "Hard"].correct++;
        }
      });
      const data = (["Easy", "Medium", "Hard"] as const).map(level => {
        const stats = diffMap[level];
        return { level, accuracy: stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0, attempted: stats.attempted, correct: stats.correct };
      });
      return res.json({ data });
    }

    if (viewType === "questionType") {
      const typeMap = { MCQ: { attempted: 0, correct: 0, timeSum: 0 }, MSQ: { attempted: 0, correct: 0, timeSum: 0 }, NAT: { attempted: 0, correct: 0, timeSum: 0 } };
      submissions.forEach(sub => {
        const q = sub.questionId as any;
        if (q && q.questionType && typeMap[q.questionType as "MCQ" | "MSQ" | "NAT"]) {
          const qt = q.questionType as "MCQ" | "MSQ" | "NAT";
          typeMap[qt].attempted++;
          if (sub.isCorrect) typeMap[qt].correct++;
          typeMap[qt].timeSum += (sub.timeTaken || 120);
        }
      });
      const data = (["MCQ (Single)", "MSQ", "NAT"] as const).map(type => {
        const dbType = type === "MCQ (Single)" ? "MCQ" : type;
        const stats = typeMap[dbType];
        const avgTime = stats.attempted ? Math.round((stats.timeSum / stats.attempted / 60) * 10) / 10 : 0;
        return { type, accuracy: stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0, attempted: stats.attempted, avgTime: avgTime || (type === "NAT" ? 4.2 : type === "MSQ" ? 3.1 : 1.6) };
      });
      return res.json({ data });
    }

    return res.json({ data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const submissions = await Submission.find({ userId }).populate("questionId").lean();
    
    const subjectStatsMap: Record<string, { attempted: number; correct: number; topics: Set<string> }> = {};
    for (const sub of subjectsList) subjectStatsMap[sub] = { attempted: 0, correct: 0, topics: new Set() };
    
    submissions.forEach(sub => {
      const q = sub.questionId as any;
      if (!q) return;
      const matchedSubs = getSubjectsForTopic(q.topic);
      matchedSubs.forEach(s => {
        if (!subjectStatsMap[s]) subjectStatsMap[s] = { attempted: 0, correct: 0, topics: new Set() };
        subjectStatsMap[s].attempted++;
        if (sub.isCorrect) subjectStatsMap[s].correct++;
        if (q.topic) subjectStatsMap[s].topics.add(q.topic);
      });
    });

    const subjects = Object.keys(subjectStatsMap).map(subject => {
      const stats = subjectStatsMap[subject];
      return {
        subject,
        attempted: stats.attempted,
        correct: stats.correct,
        accuracy: stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0,
        topicsCompleted: stats.topics.size,
      };
    });

    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getSubjectDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const { subjectId } = req.params;
    
    const submissions = await Submission.find({ userId }).populate("questionId").lean();
    
    const topicStats: Record<string, { attempted: number; correct: number }> = {};
    
    submissions.forEach(sub => {
      const q = sub.questionId as any;
      if (!q) return;
      const matchedSubs = getSubjectsForTopic(q.topic);
      if (matchedSubs.includes(subjectId as string)) {
        const t = q.topic || "General";
        if (!topicStats[t]) topicStats[t] = { attempted: 0, correct: 0 };
        topicStats[t].attempted++;
        if (sub.isCorrect) topicStats[t].correct++;
      }
    });

    const topics = Object.keys(topicStats).map(topic => {
      const stats = topicStats[topic];
      return {
        topic,
        attempted: stats.attempted,
        accuracy: stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0,
      };
    });

    res.json({ subject: subjectId, topics });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTestHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // We can fetch from ContestStanding or ContestRegistration where status is finished
    const standings = await ContestStanding.find({ userId, disqualified: false })
      .populate("contestId", "title contestType startTime endTime ratingEnabled status")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
      
    const total = await ContestStanding.countDocuments({ userId, disqualified: false });

    const tests = standings.map((standing: any) => {
      const contest = standing.contestId;
      return {
        id: contest?._id,
        title: contest?.title || "Unknown Test",
        type: contest?.contestType || "Mock",
        date: standing.updatedAt,
        score: standing.score,
        rank: standing.rank,
        accuracy: standing.solvedCount ? Math.round((standing.solvedCount / (standing.solvedCount + standing.penaltyMinutes/20)) * 100) : 0, // rough estimate
        timeSpent: standing.penaltyMinutes,
      };
    });

    res.json({ tests, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTimeAnalysis = async (req: Request, res: Response) => {
  res.json({ timeAnalysis: {} });
};

export const getWeakAreas = async (req: Request, res: Response) => {
  res.json({ weakAreas: [] });
};

export const getRecommendations = async (req: Request, res: Response) => {
  res.json({ recommendations: [] });
};

export const getContestPerformance = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    
    // 1. Rating History
    const ratingHistories = await RatingHistory.find({ userId })
      .populate("contestId", "title startTime endTime")
      .sort({ appliedAt: 1, createdAt: 1 })
      .lean();
    const ratingData = ratingHistories.map((h: any, index) => {
      const contest = h.contestId;
      const contestDate = contest?.endTime || contest?.startTime || h.appliedAt || h.createdAt;
      return {
        label: `Contest ${index + 1}`,
        date: new Date(contestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rating: h.newRating,
        contestTitle: contest?.title || `Rated Contest ${index + 1}`,
      };
    });

    // 2. Test Type Performance
    const standings = await ContestStanding.find({ userId, disqualified: false }).populate("contestId").lean();
    
    const typeStats: Record<string, { attempted: number; totalScore: number; totalAccuracy: number; bestRank: number }> = {};
    const types = ["Full Mock", "Subject Test", "Chapter Test", "Practice Set", "PYQ Set"];
    types.forEach(t => typeStats[t] = { attempted: 0, totalScore: 0, totalAccuracy: 0, bestRank: 999999 });

    let totalRank = 0;
    let totalPenalty = 0;

    standings.forEach((st: any) => {
      const contest = st.contestId;
      if (!contest) return;
      const type = contest.contestType || "Practice Set";
      
      if (!typeStats[type]) typeStats[type] = { attempted: 0, totalScore: 0, totalAccuracy: 0, bestRank: 999999 };
      
      typeStats[type].attempted++;
      typeStats[type].totalScore += (st.score || 0);
      const acc = st.solvedCount ? Math.round((st.solvedCount / (st.solvedCount + (st.penaltyMinutes || 0)/20)) * 100) : 0;
      typeStats[type].totalAccuracy += acc;
      if ((st.rank || 999999) < typeStats[type].bestRank) {
        typeStats[type].bestRank = st.rank;
      }

      totalRank += (st.rank || 0);
      totalPenalty += (st.penaltyMinutes || 0);
    });

    const testTypePerformance = Object.keys(typeStats).filter(t => typeStats[t].attempted > 0).map(type => {
      const stats = typeStats[type];
      return {
        type,
        attempted: stats.attempted,
        avgScore: Math.round((stats.totalScore / stats.attempted) * 10) / 10,
        avgAccuracy: Math.round(stats.totalAccuracy / stats.attempted),
        bestRank: stats.bestRank === 999999 ? "-" : stats.bestRank
      };
    });

    const contestSummary = {
      ratedContests: ratingHistories.length,
      highestRating: ratingHistories.length > 0 ? Math.max(...ratingHistories.map(h => h.newRating)) : 1500,
      averageRank: standings.length > 0 ? Math.round(totalRank / standings.length) : "-",
      avgPenalty: standings.length > 0 ? Math.round(totalPenalty / standings.length) : 0
    };

    res.json({ ratingData, testTypePerformance, contestSummary });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  res.json({ leaderboard: [] });
};

export const getActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const submissions = await Submission.find({ userId })
      .select("createdAt isCorrect timeTaken questionId")
      .sort({ createdAt: 1 })
      .lean();

    const byDate = new Map<string, { count: number; correct: number; timeSeconds: number }>();
    submissions.forEach((submission) => {
      const date = new Date(submission.createdAt).toISOString().split("T")[0];
      const current = byDate.get(date) || { count: 0, correct: 0, timeSeconds: 0 };
      current.count += 1;
      if (submission.isCorrect) current.correct += 1;
      current.timeSeconds += submission.timeTaken || 120;
      byDate.set(date, current);
    });

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const yearsWithActivity = Array.from(
      new Set(submissions.map((submission) => new Date(submission.createdAt).getUTCFullYear()))
    ).sort((a, b) => b - a);
    const availableYears = yearsWithActivity.includes(currentYear) ? yearsWithActivity : [currentYear, ...yearsWithActivity];
    const requestedYear = Number(req.query.year);
    const selectedYear = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= currentYear
      ? requestedYear
      : currentYear;
    const start = new Date(Date.UTC(selectedYear, 0, 1));
    const end = new Date(Date.UTC(selectedYear, 11, 31));
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    const heatmapData: { date: string; count: number; studyTimeMinutes: number; accuracy: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const row = byDate.get(dateStr) || { count: 0, correct: 0, timeSeconds: 0 };
      heatmapData.push({
        date: dateStr,
        count: row.count,
        studyTimeMinutes: Math.round(row.timeSeconds / 60),
        accuracy: row.count ? Math.round((row.correct / row.count) * 100) : 0,
      });
    }

    const solvedQuestionIds = Array.from(
      new Set(submissions.filter((submission) => submission.isCorrect).map((submission) => String(submission.questionId)))
    );
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const solvedLastYear = new Set(
      submissions
        .filter((submission) => submission.isCorrect && new Date(submission.createdAt) >= oneYearAgo)
        .map((submission) => String(submission.questionId))
    ).size;
    const solvedLastMonth = new Set(
      submissions
        .filter((submission) => submission.isCorrect && new Date(submission.createdAt) >= oneMonthAgo)
        .map((submission) => String(submission.questionId))
    ).size;

    function maxStreakSince(start?: Date) {
      const activeDays = Array.from(byDate.keys())
        .filter((date) => !start || new Date(`${date}T00:00:00.000Z`) >= start)
        .sort();
      let best = 0;
      let current = 0;
      let previous: Date | null = null;
      for (const date of activeDays) {
        const currentDate = new Date(`${date}T00:00:00.000Z`);
        if (!previous) {
          current = 1;
        } else {
          const diff = Math.round((currentDate.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000));
          current = diff === 1 ? current + 1 : 1;
        }
        best = Math.max(best, current);
        previous = currentDate;
      }
      return best;
    }

    res.json({
      activity: heatmapData,
      year: selectedYear,
      availableYears,
      startDate: heatmapData[0]?.date,
      endDate: heatmapData[heatmapData.length - 1]?.date,
      stats: {
        solvedAllTime: solvedQuestionIds.length,
        solvedLastYear,
        solvedLastMonth,
        maxStreak: maxStreakSince(),
        streakLastYear: maxStreakSince(oneYearAgo),
        streakLastMonth: maxStreakSince(oneMonthAgo),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getSkillRadar = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const radarSubjects = ["Probability & Statistics", "Linear Algebra", "Calculus", "Optimization", "Programming", "Data Structures", "Algorithms", "Machine Learning", "Aptitude"];
    
    const submissions = await Submission.find({ userId }).populate("questionId").lean();
    
    const stats: Record<string, { attempted: number; correct: number; hardCorrect: number; timeSum: number; recent: number }> = {};
    radarSubjects.forEach(s => stats[s] = { attempted: 0, correct: 0, hardCorrect: 0, timeSum: 0, recent: 0 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    submissions.forEach(sub => {
      const q = sub.questionId as any;
      if (!q) return;
      const matched = getSubjectsForTopic(q.topic);
      matched.forEach(match => {
        // Map to radar subjects
        let target = match;
        if (match === "Probability" || match === "Statistics") target = "Probability & Statistics";
        if (match === "Python") target = "Programming";
        
        if (stats[target]) {
          stats[target].attempted++;
          if (sub.isCorrect) stats[target].correct++;
          if (sub.isCorrect && (q.difficulty === "Hard" || sub.difficulty === "Hard")) stats[target].hardCorrect++;
          stats[target].timeSum += (sub.timeTaken || 120);
          if (new Date(sub.createdAt) >= thirtyDaysAgo) stats[target].recent++;
        }
      });
    });

    const radar = radarSubjects.map(sub => {
      const s = stats[sub];
      const accuracy = s.attempted ? (s.correct / s.attempted) * 100 : 0;
      const difficultyScore = s.correct ? (s.hardCorrect / s.correct) * 100 * 2 : 0; // scaled
      const consistency = Math.min((s.recent / 20) * 100, 100); // 20 recent attempts = 100% consistency
      const avgTime = s.attempted ? s.timeSum / s.attempted : 120;
      const speedScore = Math.max(0, 100 - (avgTime / 3)); // simple speed metric
      const contestScore = s.attempted ? Math.min(accuracy + 10, 100) : 0; // placeholder for real contest subject score
      
      const score = Math.round(
        0.35 * accuracy +
        0.25 * Math.min(difficultyScore, 100) +
        0.20 * consistency +
        0.10 * speedScore +
        0.10 * contestScore
      );

      return {
        subjectId: sub.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        subjectName: sub,
        score: score || 0,
        accuracy: Math.round(accuracy),
        difficultyScore: Math.round(Math.min(difficultyScore, 100)),
        consistency: Math.round(consistency),
        speedScore: Math.round(speedScore),
        contestScore: Math.round(contestScore)
      };
    });

    res.json({ radar });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getSkillMastery = async (req: Request, res: Response) => {
  res.json({ mastery: [] });
};

export const getTopicGraph = async (req: Request, res: Response) => {
  res.json({ nodes: [], edges: [] });
};

export const getProblemPhaseDiagram = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    const submissions = await Submission.find({ userId }).populate("questionId").lean();
    
    const data = submissions.map(sub => {
      const q = sub.questionId as any;
      const timeTaken = sub.timeTaken || 120;
      const isCorrect = sub.isCorrect;
      
      // Classify quadrant
      let bucket = "";
      if (timeTaken <= 90 && isCorrect) bucket = "Fast + Accurate";
      else if (timeTaken > 90 && isCorrect) bucket = "Slow + Accurate";
      else if (timeTaken <= 90 && !isCorrect) bucket = "Fast + Wrong";
      else bucket = "Slow + Wrong";

      return {
        title: q?.title || "Unknown Problem",
        subject: q ? getSubjectsForTopic(q.topic)[0] : "General",
        difficulty: sub.difficulty || q?.difficulty || "Medium",
        timeTaken,
        isCorrect,
        bucket
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getProblemTimeline = async (req: Request, res: Response) => {
  res.json({ timeline: [] });
};

export const getIntelligenceIndex = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser!._id;
    // Calculate Mathematical Intelligence Index (MII)
    const stats = await calculateUserStats(userId);
    
    const accuracyScore = stats.overallAccuracy;
    const consistencyScore = Math.min((stats.currentStreakDays / 30) * 100, 100);
    const difficultyWeightedSolvedScore = Math.min((stats.problemsSolved / 200) * 100, 100);
    const subjectBalanceScore = 75; // simplified
    const contestScore = 80; // simplified
    const theoryCompletionScore = 60; // simplified
    const revisionScore = 50; // simplified
    
    // MII = 0.20 * difficultyWeightedSolvedScore + 0.20 * accuracyScore + 0.15 * consistencyScore + 0.15 * subjectBalanceScore + 0.10 * contestScore + 0.10 * theoryCompletionScore + 0.10 * revisionScore
    const mii = Math.round(
      0.20 * difficultyWeightedSolvedScore +
      0.20 * accuracyScore +
      0.15 * consistencyScore +
      0.15 * subjectBalanceScore +
      0.10 * contestScore +
      0.10 * theoryCompletionScore +
      0.10 * revisionScore
    );

    res.json({ 
      index: mii || 0, 
      details: {
        accuracyScore,
        consistencyScore: Math.round(consistencyScore),
        difficultyWeightedSolvedScore: Math.round(difficultyWeightedSolvedScore)
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getActivityTimeline = async (req: Request, res: Response) => {
  res.json({ timeline: [] });
};

export const streamDashboard = async (req: Request, res: Response) => {
  res.status(200).end();
};
