import type { Types } from "mongoose";
import ContestStanding from "../../models/ContestStanding";
import Submission from "../../models/Submission";
import TheoryProgress from "../../models/TheoryProgress";
import UserActivityLog from "../../models/UserActivityLog";
import { getDashboardCache, setDashboardCache } from "../../utils/dashboard/dashboardCache";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function lastNDays(days: number) {
  const now = new Date();
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - 1 - index));
    return toDateKey(date);
  });
}

async function getSubmissionStats(userId: Types.ObjectId) {
  const [totalAttempts, solvedQuestions, submissions] = await Promise.all([
    Submission.countDocuments({ userId }),
    Submission.distinct("questionId", { userId, isCorrect: true }),
    Submission.find({ userId }).select("createdAt isCorrect timeTaken subjectId difficulty").sort({ createdAt: -1 }).lean(),
  ]);
  const correctAttempts = solvedQuestions.length;

  const accuracy = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const activeDays = Array.from(new Set(submissions.map((item) => toDateKey(new Date(item.createdAt))))).sort().reverse();

  let streak = 0;
  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - DAY_MS));

  if (activeDays[0] === today || activeDays[0] === yesterday) {
    streak = 1;
    let cursor = new Date(activeDays[0]);
    for (let index = 1; index < activeDays.length; index++) {
      const next = new Date(activeDays[index]);
      const diff = Math.round((cursor.getTime() - next.getTime()) / DAY_MS);
      if (diff === 1) {
        streak++;
        cursor = next;
      } else if (diff > 1) {
        break;
      }
    }
  }

  return {
    totalAttempts,
    correctAttempts,
    problemsSolved: solvedQuestions.length,
    accuracy,
    streak,
    submissions,
  };
}

export async function getReadinessScore(userId: Types.ObjectId) {
  const cacheKey = `dashboard:overview:readiness:${userId}`;
  const cached = getDashboardCache<unknown>(cacheKey);
  if (cached) return cached;

  const stats = await getSubmissionStats(userId);
  const contestCount = await ContestStanding.countDocuments({ userId, disqualified: false });
  const theory = await TheoryProgress.find({ userId }).select("progressPercent completed").lean();
  const avgTheory = theory.length
    ? Math.round(theory.reduce((sum, item) => sum + (item.progressPercent || 0), 0) / theory.length)
    : 0;

  const consistencyScore = Math.min(stats.streak * 7, 100);
  const volumeScore = Math.min(stats.problemsSolved / 2, 100);
  const contestScore = Math.min(contestCount * 12, 100);
  const readiness = Math.round(
    stats.accuracy * 0.34 +
      consistencyScore * 0.2 +
      volumeScore * 0.18 +
      avgTheory * 0.16 +
      contestScore * 0.12
  );

  return setDashboardCache(cacheKey, {
    readinessScore: readiness,
    percentileProjection: Math.min(99, Math.max(35, Math.round(readiness * 0.82 + stats.accuracy * 0.18))),
    motivationalInsight:
      readiness >= 75
        ? "Your preparation signal is strong. Prioritize timed mocks and revision precision."
        : readiness >= 50
          ? "Your base is forming. Improve consistency and close weak-topic gaps this week."
          : "Start with steady daily practice. A small streak will quickly improve readiness.",
    dailySummary: {
      problemsSolved: stats.problemsSolved,
      accuracy: stats.accuracy,
      studyHours: Math.round((stats.submissions.reduce((sum, item) => sum + (item.timeTaken || 120), 0) / 3600) * 10) / 10,
      mockTests: contestCount,
    },
  });
}

export async function getStreakTracking(userId: Types.ObjectId) {
  const stats = await getSubmissionStats(userId);
  return {
    currentStreak: stats.streak,
    consistencyScore: Math.min(100, Math.round(stats.streak * 7 + stats.accuracy * 0.25)),
  };
}

export async function getWeeklyPerformance(userId: Types.ObjectId) {
  const days = lastNDays(7);
  const since = new Date(`${days[0]}T00:00:00.000Z`);
  const submissions = await Submission.find({ userId, createdAt: { $gte: since } }).select("createdAt isCorrect timeTaken").lean();

  return {
    weekly: days.map((day) => {
      const items = submissions.filter((item) => toDateKey(new Date(item.createdAt)) === day);
      const correct = items.filter((item) => item.isCorrect).length;
      return {
        day: new Date(`${day}T00:00:00.000Z`).toLocaleDateString("en-US", { weekday: "short" }),
        attempts: items.length,
        accuracy: items.length ? Math.round((correct / items.length) * 100) : 0,
        hours: Math.round((items.reduce((sum, item) => sum + (item.timeTaken || 120), 0) / 3600) * 10) / 10,
      };
    }),
  };
}

export async function getStudyAnalytics(userId: Types.ObjectId) {
  const theory = await TheoryProgress.find({ userId }).select("subjectId progressPercent completed").lean();
  const subjectMap = new Map<string, { total: number; progress: number; completed: number }>();

  theory.forEach((item) => {
    const key = item.subjectId || "General";
    const current = subjectMap.get(key) ?? { total: 0, progress: 0, completed: 0 };
    current.total++;
    current.progress += item.progressPercent || 0;
    if (item.completed) current.completed++;
    subjectMap.set(key, current);
  });

  const subjects = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
    subject,
    completion: stats.total ? Math.round(stats.progress / stats.total) : 0,
    completedTopics: stats.completed,
    totalTopics: stats.total,
  }));

  return {
    subjects: subjects.length
      ? subjects
      : [
          { subject: "Probability", completion: 58, completedTopics: 7, totalTopics: 12 },
          { subject: "Linear Algebra", completion: 64, completedTopics: 9, totalTopics: 14 },
          { subject: "Machine Learning", completion: 42, completedTopics: 5, totalTopics: 12 },
          { subject: "Optimization", completion: 36, completedTopics: 4, totalTopics: 11 },
        ],
  };
}

export async function getContestSummary(userId: Types.ObjectId) {
  const standings = await ContestStanding.find({ userId, disqualified: false }).sort({ updatedAt: -1 }).limit(8).lean();
  const bestRank = standings.reduce<number | null>((best, item) => {
    if (!item.rank) return best;
    return best === null ? item.rank : Math.min(best, item.rank);
  }, null);

  return {
    mockTests: standings.length,
    currentRank: standings[0]?.rank ?? null,
    bestRank,
    averageScore: standings.length
      ? Math.round(standings.reduce((sum, item) => sum + (item.score || 0), 0) / standings.length)
      : 0,
    recent: standings.slice(0, 4).map((item, index) => ({
      label: `Contest ${index + 1}`,
      score: item.score || 0,
      rank: item.rank ?? "-",
      solved: item.solvedCount || 0,
    })),
  };
}

export async function getRecentActivity(userId: Types.ObjectId) {
  const activity = await UserActivityLog.find({ userId }).sort({ attemptedAt: -1 }).limit(8).lean();
  if (activity.length) {
    return {
      activity: activity.map((item) => ({
        type: item.activityType,
        title: item.source || item.topicId || item.subjectId || "Dashboard activity",
        timestamp: item.attemptedAt,
        meta: item.isCorrect === undefined ? "Recorded" : item.isCorrect ? "Correct" : "Needs review",
      })),
    };
  }

  const submissions = await Submission.find({ userId }).sort({ createdAt: -1 }).limit(8).lean();
  return {
    activity: submissions.map((item) => ({
      type: "problem_solved",
      title: item.subjectId || item.topicId || "Practice problem",
      timestamp: item.createdAt,
      meta: item.isCorrect ? "Correct" : "Needs review",
    })),
  };
}

export const dashboardOverviewService = {
  getContestSummary,
  getReadinessScore,
  getRecentActivity,
  getStreakTracking,
  getStudyAnalytics,
  getWeeklyPerformance,
};
