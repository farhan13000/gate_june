import { Request, Response } from "express";
import User from "../models/User";
import Submission from "../models/Submission";
import RatingHistory from "../models/RatingHistory";
import Contest from "../models/Contest";
import ContestRegistration from "../models/ContestRegistration";
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

const buildRatingHistory = (currentRating: number) => {
  const baseRating = 1500;
  const diff = Math.max(0, currentRating - baseRating);
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const progress = index / 5;
    const rating = index === 5 ? currentRating : Math.round(baseRating + diff * progress);
    return {
      date: monthFormatter.format(date),
      rating,
    };
  });
};

const getRatingData = async (userId: any, currentRating: number) => {
  const ratingHistory = await RatingHistory.find({ userId })
    .populate("contestId", "title")
    .sort({ appliedAt: 1, createdAt: 1 })
    .lean();
  const ratingData = ratingHistory.length
    ? ratingHistory.map((item: any) => ({
        date: new Date(item.appliedAt || item.createdAt).toISOString().slice(0, 10),
        contest: item.contestId?.title || "Contest",
        rating: item.newRating,
        delta: item.delta,
        rank: item.rank,
      }))
    : buildRatingHistory(currentRating);
  return { ratingHistory, ratingData };
};

const getRatingSummary = async (userId: any, currentRating: number, ratingHistory: any[]) => {
  const highestFromHistory = ratingHistory.reduce((max, item: any) => {
    return Math.max(max, Number(item.oldRating || 0), Number(item.newRating || 0));
  }, Number(currentRating || 0));

  if (!currentRating || currentRating <= 0) {
    return {
      globalRank: null,
      countryRank: null,
      highestRating: highestFromHistory,
      ratedUsers: await User.countDocuments({ role: "student", rating: { $gt: 0 } }),
    };
  }

  const [higherRatedUsers, ratedUsers] = await Promise.all([
    User.countDocuments({
      role: "student",
      rating: { $gt: currentRating },
      _id: { $ne: userId },
    }),
    User.countDocuments({ role: "student", rating: { $gt: 0 } }),
  ]);

  return {
    globalRank: higherRatedUsers + 1,
    countryRank: null,
    highestRating: Math.max(highestFromHistory, currentRating),
    ratedUsers,
  };
};

const getContestDashboardData = async (userId: any) => {
  const now = new Date();
  const [registrations, upcomingContests, recentRatings] = await Promise.all([
    ContestRegistration.find({ userId, status: { $ne: "withdrawn" } })
      .populate("contestId", "title contestType lifecycle startTime endTime durationMinutes ratingEnabled")
      .sort({ updatedAt: -1 })
      .lean(),
    Contest.find({
      status: { $in: ["approved", "completed"] },
      visibility: "public",
      lifecycle: { $ne: "draft" },
      endTime: { $gte: now },
    })
      .select("title contestType lifecycle registrationStartTime registrationEndTime startTime endTime durationMinutes ratingEnabled")
      .sort({ startTime: 1 })
      .limit(5)
      .lean(),
    RatingHistory.find({ userId })
      .populate("contestId", "title contestType")
      .sort({ appliedAt: -1, createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const registeredIds = new Set(
    registrations
      .filter((registration: any) => registration.contestId)
      .map((registration: any) => String(registration.contestId._id))
  );

  const contestSummary = {
    registered: registrations.length,
    participated: registrations.filter((registration: any) => registration.status === "checked_in" || registration.finishedAt).length,
    rated: recentRatings.length,
    upcomingRegistered: registrations.filter((registration: any) => {
      const contest = registration.contestId;
      return contest && ["upcoming", "registration_open", "live", "frozen"].includes(getContestState(contest));
    }).length,
  };

  return {
    contestSummary,
    upcomingContests: upcomingContests.map((contest: any) => ({
      _id: contest._id,
      title: contest.title,
      contestType: contest.contestType,
      contestState: getContestState(contest),
      startTime: contest.startTime,
      endTime: contest.endTime,
      durationMinutes: contest.durationMinutes,
      ratingEnabled: contest.ratingEnabled,
      registered: registeredIds.has(String(contest._id)),
    })),
    recentContestResults: recentRatings.map((rating: any) => ({
      contestId: rating.contestId?._id,
      title: rating.contestId?.title || "Contest",
      contestType: rating.contestId?.contestType || "contest",
      oldRating: rating.oldRating,
      newRating: rating.newRating,
      delta: rating.delta,
      rank: rating.rank,
      participants: rating.participants,
      appliedAt: rating.appliedAt || rating.createdAt,
    })),
  };
};

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

// Helper to calculate user stats
const calculateUserStats = async (userId: any) => {
  const totalAttempted = await Submission.countDocuments({ userId });
  const totalCorrect = await Submission.countDocuments({ userId, isCorrect: true });
  const overallAccuracy = totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const solvedQuestions = await Submission.distinct("questionId", { userId, isCorrect: true });
  const problemsSolved = solvedQuestions.length;

  // Streak calculation
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

  return {
    totalAttempted,
    totalCorrect,
    overallAccuracy,
    problemsSolved,
    currentStreakDays
  };
};

// GET /api/dashboard
export const getDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = req.currentUser;
    const userId = user._id;

    // Fetch stats
    const statsSummary = await calculateUserStats(userId);
    const submissions = await Submission.find({ userId }).populate("questionId");

    // Subject Performance
    const subjectStatsMap: Record<string, { attempted: number; correct: number; timeSum: number }> = {};
    for (const sub of subjectsList) {
      subjectStatsMap[sub] = { attempted: 0, correct: 0, timeSum: 0 };
    }

    const dynamicSubjects = new Set(subjectsList);

    for (const sub of submissions) {
      const q = sub.questionId as any;
      if (!q) continue;
      const matchedSubs = getSubjectsForTopic(q.topic);
      for (const s of matchedSubs) {
        if (!subjectStatsMap[s]) {
          subjectStatsMap[s] = { attempted: 0, correct: 0, timeSum: 0 };
          dynamicSubjects.add(s);
        }
        subjectStatsMap[s].attempted++;
        if (sub.isCorrect) {
          subjectStatsMap[s].correct++;
        }
        subjectStatsMap[s].timeSum += (sub.timeTaken || 120);
      }
    }

    const subjectPerformance = Array.from(dynamicSubjects).map(subject => {
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

    // Difficulty Performance
    const difficultyStatsMap = {
      Easy: { attempted: 0, correct: 0 },
      Medium: { attempted: 0, correct: 0 },
      Hard: { attempted: 0, correct: 0 }
    };

    for (const sub of submissions) {
      const q = sub.questionId as any;
      if (!q || !q.difficulty) continue;
      const diff = q.difficulty as "Easy" | "Medium" | "Hard";
      if (difficultyStatsMap[diff]) {
        difficultyStatsMap[diff].attempted++;
        if (sub.isCorrect) {
          difficultyStatsMap[diff].correct++;
        }
      }
    }

    const difficultyPerformance = (["Easy", "Medium", "Hard"] as const).map(level => {
      const stats = difficultyStatsMap[level];
      const accuracy = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;
      return {
        level,
        accuracy,
        attempted: stats.attempted,
        correct: stats.correct
      };
    });

    // Question Type Performance
    const typeStatsMap = {
      MCQ: { attempted: 0, correct: 0, timeSum: 0 },
      MSQ: { attempted: 0, correct: 0, timeSum: 0 },
      NAT: { attempted: 0, correct: 0, timeSum: 0 }
    };

    for (const sub of submissions) {
      const q = sub.questionId as any;
      if (!q || !q.questionType) continue;
      const qType = q.questionType as "MCQ" | "MSQ" | "NAT";
      if (typeStatsMap[qType]) {
        typeStatsMap[qType].attempted++;
        if (sub.isCorrect) {
          typeStatsMap[qType].correct++;
        }
        typeStatsMap[qType].timeSum += (sub.timeTaken || 120);
      }
    }

    const questionTypePerformance = (["MCQ (Single)", "MSQ", "NAT"] as const).map(type => {
      const dbType = type === "MCQ (Single)" ? "MCQ" : type as "MSQ" | "NAT";
      const stats = typeStatsMap[dbType];
      const accuracy = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;
      const avgTime = stats.attempted ? Math.round((stats.timeSum / stats.attempted / 60) * 10) / 10 : 0;
      return {
        type,
        accuracy,
        attempted: stats.attempted,
        avgTime: avgTime || (type === "NAT" ? 4.2 : type === "MSQ" ? 3.1 : 1.6)
      };
    });

    // Weekly Activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const weeklyActivity = last7Days.map(date => {
      const dayName = dayNames[date.getDay()];
      const dateStr = date.toISOString().split("T")[0];
      const subsForDay = submissions.filter(s => new Date(s.createdAt).toISOString().split("T")[0] === dateStr);
      const questionsCount = subsForDay.length;
      const timeSpent = subsForDay.reduce((sum, s) => sum + (s.timeTaken || 120), 0) / 60;
      return {
        day: dayName,
        questions: questionsCount,
        time: Math.round(timeSpent * 10) / 10
      };
    });

    // Submissions Heatmap
    const heatmapData: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 180; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = submissions.filter(s => new Date(s.createdAt).toISOString().split("T")[0] === dateStr).length;
      heatmapData.push({ date: dateStr, count });
    }

    // Chapter-wise focus areas
    const defaultChapters = [
      { chapter: "Eigenvalues", subject: "Linear Algebra", defaultAccuracy: 35, format: "NAT + MCQ" },
      { chapter: "Gradient Descent", subject: "Optimization", defaultAccuracy: 28, format: "NAT" },
      { chapter: "Bayes Theorem", subject: "Probability", defaultAccuracy: 55, format: "MCQ Multi" },
      { chapter: "SQL Joins", subject: "Databases", defaultAccuracy: 88, format: "MCQ Single" },
      { chapter: "SVM Kernels", subject: "Machine Learning", defaultAccuracy: 32, format: "MCQ Multi" },
      { chapter: "Integration", subject: "Calculus", defaultAccuracy: 48, format: "NAT" },
      { chapter: "Hypothesis Testing", subject: "Statistics", defaultAccuracy: 61, format: "NAT + MCQ" },
      { chapter: "Decision Trees", subject: "Machine Learning", defaultAccuracy: 71, format: "MCQ Single" },
    ];

    const chapterWiseData = defaultChapters.map(item => {
      const matchingSubs = submissions.filter(s => {
        const q = s.questionId as any;
        if (!q) return false;
        const topicLower = q.topic.toLowerCase();
        return topicLower.includes(item.chapter.toLowerCase()) || topicLower.includes(item.subject.toLowerCase());
      });

      const attempted = matchingSubs.length;
      const correct = matchingSubs.filter(s => s.isCorrect).length;
      const accuracy = attempted ? Math.round((correct / attempted) * 100) : item.defaultAccuracy;
      const priority = accuracy < 50 ? "High" : accuracy < 75 ? "Medium" : "Low";

      return {
        chapter: item.chapter,
        subject: item.subject,
        accuracy,
        priority,
        format: item.format
      };
    });

    const currentRating = user.rating || 0;
    const { ratingHistory, ratingData } = await getRatingData(userId, currentRating);
    const ratingSummary = await getRatingSummary(userId, currentRating, ratingHistory);
    const contestDashboard = await getContestDashboardData(userId);

    const dashboard = {
      profile: user.toProfile(),
      stats: {
        problemsSolved: statsSummary.problemsSolved,
        contestsParticipated: contestDashboard.contestSummary.participated || ratingHistory.length,
        currentStreakDays: statsSummary.currentStreakDays,
        overallAccuracy: statsSummary.overallAccuracy,
        rating: currentRating,
        globalRank: ratingSummary.globalRank,
        countryRank: ratingSummary.countryRank,
        highestRating: ratingSummary.highestRating,
        ratedUsers: ratingSummary.ratedUsers,
        totalAttempted: statsSummary.totalAttempted,
        totalCorrect: statsSummary.totalCorrect,
      },
      subjectPerformance,
      difficultyPerformance,
      questionTypePerformance,
      weeklyActivity,
      heatmapData,
      chapterWiseData,
      ratingData,
      ...contestDashboard,
    };

    res.json({ dashboard });
  } catch (error) {
    console.error("getDashboard error:", error);
    res.status(500).json({ message: "Server error building dashboard" });
  }
};

// GET /api/dashboard/stream (SSE)
export const streamDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      res.status(401).end();
      return;
    }

    const userId = req.currentUser._id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendUpdate = async () => {
      try {
        const user = await User.findById(userId);
        if (!user) return;

        const statsSummary = await calculateUserStats(userId);
        const currentRating = user.rating || 0;
        const rating = await getRatingData(userId, currentRating);
        const ratingSummary = await getRatingSummary(userId, currentRating, rating.ratingHistory);
        const contestDashboard = await getContestDashboardData(userId);

        const payload = {
          timestamp: new Date().toISOString(),
          rating: currentRating,
          globalRank: ratingSummary.globalRank,
          countryRank: ratingSummary.countryRank,
          highestRating: ratingSummary.highestRating,
          ratedUsers: ratingSummary.ratedUsers,
          contestsParticipated: contestDashboard.contestSummary.participated || rating.ratingHistory.length,
          ratingData: rating.ratingData,
          contestSummary: contestDashboard.contestSummary,
          upcomingContests: contestDashboard.upcomingContests,
          recentContestResults: contestDashboard.recentContestResults,
          problemsSolved: statsSummary.problemsSolved,
          overallAccuracy: statsSummary.overallAccuracy,
          currentStreakDays: statsSummary.currentStreakDays,
          totalAttempted: statsSummary.totalAttempted,
          totalCorrect: statsSummary.totalCorrect,
        };
        res.write(`event: dashboard-update\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        console.error("SSE sendUpdate error:", err);
      }
    };

    await sendUpdate();

    const iv = setInterval(sendUpdate, 5000);

    req.on("close", () => {
      clearInterval(iv);
    });
  } catch (error) {
    console.error("streamDashboard error:", error);
    res.status(500).end();
  }
};
