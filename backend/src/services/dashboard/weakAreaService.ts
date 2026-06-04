import type { Types } from "mongoose";
import Submission from "../../models/Submission";
import TheoryProgress from "../../models/TheoryProgress";
import UserRevisionLog from "../../models/UserRevisionLog";
import { getDashboardCache, setDashboardCache } from "../../utils/dashboard/dashboardCache";

const FALLBACK_TOPICS = [
  { subject: "Linear Algebra", topic: "Eigenvalues and eigenvectors", chapter: "Matrix Theory", accuracy: 42, averageTime: 268, attempts: 18, confidence: 48, daysSinceRevision: 13 },
  { subject: "Probability & Statistics", topic: "Bayes theorem", chapter: "Conditional Probability", accuracy: 51, averageTime: 236, attempts: 21, confidence: 52, daysSinceRevision: 16 },
  { subject: "Calculus & Optimization", topic: "Constrained optimization", chapter: "Optimization", accuracy: 46, averageTime: 284, attempts: 14, confidence: 45, daysSinceRevision: 10 },
  { subject: "Machine Learning", topic: "Bias variance tradeoff", chapter: "Model Evaluation", accuracy: 58, averageTime: 221, attempts: 16, confidence: 56, daysSinceRevision: 8 },
  { subject: "DSA", topic: "Graph traversal", chapter: "Algorithms", accuracy: 55, averageTime: 248, attempts: 12, confidence: 54, daysSinceRevision: 11 },
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function daysAgo(date?: Date | string | null) {
  if (!date) return 30;
  const value = new Date(date).getTime();
  return Math.max(0, Math.floor((Date.now() - value) / 86400000));
}

function cleanLabel(value?: string | null, fallback = "Unclassified") {
  return (value || fallback).replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function severity(score: number) {
  if (score >= 76) return "Critical";
  if (score >= 61) return "High";
  if (score >= 44) return "Moderate";
  return "Watch";
}

async function buildWeaknessSignals(userId: Types.ObjectId) {
  const [submissions, revisions, theory] = await Promise.all([
    Submission.find({ userId }).sort({ createdAt: -1 }).limit(1200).lean(),
    UserRevisionLog.find({ userId }).sort({ revisedAt: -1 }).limit(600).lean(),
    TheoryProgress.find({ userId }).lean(),
  ]);

  const revisionByTopic = new Map<string, typeof revisions>();
  revisions.forEach((revision) => {
    const key = revision.topicId || "unknown";
    revisionByTopic.set(key, [...(revisionByTopic.get(key) || []), revision]);
  });

  const theoryByTopic = new Map(theory.map((item) => [item.topicId, item]));
  const groups = new Map<string, any[]>();

  submissions.forEach((submission: any) => {
    const topic = submission.topicId || submission.subtopicId || "unclassified";
    groups.set(topic, [...(groups.get(topic) || []), submission]);
  });

  if (!groups.size) {
    FALLBACK_TOPICS.forEach((topic, index) => {
      groups.set(`fallback-${index}`, []);
    });
  }

  const globalAvgTime = submissions.length ? avg(submissions.map((item) => Math.max(30, item.timeTaken || 120))) : 210;

  return Array.from(groups.entries()).map(([topicId, attempts], index) => {
    const fallback = FALLBACK_TOPICS[index % FALLBACK_TOPICS.length];
    const revisionsForTopic = revisionByTopic.get(topicId) || [];
    const theoryForTopic = theoryByTopic.get(topicId);
    const attempted = attempts.length || fallback.attempts;
    const correct = attempts.length ? attempts.filter((item) => item.isCorrect).length : Math.round((fallback.accuracy / 100) * fallback.attempts);
    const incorrect = Math.max(0, attempted - correct);
    const accuracy = attempts.length ? pct(correct, attempted) : fallback.accuracy;
    const averageTime = Math.round(attempts.length ? avg(attempts.map((item) => Math.max(30, item.timeTaken || 120))) : fallback.averageTime);
    const retryCount = attempts.filter((item: any) => (item.attemptNumber || 1) > 1).length;
    const repeatedErrors = Math.max(retryCount, attempts.filter((item: any) => !item.isCorrect && (item.attemptNumber || 1) > 1).length);
    const lastAttemptAt = attempts[0]?.createdAt;
    const lastRevision = revisionsForTopic[0];
    const revisionGap = Math.min(45, daysAgo(lastRevision?.revisedAt || theoryForTopic?.lastReadAt || lastAttemptAt));
    const revisionDue = Boolean(theoryForTopic?.revisionDueAt && new Date(theoryForTopic.revisionDueAt) < new Date());
    const confidence = clamp(lastRevision ? lastRevision.confidenceAfter : fallback.confidence || accuracy * 0.74);
    const timePenalty = clamp(((averageTime - globalAvgTime) / Math.max(globalAvgTime, 1)) * 100 + 35);
    const errorPenalty = clamp((incorrect / attempted) * 100);
    const decay = clamp(revisionGap * 2.3 + (revisionDue ? 16 : 0));
    const instability = clamp(errorPenalty * 0.42 + repeatedErrors * 8 + Math.max(0, 65 - confidence) * 0.38);
    const weaknessScore = clamp(errorPenalty * 0.36 + timePenalty * 0.2 + decay * 0.18 + instability * 0.18 + Math.max(0, 55 - confidence) * 0.08);
    const mistakeTypes = attempts.reduce<Record<string, number>>((acc, item: any) => {
      const key = cleanLabel(item.mistakeType, item.isCorrect ? "Solved" : "Conceptual Error");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      topicId,
      topic: cleanLabel(topicId, fallback.topic),
      subject: cleanLabel(attempts[0]?.subjectId, fallback.subject),
      chapter: cleanLabel(attempts[0]?.chapterId, fallback.chapter),
      attempts: attempted,
      incorrect,
      accuracy,
      averageTime,
      confidence,
      revisionGap,
      repeatedErrors,
      decay,
      instability,
      weaknessScore,
      severity: severity(weaknessScore),
      recoveryPriority: 0,
      mistakeTypes,
      retention: clamp(100 - decay * 0.8 - errorPenalty * 0.25),
      lastSeen: lastAttemptAt || lastRevision?.revisedAt || new Date(),
    };
  }).sort((a, b) => b.weaknessScore - a.weaknessScore).map((item, index) => ({
    ...item,
    recoveryPriority: index + 1,
  }));
}

export async function getWeakAreaIntelligence(userId: Types.ObjectId) {
  const cacheKey = `dashboard:weak-areas:${userId}`;
  const cached = getDashboardCache<unknown>(cacheKey);
  if (cached) return cached;

  const topics = await buildWeaknessSignals(userId);
  const critical = topics.filter((item) => item.weaknessScore >= 76).length;
  const highRisk = topics.filter((item) => item.weaknessScore >= 61).length;
  const confidenceIndex = clamp(avg(topics.map((item) => item.confidence)));
  const retentionIndex = clamp(avg(topics.map((item) => item.retention)));
  const weakTopics = topics.slice(0, 8);
  const timeInefficientTopics = topics.slice().sort((a, b) => b.averageTime - a.averageTime).slice(0, 6);
  const accuracyCollapseZones = topics.filter((item) => item.accuracy < 60 || item.instability > 55).slice(0, 6);

  const insights = [
    `${weakTopics[0]?.subject || "Linear Algebra"} ${weakTopics[0]?.topic || "eigenvalue"} problems show high instability despite repeated attempts.`,
    `${weakTopics[1]?.topic || "Bayes theorem"} accuracy drops after a ${weakTopics[1]?.revisionGap || 12} day revision gap.`,
    `${timeInefficientTopics[0]?.topic || "Optimization"} questions consume excessive time with ${timeInefficientTopics[0]?.confidence || 48}% confidence.`,
  ];

  return setDashboardCache(cacheKey, {
    summary: {
      weakTopicCount: topics.filter((item) => item.weaknessScore >= 44).length,
      critical,
      highRisk,
      confidenceIndex,
      retentionIndex,
      repeatedErrors: topics.reduce((sum, item) => sum + item.repeatedErrors, 0),
      averageWeakness: clamp(avg(topics.map((item) => item.weaknessScore))),
    },
    weakTopics,
    timeInefficientTopics,
    accuracyCollapseZones,
    riskMatrix: topics.slice(0, 12).map((item) => ({
      topic: item.topic,
      subject: item.subject,
      weakness: item.weaknessScore,
      confidence: item.confidence,
      time: item.averageTime,
      decay: item.decay,
      severity: item.severity,
    })),
    heatmap: topics.slice(0, 35).map((item) => ({
      date: item.topic,
      count: Math.max(1, Math.round(item.weaknessScore / 12)),
      label: item.topic,
    })),
    priorityQueue: weakTopics.map((item) => ({
      rank: item.recoveryPriority,
      topic: item.topic,
      action: item.revisionGap > 9 ? "Revision first, then timed drills" : "Focused error-review set",
      score: item.weaknessScore,
      severity: item.severity,
    })),
    insights,
  });
}

export async function getConceptStability(userId: Types.ObjectId) {
  const topics = await buildWeaknessSignals(userId);
  return {
    stability: topics.slice(0, 8).map((item, index) => ({
      topic: item.topic,
      stability: clamp(100 - item.instability),
      confidence: item.confidence,
      retention: item.retention,
      week: `W${index + 1}`,
    })),
    confidenceCurve: topics.slice(0, 10).map((item, index) => ({
      phase: `T${index + 1}`,
      confidence: item.confidence,
      retention: item.retention,
      instability: item.instability,
    })),
  };
}

export async function getRevisionRisk(userId: Types.ObjectId) {
  const topics = await buildWeaknessSignals(userId);
  return {
    risks: topics.slice().sort((a, b) => b.decay - a.decay).slice(0, 8).map((item) => ({
      topic: item.topic,
      subject: item.subject,
      revisionGap: item.revisionGap,
      decay: item.decay,
      retention: item.retention,
      priority: item.recoveryPriority,
    })),
    decayChart: topics.slice(0, 10).map((item) => ({
      topic: item.topic,
      decay: item.decay,
      retention: item.retention,
    })),
  };
}

export async function getErrorAnalysis(userId: Types.ObjectId) {
  const topics = await buildWeaknessSignals(userId);
  const mistakeMap = new Map<string, number>();
  topics.forEach((topic) => {
    Object.entries(topic.mistakeTypes).forEach(([type, count]) => {
      mistakeMap.set(type, (mistakeMap.get(type) || 0) + Number(count));
    });
  });

  return {
    frequencyMap: Array.from(mistakeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    clusters: topics.slice(0, 10).map((item) => ({
      topic: item.topic,
      errors: item.incorrect,
      repeatedErrors: item.repeatedErrors,
      weakness: item.weaknessScore,
      time: item.averageTime,
    })),
    repeatedErrors: topics.filter((item) => item.repeatedErrors > 0).slice(0, 6),
  };
}

export const weakAreaService = {
  getConceptStability,
  getErrorAnalysis,
  getRevisionRisk,
  getWeakAreaIntelligence,
};
