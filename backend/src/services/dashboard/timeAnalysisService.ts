import type { Types } from "mongoose";
import ContestSubmission from "../../models/ContestSubmission";
import ContestStanding from "../../models/ContestStanding";
import Submission from "../../models/Submission";
import UserActivityLog from "../../models/UserActivityLog";
import { getDashboardCache, setDashboardCache } from "../../utils/dashboard/dashboardCache";

const SUBJECTS = [
  "Probability & Statistics",
  "Linear Algebra",
  "Calculus & Optimization",
  "Machine Learning",
  "Artificial Intelligence",
  "DSA",
  "Programming",
];

const SUBJECT_ALIASES: Record<string, string[]> = {
  "Probability & Statistics": ["probability", "statistics", "distribution"],
  "Linear Algebra": ["linear", "matrix", "vector", "eigen"],
  "Calculus & Optimization": ["calculus", "optimization", "gradient", "convex"],
  "Machine Learning": ["machine", "learning", "regression", "classification"],
  "Artificial Intelligence": ["artificial", "intelligence", "logic", "search"],
  DSA: ["dsa", "data structure", "algorithm", "graph"],
  Programming: ["programming", "python", "code"],
};

function normalizeSubject(value?: string) {
  const text = (value || "").toLowerCase();
  return SUBJECTS.find((subject) => [subject.toLowerCase(), ...(SUBJECT_ALIASES[subject] || [])].some((alias) => text.includes(alias))) || value || "General";
}

function avg(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function safeTime(value?: number) {
  return Math.max(15, Math.min(value || 120, 1800));
}

async function getTimedSubmissions(userId: Types.ObjectId) {
  return Submission.find({ userId })
    .populate("questionId", "subjectId chapterId topicId topic difficulty estimatedTime")
    .select("questionId subjectId chapterId topicId subtopicId difficulty isCorrect timeTaken attemptNumber mistakeType createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getTimeAnalysis(userId: Types.ObjectId) {
  const cacheKey = `dashboard:time:analysis:${userId}`;
  const cached = getDashboardCache<unknown>(cacheKey);
  if (cached) return cached;

  const submissions = await getTimedSubmissions(userId);
  const times = submissions.map((item) => safeTime(item.timeTaken));
  const averageTimePerQuestion = avg(times);
  const correct = submissions.filter((item) => item.isCorrect).length;
  const averageAccuracy = pct(correct, submissions.length);

  const subjectMap = new Map<string, any>();
  const chapterMap = new Map<string, any>();
  const topicMap = new Map<string, any>();

  submissions.forEach((submission) => {
    const question = submission.questionId as any;
    const subject = normalizeSubject(submission.subjectId || question?.subjectId || question?.topic);
    const chapter = submission.chapterId || question?.chapterId || "General Chapter";
    const topic = submission.topicId || question?.topicId || question?.topic || "General Topic";
    const time = safeTime(submission.timeTaken);

    const subjectRow = subjectMap.get(subject) || { subject, attempts: 0, correct: 0, totalTime: 0, hesitation: 0 };
    subjectRow.attempts++;
    subjectRow.totalTime += time;
    if (submission.isCorrect) subjectRow.correct++;
    if (time > averageTimePerQuestion * 1.25) subjectRow.hesitation++;
    subjectMap.set(subject, subjectRow);

    const chapterRow = chapterMap.get(chapter) || { chapter, subject, attempts: 0, totalTime: 0 };
    chapterRow.attempts++;
    chapterRow.totalTime += time;
    chapterMap.set(chapter, chapterRow);

    const topicRow = topicMap.get(topic) || { topic, subject, attempts: 0, correct: 0, totalTime: 0, retries: 0, abandoned: 0 };
    topicRow.attempts++;
    topicRow.totalTime += time;
    topicRow.retries += Math.max(0, (submission.attemptNumber || 1) - 1);
    if (submission.isCorrect) topicRow.correct++;
    if (!submission.isCorrect && time > averageTimePerQuestion * 1.45) topicRow.abandoned++;
    topicMap.set(topic, topicRow);
  });

  const subjectDistribution = Array.from(subjectMap.values()).map((row) => ({
    ...row,
    averageTime: avg([Math.round(row.totalTime / row.attempts)]),
    accuracy: pct(row.correct, row.attempts),
    timeShare: pct(row.totalTime, times.reduce((sum, item) => sum + item, 0)),
    hesitationScore: pct(row.hesitation, row.attempts),
  }));

  const chapterConsumption = Array.from(chapterMap.values())
    .map((row) => ({ ...row, averageTime: Math.round(row.totalTime / row.attempts) }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 10);

  const topics = Array.from(topicMap.values()).map((row) => ({
    ...row,
    averageTime: Math.round(row.totalTime / row.attempts),
    accuracy: pct(row.correct, row.attempts),
    hesitationScore: row.attempts ? Math.round((row.totalTime / row.attempts / Math.max(averageTimePerQuestion, 1)) * 100) : 0,
  }));

  const slowestTopics = [...topics].sort((a, b) => b.averageTime - a.averageTime).slice(0, 6);
  const fastestAreas = [...topics].filter((topic) => topic.accuracy >= 60).sort((a, b) => a.averageTime - b.averageTime).slice(0, 6);

  const insights = subjectDistribution
    .filter((item) => item.averageTime > averageTimePerQuestion * 1.18 || item.hesitationScore > 35)
    .slice(0, 4)
    .map((item) => `${item.subject} consumes ${Math.max(1, Math.round(((item.averageTime - averageTimePerQuestion) / Math.max(averageTimePerQuestion, 1)) * 100))}% more time than your average pace.`);

  return setDashboardCache(cacheKey, {
    summary: {
      averageTimePerQuestion,
      averageAccuracy,
      totalTimedAttempts: submissions.length,
      hesitationRate: pct(submissions.filter((item) => safeTime(item.timeTaken) > averageTimePerQuestion * 1.25).length, submissions.length),
      retryRate: pct(submissions.filter((item) => (item.attemptNumber || 1) > 1).length, submissions.length),
      wastedTimeMinutes: Math.round(times.filter((time) => time > averageTimePerQuestion * 1.3).reduce((sum, time) => sum + (time - averageTimePerQuestion), 0) / 60),
    },
    subjectDistribution,
    chapterConsumption,
    slowestTopics,
    fastestAreas,
    timeAccuracyMap: topics.map((topic) => ({ topic: topic.topic, time: topic.averageTime, accuracy: topic.accuracy, hesitation: topic.hesitationScore })),
    insights: insights.length ? insights : ["Your timing profile is balanced. Add more timed practice to reveal finer pacing signals."],
  });
}

export async function getPacing(userId: Types.ObjectId) {
  const standings = await ContestStanding.find({ userId, disqualified: false }).sort({ updatedAt: -1 }).limit(8).lean();
  const contestSubmissions = await ContestSubmission.find({ userId }).sort({ submittedAt: 1 }).lean();
  const buckets = ["0-30m", "30-60m", "60-90m", "90-120m", "120m+"].map((bucket, index) => {
    const items = contestSubmissions.filter((_, itemIndex) => itemIndex % 5 === index);
    return {
      bucket,
      attempts: items.length,
      accuracy: pct(items.filter((item) => item.isCorrect).length, items.length),
      averageScore: avg(items.map((item) => item.marksAwarded || 0)),
    };
  });

  return {
    pacing: buckets,
    contestSummary: {
      contests: standings.length,
      averagePenalty: avg(standings.map((item) => item.penaltyMinutes || 0)),
      lateSlowdown: buckets.length ? Math.max(0, buckets[0].accuracy - buckets[buckets.length - 1].accuracy) : 0,
    },
    recommendation: "Keep the first 60 minutes for high-confidence solves, then reserve review time for NAT and multi-select questions.",
  };
}

export async function getSessionAnalysis(userId: Types.ObjectId) {
  const activity = await UserActivityLog.find({ userId, timeSpentSeconds: { $gt: 0 } }).sort({ attemptedAt: -1 }).limit(120).lean();
  const sessions = activity.reduce<Record<string, typeof activity>>((acc, item) => {
    const key = new Date(item.attemptedAt).toISOString().slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return {
    sessions: Object.entries(sessions).slice(0, 14).map(([date, items]) => {
      const time = items.reduce((sum, item) => sum + (item.timeSpentSeconds || 0), 0);
      return {
        date,
        minutes: Math.round(time / 60),
        attempts: items.length,
        efficiency: Math.min(100, Math.round((items.filter((item) => item.isCorrect).length / Math.max(items.length, 1)) * 70 + Math.min(items.length * 3, 30))),
      };
    }),
  };
}

export async function getTimeDistribution(userId: Types.ObjectId) {
  const submissions = await getTimedSubmissions(userId);
  const buckets = [
    { label: "<1m", min: 0, max: 60 },
    { label: "1-2m", min: 61, max: 120 },
    { label: "2-4m", min: 121, max: 240 },
    { label: "4-8m", min: 241, max: 480 },
    { label: "8m+", min: 481, max: Infinity },
  ];

  return {
    distribution: buckets.map((bucket) => {
      const items = submissions.filter((item) => safeTime(item.timeTaken) >= bucket.min && safeTime(item.timeTaken) <= bucket.max);
      return {
        bucket: bucket.label,
        count: items.length,
        accuracy: pct(items.filter((item) => item.isCorrect).length, items.length),
      };
    }),
  };
}

export const timeAnalysisService = {
  getPacing,
  getSessionAnalysis,
  getTimeAnalysis,
  getTimeDistribution,
};
