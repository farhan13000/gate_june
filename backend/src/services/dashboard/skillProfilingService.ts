import type { Types } from "mongoose";
import ContestStanding from "../../models/ContestStanding";
import RatingHistory from "../../models/RatingHistory";
import Submission from "../../models/Submission";
import TheoryProgress from "../../models/TheoryProgress";
import User from "../../models/User";
import UserActivityLog from "../../models/UserActivityLog";
import UserRevisionLog from "../../models/UserRevisionLog";

const SKILLS = [
  "Problem Solving Speed",
  "Accuracy",
  "Mathematical Reasoning",
  "ML Aptitude",
  "DSA Ability",
  "Consistency",
  "Contest Handling",
  "Revision Discipline",
  "Conceptual Stability",
];

type SkillScore = { skill: string; score: number };

type BaseSignals = {
  attempts: number;
  accuracy: number;
  speed: number;
  hardAccuracy: number;
  mlAptitude: number;
  dsaAbility: number;
  consistency: number;
  contestHandling: number;
  revisionDiscipline: number;
  conceptualStability: number;
  ratingDelta: number;
  recentTrend: number;
  activeDays: number;
  activity: Array<{ attemptedAt?: Date; createdAt?: Date }>;
  submissions: any[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentileRank(value: number, values: number[]) {
  return values.length ? pct(values.filter((item) => item <= value).length, values.length) : 0;
}

function subjectMatch(text: string, tokens: string[]) {
  const normalized = text.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function submissionQuestion(submission: any) {
  return submission.questionId && typeof submission.questionId === "object" ? submission.questionId : {};
}

function submissionSubjectText(submission: any) {
  const question = submissionQuestion(submission);
  return `${submission.subjectId || question.subjectId || ""} ${question.topic || ""}`;
}

function accuracyFor(submissions: any[]) {
  return pct(submissions.filter((item) => item.isCorrect).length, submissions.length);
}

function speedFor(submissions: any[]) {
  if (!submissions.length) return 0;
  const avgTime = avg(submissions.map((item) => Math.max(1, item.timeTaken || 120)));
  return clamp(100 - avgTime / 4);
}

function contestHandlingFor(contests: any[]) {
  if (!contests.length) return 0;

  return clamp(avg(contests.map((standing) => {
    const rankSignal = standing.rank ? Math.max(0, 100 - (standing.rank - 1) * 4) : 45;
    const scoreSignal = Math.min(100, Math.max(0, (standing.score || standing.visibleScore || 0) * 2));
    const solvedSignal = Math.min(100, (standing.solvedCount || 0) * 18);
    const penaltySignal = Math.max(0, 100 - (standing.penaltyMinutes || 0));
    return rankSignal * 0.35 + scoreSignal * 0.25 + solvedSignal * 0.25 + penaltySignal * 0.15;
  })));
}

function revisionDisciplineFor(revisions: any[], theory: any[]) {
  if (!revisions.length && !theory.length) return 0;
  const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRevisionCount = revisions.filter((item) => new Date(item.createdAt || item.updatedAt || 0).getTime() >= recentCutoff).length;
  const theoryProgress = avg(theory.map((item) => item.progressPercent || 0));
  const notOverdue = theory.filter((item) => item.revisionDueAt && item.revisionDueAt > new Date()).length;

  return clamp(recentRevisionCount * 8 + theoryProgress * 0.45 + notOverdue * 6);
}

function conceptualStabilityFor(theory: any[], accuracy: number, hardAccuracy: number) {
  if (theory.length) {
    return clamp(avg(theory.map((item) => item.progressPercent || 0)) * 0.55 + accuracy * 0.45);
  }

  return clamp(accuracy * 0.65 + hardAccuracy * 0.35);
}

function recentTrendFor(submissions: any[]) {
  const now = Date.now();
  const recentCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const previousCutoff = now - 60 * 24 * 60 * 60 * 1000;
  const recent = submissions.filter((item) => new Date(item.createdAt).getTime() >= recentCutoff);
  const previous = submissions.filter((item) => {
    const time = new Date(item.createdAt).getTime();
    return time >= previousCutoff && time < recentCutoff;
  });

  if (!recent.length || !previous.length) return 0;
  return accuracyFor(recent) - accuracyFor(previous);
}

async function baseSignals(userId: Types.ObjectId): Promise<BaseSignals> {
  const [submissions, contests, revisions, theory, activity, ratings] = await Promise.all([
    Submission.find({ userId }).populate("questionId", "topic subjectId difficulty questionType").lean(),
    ContestStanding.find({ userId, disqualified: false }).lean(),
    UserRevisionLog.find({ userId }).lean(),
    TheoryProgress.find({ userId }).lean(),
    UserActivityLog.find({ userId }).lean(),
    RatingHistory.find({ userId }).sort({ appliedAt: 1 }).lean(),
  ]);

  const attempts = submissions.length;
  const accuracy = accuracyFor(submissions);
  const speed = speedFor(submissions);
  const hardAttempts = submissions.filter((item: any) => {
    const question = submissionQuestion(item);
    return item.difficulty === "Hard" || question.difficulty === "Hard";
  });
  const hardAccuracy = accuracyFor(hardAttempts);
  const mlAttempts = submissions.filter((item: any) =>
    subjectMatch(submissionSubjectText(item), ["machine", "learning", "regression", "classification", "ml"])
  );
  const dsaAttempts = submissions.filter((item: any) =>
    subjectMatch(submissionSubjectText(item), ["dsa", "algorithm", "data structure", "graph", "tree"])
  );
  const activeDayKeys = new Set<string>();
  submissions.forEach((item: any) => activeDayKeys.add(new Date(item.createdAt).toISOString().slice(0, 10)));
  activity.forEach((item: any) => activeDayKeys.add(new Date(item.attemptedAt || item.createdAt).toISOString().slice(0, 10)));
  const activeDays = activeDayKeys.size;
  const consistency = clamp(activeDays * 7 + attempts * 0.35);
  const contestHandling = contestHandlingFor(contests);
  const revisionDiscipline = revisionDisciplineFor(revisions, theory);
  const conceptualStability = conceptualStabilityFor(theory, accuracy, hardAccuracy);
  const ratingDelta = ratings.length ? ratings[ratings.length - 1].newRating - ratings[0].oldRating : 0;

  return {
    attempts,
    accuracy,
    speed,
    hardAccuracy,
    mlAptitude: accuracyFor(mlAttempts),
    dsaAbility: accuracyFor(dsaAttempts),
    consistency,
    contestHandling,
    revisionDiscipline,
    conceptualStability,
    ratingDelta,
    recentTrend: recentTrendFor(submissions),
    activeDays,
    activity,
    submissions,
  };
}

function buildSkillScores(signals: BaseSignals): SkillScore[] {
  const scores = [
    signals.speed,
    signals.accuracy,
    signals.hardAccuracy,
    signals.mlAptitude,
    signals.dsaAbility,
    signals.consistency,
    signals.contestHandling,
    signals.revisionDiscipline,
    signals.conceptualStability,
  ];

  return SKILLS.map((skill, index) => ({ skill, score: clamp(scores[index]) }));
}

function profileScore(skills: SkillScore[]) {
  return clamp(avg(skills.map((item) => item.score)));
}

async function allStudentProfiles() {
  const users = await User.find({ role: "student" }).select("_id").lean();
  return Promise.all(users.map(async (user) => {
    const signals = await baseSignals(user._id as Types.ObjectId);
    const skills = buildSkillScores(signals);
    return {
      userId: String(user._id),
      skills,
      profileScore: profileScore(skills),
      contestHandling: skills.find((item) => item.skill === "Contest Handling")?.score || 0,
      signals,
    };
  }));
}

function topAverage(values: number[], fraction = 0.25) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => b - a);
  const take = Math.max(1, Math.ceil(sorted.length * fraction));
  return clamp(avg(sorted.slice(0, take)));
}

export async function getSkillProfile(userId: Types.ObjectId) {
  const [signals, peerProfiles] = await Promise.all([baseSignals(userId), allStudentProfiles()]);
  const scoreRows = buildSkillScores(signals);

  const skills = scoreRows.map((row) => {
    const distribution = peerProfiles.map((profile) => profile.skills.find((item) => item.skill === row.skill)?.score || 0);
    const peerAverage = clamp(avg(distribution));
    const topPerformer = distribution.length ? Math.max(...distribution) : row.score;
    const trendLift = signals.recentTrend * 0.18;
    const consistencyLift = signals.consistency > 0 ? Math.min(6, signals.consistency / 18) : 0;
    const adaptiveWeight = clamp((topPerformer - row.score) * 0.45 + (100 - percentileRank(row.score, distribution)) * 0.35 + signals.attempts * 0.08);

    return {
      skill: row.skill,
      score: row.score,
      percentile: percentileRank(row.score, distribution),
      peerAverage,
      topPerformer,
      adaptiveWeight,
      forecast: signals.attempts ? clamp(row.score + trendLift + consistencyLift) : row.score,
    };
  });

  return {
    skills,
    summary: {
      profileScore: profileScore(skills),
      strongestSkill: skills.slice().sort((a, b) => b.score - a.score)[0],
      prioritySkill: skills.slice().sort((a, b) => a.score - b.score)[0],
      ratingDelta: signals.ratingDelta,
      attempts: signals.attempts,
    },
    matrices: skills.map((item) => ({
      label: item.skill,
      score: item.score,
      percentile: item.percentile,
      weight: item.adaptiveWeight,
    })),
  };
}

export async function getPeerComparison(userId: Types.ObjectId) {
  const [profile, peerProfiles, current] = await Promise.all([
    getSkillProfile(userId),
    allStudentProfiles(),
    User.findById(userId).select("rating").lean(),
  ]);
  const ratings = (await User.find({ role: "student" }).select("rating").lean())
    .map((item) => item.rating || 0)
    .sort((a, b) => a - b);
  const rating = current?.rating || 0;
  const profileScores = peerProfiles.map((item) => item.profileScore);
  const contestScores = peerProfiles.map((item) => item.contestHandling);

  return {
    percentile: ratings.length ? percentileRank(rating, ratings) : percentileRank(profile.summary.profileScore, profileScores),
    cohorts: [
      { cohort: "You", value: profile.summary.profileScore },
      { cohort: "Peer Group", value: clamp(avg(profileScores)) },
      { cohort: "Subject Toppers", value: topAverage(profileScores, 0.25) },
      { cohort: "Contest Leaders", value: topAverage(contestScores, 0.25) },
      { cohort: "Top Performers", value: topAverage(profileScores, 0.1) },
    ],
    overlays: profile.skills.map((item: any) => ({
      skill: item.skill,
      you: item.score,
      peer: item.peerAverage,
      top: item.topPerformer,
    })),
  };
}

export async function getSkillProgress(userId: Types.ObjectId) {
  const [submissions, contests] = await Promise.all([
    Submission.find({ userId }).populate("questionId", "difficulty").sort({ createdAt: 1 }).lean(),
    ContestStanding.find({ userId, disqualified: false }).sort({ updatedAt: 1 }).lean(),
  ]);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const timeline = Array.from({ length: 8 }).map((_, index) => {
    const start = new Date(today);
    start.setDate(today.getDate() - (7 - index) * 7 - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const weeklySubmissions = submissions.filter((item: any) => {
      const created = new Date(item.createdAt).getTime();
      return created >= start.getTime() && created <= end.getTime();
    });
    const weeklyContests = contests.filter((item: any) => {
      const updated = new Date(item.updatedAt || item.createdAt).getTime();
      return updated >= start.getTime() && updated <= end.getTime();
    });
    const weeklyHard = weeklySubmissions.filter((item: any) => {
      const question = submissionQuestion(item);
      return item.difficulty === "Hard" || question.difficulty === "Hard";
    });
    const weeklyScores = [
      speedFor(weeklySubmissions),
      accuracyFor(weeklySubmissions),
      accuracyFor(weeklyHard),
    ];
    const activeDays = new Set(weeklySubmissions.map((item: any) => new Date(item.createdAt).toISOString().slice(0, 10))).size;

    return {
      phase: `${start.getMonth() + 1}/${start.getDate()}`,
      profileScore: weeklySubmissions.length ? clamp(avg(weeklyScores)) : 0,
      consistency: clamp((activeDays / 7) * 100),
      contestHandling: contestHandlingFor(weeklyContests),
    };
  });

  return { timeline };
}

export async function getConsistencyProfile(userId: Types.ObjectId) {
  const [activity, submissions] = await Promise.all([
    UserActivityLog.find({ userId }).lean(),
    Submission.find({ userId }).select("createdAt").lean(),
  ]);
  const byDay = new Map<string, number>();
  activity.forEach((item: any) => {
    const key = new Date(item.attemptedAt || item.createdAt).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });
  submissions.forEach((item: any) => {
    const key = new Date(item.createdAt).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });
  const days = Array.from({ length: 28 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: byDay.get(key) || 0 };
  });
  const activeDays = days.filter((item) => item.count > 0).length;
  const attempts = days.reduce((sum, item) => sum + item.count, 0);

  return {
    consistencyScore: clamp(activeDays * 7 + attempts * 0.35),
    activeDays,
    heatmap: days,
  };
}

export const skillProfilingService = {
  getConsistencyProfile,
  getPeerComparison,
  getSkillProfile,
  getSkillProgress,
};
