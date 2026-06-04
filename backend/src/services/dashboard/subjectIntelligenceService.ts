import type { Types } from "mongoose";
import Question from "../../models/Question";
import Submission from "../../models/Submission";
import TheoryProgress from "../../models/TheoryProgress";
import UserActivityLog from "../../models/UserActivityLog";
import UserRevisionLog from "../../models/UserRevisionLog";
import { getDashboardCache, setDashboardCache } from "../../utils/dashboard/dashboardCache";

const GATE_DA_SUBJECTS = [
  "Probability & Statistics",
  "Linear Algebra",
  "Calculus & Optimization",
  "Machine Learning",
  "Artificial Intelligence",
  "DSA",
  "Programming",
];

const SUBJECT_ALIASES: Record<string, string[]> = {
  "Probability & Statistics": ["probability", "statistics", "stats", "random", "distribution"],
  "Linear Algebra": ["linear algebra", "matrix", "vector", "eigen", "rank"],
  "Calculus & Optimization": ["calculus", "optimization", "gradient", "convex", "derivative"],
  "Machine Learning": ["machine learning", "ml", "regression", "classification", "clustering"],
  "Artificial Intelligence": ["artificial intelligence", "ai", "search", "logic", "planning"],
  DSA: ["dsa", "data structures", "algorithms", "graph", "tree"],
  Programming: ["programming", "python", "code", "complexity"],
};

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeSubject(value?: string) {
  const text = (value || "").toLowerCase();
  const match = GATE_DA_SUBJECTS.find((subject) => {
    const aliases = [subject.toLowerCase(), ...(SUBJECT_ALIASES[subject] || [])];
    return aliases.some((alias) => text.includes(alias));
  });
  return match || value || "General";
}

function scoreFromParts(parts: number[]) {
  return Math.round(parts.reduce((sum, item) => sum + item, 0) / Math.max(parts.length, 1));
}

function daysSince(date?: Date) {
  if (!date) return 999;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000)));
}

async function getSubjectRows(userId: Types.ObjectId) {
  const [submissions, theory, revisions, activity] = await Promise.all([
    Submission.find({ userId }).populate("questionId", "subjectId chapterId topicId subtopicId topic difficulty").lean(),
    TheoryProgress.find({ userId }).lean(),
    UserRevisionLog.find({ userId }).lean(),
    UserActivityLog.find({ userId }).sort({ attemptedAt: -1 }).lean(),
  ]);

  return GATE_DA_SUBJECTS.map((subject) => {
    const subjectSubmissions = submissions.filter((submission) => {
      const question = submission.questionId as any;
      return normalizeSubject(submission.subjectId || question?.subjectId || question?.topic) === subject;
    });
    const subjectTheory = theory.filter((item) => normalizeSubject(item.subjectId) === subject);
    const subjectRevisions = revisions.filter((item) => {
      const text = `${item.topicId} ${item.revisionType}`;
      return normalizeSubject(text) === subject;
    });
    const subjectActivity = activity.filter((item) => normalizeSubject(`${item.subjectId} ${item.topicId} ${item.source}`) === subject);

    const attempted = subjectSubmissions.length;
    const correct = subjectSubmissions.filter((item) => item.isCorrect).length;
    const averageAccuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    const syllabusCompletion = subjectTheory.length
      ? Math.round(subjectTheory.reduce((sum, item) => sum + (item.progressPercent || 0), 0) / subjectTheory.length)
      : 0;
    const revisionFreshness = subjectRevisions.length
      ? Math.max(0, 100 - Math.min(100, daysSince(subjectRevisions.sort((a, b) => +new Date(b.revisedAt) - +new Date(a.revisedAt))[0]?.revisedAt) * 7))
      : 35;
    const learningConsistency = Math.min(100, subjectActivity.length * 9 + attempted * 2);
    const confidenceScore = scoreFromParts([averageAccuracy, syllabusCompletion, revisionFreshness]);
    const mastery = Math.round(averageAccuracy * 0.42 + syllabusCompletion * 0.28 + confidenceScore * 0.18 + learningConsistency * 0.12);

    const topics = new Map<string, { attempted: number; correct: number; progress: number; lastSeen?: Date }>();
    subjectSubmissions.forEach((submission) => {
      const question = submission.questionId as any;
      const topic = submission.topicId || question?.topicId || question?.topic || "General";
      const current = topics.get(topic) || { attempted: 0, correct: 0, progress: 0 };
      current.attempted++;
      if (submission.isCorrect) current.correct++;
      current.lastSeen = submission.createdAt;
      topics.set(topic, current);
    });
    subjectTheory.forEach((item) => {
      const current = topics.get(item.topicId) || { attempted: 0, correct: 0, progress: 0 };
      current.progress = Math.max(current.progress, item.progressPercent || 0);
      current.lastSeen = item.lastReadAt;
      topics.set(item.topicId, current);
    });

    return {
      id: slugify(subject),
      subject,
      mastery,
      syllabusCompletion,
      revisionStatus: revisionFreshness >= 70 ? "Fresh" : revisionFreshness >= 45 ? "Due soon" : "Revision due",
      revisionFreshness,
      confidenceScore,
      averageAccuracy,
      learningConsistency,
      recentActivity: subjectActivity.length + subjectSubmissions.filter((item) => daysSince(item.createdAt) <= 14).length,
      attempted,
      topics: Array.from(topics.entries()).map(([topic, value], index) => {
        const accuracy = value.attempted ? Math.round((value.correct / value.attempted) * 100) : 0;
        const decay = Math.min(100, daysSince(value.lastSeen) * 4);
        return {
          id: topic,
          topic,
          chapter: `Chapter ${Math.floor(index / 3) + 1}`,
          mastery: Math.round(accuracy * 0.52 + value.progress * 0.35 + Math.max(0, 100 - decay) * 0.13),
          completion: value.progress,
          accuracy,
          attempts: value.attempted,
          timeSpentMinutes: Math.max(12, value.attempted * 7),
          conceptDecay: decay,
          revisionFrequency: subjectRevisions.length,
          spacedRepetition: decay > 55 ? "Immediate review" : decay > 30 ? "Schedule this week" : "Healthy",
          weakness: accuracy < 55 || decay > 70,
          forecast: Math.min(100, Math.round(accuracy * 0.45 + value.progress * 0.35 + 18)),
        };
      }),
    };
  });
}

export async function getSubjectIntelligence(userId: Types.ObjectId) {
  const cacheKey = `dashboard:subjects:intelligence:${userId}`;
  const cached = getDashboardCache<unknown>(cacheKey);
  if (cached) return cached;

  const subjects = await getSubjectRows(userId);
  return setDashboardCache(cacheKey, {
    subjects,
    summary: {
      averageMastery: Math.round(subjects.reduce((sum, item) => sum + item.mastery, 0) / subjects.length),
      completedSubjects: subjects.filter((item) => item.syllabusCompletion >= 80).length,
      revisionDue: subjects.filter((item) => item.revisionStatus === "Revision due").length,
      highConfidence: subjects.filter((item) => item.confidenceScore >= 70).length,
    },
  });
}

export async function getSubjectDetailIntelligence(userId: Types.ObjectId, subjectId: string) {
  const all = await getSubjectIntelligence(userId) as any;
  const subject = all.subjects.find((item: any) => item.id === subjectId || slugify(item.subject) === subjectId || item.subject === subjectId);
  const resolved = subject || all.subjects[0];
  const questions = await Question.find({ subjectId: { $regex: resolved.subject, $options: "i" } }).select("chapterId topicId subtopicId").lean();
  const topics = resolved.topics.length ? resolved.topics : Array.from({ length: 8 }).map((_, index) => ({
    id: `topic-${index + 1}`,
    topic: `Topic ${index + 1}`,
    chapter: `Chapter ${Math.floor(index / 2) + 1}`,
    mastery: Math.max(22, 78 - index * 6),
    completion: Math.max(18, 70 - index * 5),
    accuracy: Math.max(20, 72 - index * 5),
    attempts: index + 2,
    timeSpentMinutes: 20 + index * 8,
    conceptDecay: index * 9,
    revisionFrequency: Math.max(0, 4 - index),
    spacedRepetition: index > 4 ? "Immediate review" : index > 2 ? "Schedule this week" : "Healthy",
    weakness: index > 4,
    forecast: Math.max(35, 82 - index * 4),
  }));

  const chapters = Array.from(new Map(topics.map((topic: any) => [topic.chapter, topic])).keys()).map((chapter) => {
    const chapterTopics = topics.filter((topic: any) => topic.chapter === chapter);
    return {
      chapter,
      mastery: Math.round(chapterTopics.reduce((sum: number, item: any) => sum + item.mastery, 0) / chapterTopics.length),
      completion: Math.round(chapterTopics.reduce((sum: number, item: any) => sum + item.completion, 0) / chapterTopics.length),
      topics: chapterTopics.length,
    };
  });

  return {
    subject: resolved,
    chapters,
    topics,
    dependencyGraph: topics.slice(0, 8).map((topic: any, index: number) => ({
      source: index === 0 ? "Foundations" : topics[index - 1].topic,
      target: topic.topic,
      strength: Math.max(20, 95 - index * 8),
    })),
    conceptCompletion: {
      totalTracked: questions.length || topics.length,
      completed: topics.filter((topic: any) => topic.completion >= 80).length,
      weak: topics.filter((topic: any) => topic.weakness).length,
    },
  };
}

export const subjectIntelligenceService = {
  getSubjectDetailIntelligence,
  getSubjectIntelligence,
};
