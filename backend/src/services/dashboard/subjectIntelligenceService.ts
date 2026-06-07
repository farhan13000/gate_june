import type { Types } from "mongoose";
import Chapter from "../../models/Chapter";
import Question from "../../models/Question";
import Subject from "../../models/Subject";
import Submission from "../../models/Submission";
import TheoryProgress from "../../models/TheoryProgress";
import Topic from "../../models/Topic";
import UserActivityLog from "../../models/UserActivityLog";
import UserRevisionLog from "../../models/UserRevisionLog";

type LeanQuestion = {
  _id?: Types.ObjectId;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  subtopicId?: string;
  topic?: string;
};

type SubmissionWithQuestion = {
  _id?: Types.ObjectId;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  subtopicId?: string;
  isCorrect?: boolean;
  timeTaken?: number;
  createdAt?: Date;
  questionId?: LeanQuestion;
};

type TopicMetric = {
  id: string;
  topic: string;
  chapter: string;
  mastery: number;
  completion: number;
  accuracy: number;
  attempts: number;
  timeSpentMinutes: number;
  conceptDecay: number;
  revisionFrequency: number;
  spacedRepetition: string;
  weakness: boolean;
  forecast: number;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : 0)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function daysSince(date?: Date) {
  if (!date) return 999;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000)));
}

function dateKey(date?: Date) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function latestDate(dates: Array<Date | undefined>) {
  const timestamps = dates.filter(Boolean).map((date) => new Date(date as Date).getTime());
  if (!timestamps.length) return undefined;
  return new Date(Math.max(...timestamps));
}

function revisionLabel(freshness: number) {
  if (freshness >= 70) return "Fresh";
  if (freshness >= 45) return "Due soon";
  return "Revision due";
}

function repetitionLabel(decay: number) {
  if (decay > 65) return "Immediate review";
  if (decay > 35) return "Schedule this week";
  return "Healthy";
}

function normalizeSubmission(submission: SubmissionWithQuestion) {
  const question = submission.questionId;
  return {
    ...submission,
    subjectId: submission.subjectId || question?.subjectId,
    chapterId: submission.chapterId || question?.chapterId,
    topicId: submission.topicId || question?.topicId || question?.topic,
    subtopicId: submission.subtopicId || question?.subtopicId,
    timeTaken: submission.timeTaken ?? 120,
    createdAt: submission.createdAt,
  };
}

function solvedQuestionRatio(submissions: SubmissionWithQuestion[], totalQuestions: number) {
  if (!totalQuestions) return 0;
  const solved = new Set(
    submissions
      .filter((submission) => submission.isCorrect && submission.questionId?._id)
      .map((submission) => String(submission.questionId?._id))
  );
  return clamp((solved.size / totalQuestions) * 100);
}

function activeStreak(dates: Date[]) {
  const activeDays = new Set(dates.map(dateKey).filter(Boolean));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

async function getSubjectRows(userId: Types.ObjectId) {
  const [subjects, chapters, topics, questions, submissions, theory, revisions, activity] = await Promise.all([
    Subject.find({ enabled: true }).sort({ order: 1, name: 1 }).lean(),
    Chapter.find({ enabled: true }).sort({ subjectId: 1, order: 1, name: 1 }).lean(),
    Topic.find({ enabled: true }).sort({ subjectId: 1, chapterId: 1, order: 1, name: 1 }).lean(),
    Question.find({ status: "approved" }).select("_id subjectId chapterId topicId subtopicId topic").lean(),
    Submission.find({ userId })
      .populate("questionId", "subjectId chapterId topicId subtopicId topic")
      .lean<SubmissionWithQuestion[]>(),
    TheoryProgress.find({ userId }).lean(),
    UserRevisionLog.find({ userId }).lean(),
    UserActivityLog.find({ userId }).sort({ attemptedAt: -1 }).lean(),
  ]);

  const normalizedSubmissions = submissions.map(normalizeSubmission);
  const chapterById = new Map(chapters.map((chapter) => [chapter.chapterId, chapter]));
  const topicsBySubject = new Map<string, typeof topics>();
  const questionsBySubject = new Map<string, typeof questions>();
  const questionsByTopic = new Map<string, typeof questions>();

  topics.forEach((topic) => {
    const items = topicsBySubject.get(topic.subjectId) || [];
    items.push(topic);
    topicsBySubject.set(topic.subjectId, items);
  });

  questions.forEach((question) => {
    const subjectItems = questionsBySubject.get(question.subjectId) || [];
    subjectItems.push(question);
    questionsBySubject.set(question.subjectId, subjectItems);

    if (question.topicId) {
      const topicItems = questionsByTopic.get(question.topicId) || [];
      topicItems.push(question);
      questionsByTopic.set(question.topicId, topicItems);
    }
  });

  return subjects.map((subject) => {
    const subjectId = subject.subjectId;
    const subjectTopics = topicsBySubject.get(subjectId) || [];
    const topicIds = new Set(subjectTopics.map((topic) => topic.topicId));
    const subjectQuestions = questionsBySubject.get(subjectId) || [];
    const subjectSubmissions = normalizedSubmissions.filter((submission) => submission.subjectId === subjectId);
    const subjectTheory = theory.filter((item) => item.subjectId === subjectId);
    const subjectRevisions = revisions.filter((item) => topicIds.has(item.topicId));
    const subjectActivity = activity.filter((item) => item.subjectId === subjectId || (item.topicId ? topicIds.has(item.topicId) : false));

    const attempted = subjectSubmissions.length;
    const correct = subjectSubmissions.filter((item) => item.isCorrect).length;
    const averageAccuracy = attempted ? clamp((correct / attempted) * 100) : 0;
    const theoryCompletion = subjectTheory.length ? average(subjectTheory.map((item) => item.progressPercent || 0)) : 0;
    const questionCompletion = solvedQuestionRatio(subjectSubmissions, subjectQuestions.length);
    const syllabusCompletion = theoryCompletion || questionCompletion;
    const lastRevision = latestDate(subjectRevisions.map((item) => item.revisedAt));
    const lastLearning = latestDate([
      ...subjectSubmissions.map((item) => item.createdAt),
      ...subjectTheory.map((item) => item.lastReadAt),
      ...subjectActivity.map((item) => item.attemptedAt),
    ]);
    const lastSeen = latestDate([lastRevision, lastLearning]);
    const revisionFreshness = lastSeen ? clamp(100 - daysSince(lastSeen) * 6) : 0;
    const activeDays = new Set(
      [
        ...subjectSubmissions.map((item) => item.createdAt),
        ...subjectTheory.map((item) => item.lastReadAt),
        ...subjectActivity.map((item) => item.attemptedAt),
      ]
        .filter((date): date is Date => Boolean(date) && daysSince(date) <= 30)
        .map(dateKey)
        .filter(Boolean)
    ).size;
    const learningConsistency = clamp((activeDays / 30) * 100);
    const confidenceScore = clamp(average([averageAccuracy, syllabusCompletion, revisionFreshness]));
    const mastery = clamp(averageAccuracy * 0.42 + syllabusCompletion * 0.3 + revisionFreshness * 0.16 + learningConsistency * 0.12);
    const timeSpentMinutes = Math.round(
      (subjectSubmissions.reduce((sum, item) => sum + (item.timeTaken || 0), 0) +
        subjectActivity.reduce((sum, item) => sum + (item.timeSpentSeconds || 0), 0)) /
        60
    );
    const activeStreakDays = activeStreak(
      [
        ...subjectSubmissions.map((item) => item.createdAt),
        ...subjectTheory.map((item) => item.lastReadAt),
        ...subjectActivity.map((item) => item.attemptedAt),
      ].filter((date): date is Date => Boolean(date))
    );

    const topicRows = subjectTopics.map<TopicMetric>((topic) => {
      const topicQuestions = questionsByTopic.get(topic.topicId) || [];
      const topicSubmissions = subjectSubmissions.filter((submission) => submission.topicId === topic.topicId);
      const topicTheory = subjectTheory.filter((item) => item.topicId === topic.topicId);
      const topicRevisions = revisions.filter((item) => item.topicId === topic.topicId);
      const topicActivity = subjectActivity.filter((item) => item.topicId === topic.topicId);
      const topicAttempts = topicSubmissions.length;
      const topicCorrect = topicSubmissions.filter((item) => item.isCorrect).length;
      const accuracy = topicAttempts ? clamp((topicCorrect / topicAttempts) * 100) : 0;
      const completion = topicTheory.length ? average(topicTheory.map((item) => item.progressPercent || 0)) : solvedQuestionRatio(topicSubmissions, topicQuestions.length);
      const topicLastSeen = latestDate([
        ...topicSubmissions.map((item) => item.createdAt),
        ...topicTheory.map((item) => item.lastReadAt),
        ...topicRevisions.map((item) => item.revisedAt),
        ...topicActivity.map((item) => item.attemptedAt),
      ]);
      const conceptDecay = topicLastSeen ? clamp(daysSince(topicLastSeen) * 4) : 100;
      const topicMastery = clamp(accuracy * 0.45 + completion * 0.38 + Math.max(0, 100 - conceptDecay) * 0.17);
      const chapter = chapterById.get(topic.chapterId);
      const topicTimeSpentMinutes = Math.round(
        (topicSubmissions.reduce((sum, item) => sum + (item.timeTaken || 0), 0) +
          topicActivity.reduce((sum, item) => sum + (item.timeSpentSeconds || 0), 0)) /
          60
      );

      return {
        id: topic.topicId,
        topic: topic.name,
        chapter: chapter?.name || topic.chapterId,
        mastery: topicMastery,
        completion,
        accuracy,
        attempts: topicAttempts,
        timeSpentMinutes: topicTimeSpentMinutes,
        conceptDecay,
        revisionFrequency: topicRevisions.length,
        spacedRepetition: repetitionLabel(conceptDecay),
        weakness: (topicAttempts > 0 && accuracy < 55) || conceptDecay > 70 || completion < 30,
        forecast: clamp(topicMastery + (topicRevisions.length ? 8 : 0) - Math.min(18, Math.floor(conceptDecay / 6))),
      };
    });

    return {
      id: subject.subjectId || slugify(subject.name),
      subject: subject.name,
      subjectId,
      mastery,
      syllabusCompletion,
      revisionStatus: revisionLabel(revisionFreshness),
      revisionFreshness,
      confidenceScore,
      averageAccuracy,
      learningConsistency,
      recentActivity: subjectActivity.length + subjectSubmissions.filter((item) => item.createdAt && daysSince(item.createdAt) <= 14).length,
      attempted,
      timeSpentMinutes,
      activeStreakDays,
      topics: topicRows,
    };
  });
}

export async function getSubjectIntelligence(userId: Types.ObjectId) {
  const subjects = await getSubjectRows(userId);
  const divisor = Math.max(subjects.length, 1);

  return {
    subjects,
    summary: {
      averageMastery: Math.round(subjects.reduce((sum, item) => sum + item.mastery, 0) / divisor),
      completedSubjects: subjects.filter((item) => item.syllabusCompletion >= 80).length,
      revisionDue: subjects.filter((item) => item.revisionStatus === "Revision due").length,
      highConfidence: subjects.filter((item) => item.confidenceScore >= 70).length,
    },
  };
}

export async function getSubjectDetailIntelligence(userId: Types.ObjectId, subjectId: string) {
  const all = (await getSubjectIntelligence(userId)) as any;
  const resolved =
    all.subjects.find((item: any) => item.id === subjectId || item.subjectId === subjectId || slugify(item.subject) === subjectId || item.subject === subjectId) ||
    all.subjects[0];

  if (!resolved) {
    return {
      subject: null,
      chapters: [],
      topics: [],
      dependencyGraph: [],
      conceptCompletion: { totalTracked: 0, completed: 0, weak: 0 },
    };
  }

  const topics = resolved.topics || [];
  const chapters = Array.from(new Map(topics.map((topic: TopicMetric) => [topic.chapter, topic])).keys()).map((chapter) => {
    const chapterTopics = topics.filter((topic: TopicMetric) => topic.chapter === chapter);
    return {
      chapter,
      mastery: average(chapterTopics.map((item: TopicMetric) => item.mastery)),
      completion: average(chapterTopics.map((item: TopicMetric) => item.completion)),
      topics: chapterTopics.length,
    };
  });

  return {
    subject: resolved,
    chapters,
    topics,
    dependencyGraph: topics.slice(1).map((topic: TopicMetric, index: number) => ({
      source: topics[index].topic,
      target: topic.topic,
      strength: clamp(90 - index * 5, 20, 95),
    })),
    conceptCompletion: {
      totalTracked: topics.length,
      completed: topics.filter((topic: TopicMetric) => topic.completion >= 80).length,
      weak: topics.filter((topic: TopicMetric) => topic.weakness).length,
    },
  };
}

export const subjectIntelligenceService = {
  getSubjectDetailIntelligence,
  getSubjectIntelligence,
};
