import mongoose from "mongoose";
import Question from "../../../backend/src/models/Question";

let qSeq = 0;

type QuestionOverrides = Partial<{
  questionType: "MCQ" | "MSQ" | "NAT";
  status: "draft" | "pending_review" | "approved" | "rejected";
  markingScheme: { positive: number; negative: number };
  options: Array<{ text: string; isCorrect: boolean }>;
  solution: any;
  createdBy: any;
  title: string;
}>;

export async function createApprovedQuestion(overrides: QuestionOverrides = {}) {
  qSeq += 1;
  const actorId = overrides.createdBy || new mongoose.Types.ObjectId();
  return Question.create({
    title: overrides.title || `Contest question ${qSeq}`,
    topic: "Probability",
    difficulty: "Medium",
    statement: "Solve this contest problem.",
    questionType: overrides.questionType || "MCQ",
    options: overrides.options ?? [
      { text: "Correct", isCorrect: true },
      { text: "Wrong", isCorrect: false },
      { text: "Wrong 2", isCorrect: false },
      { text: "Wrong 3", isCorrect: false },
    ],
    solution: overrides.solution ?? { finalAnswer: "Correct", overview: "Official solution" },
    markingScheme: overrides.markingScheme ?? { positive: 2, negative: 0.66 },
    tags: ["contest-test"],
    status: overrides.status || "approved",
    subjectId: "SUBJECT_TEST",
    chapterId: "CHAPTER_TEST",
    topicId: "TOPIC_TEST",
    subtopicId: "SUBTOPIC_TEST",
    createdBy: actorId,
    approvedBy: actorId,
    auditLog: [{ action: "Created", performedBy: actorId }],
  });
}

export const createMCQQuestion = (overrides: QuestionOverrides = {}) =>
  createApprovedQuestion({ ...overrides, questionType: "MCQ" });

export const createMSQQuestion = (overrides: QuestionOverrides = {}) =>
  createApprovedQuestion({
    ...overrides,
    questionType: "MSQ",
    options: overrides.options ?? [
      { text: "A", isCorrect: true },
      { text: "B", isCorrect: true },
      { text: "C", isCorrect: false },
      { text: "D", isCorrect: false },
    ],
  });

export const createNATQuestion = (overrides: QuestionOverrides = {}) =>
  createApprovedQuestion({
    ...overrides,
    questionType: "NAT",
    options: [],
    solution: overrides.solution ?? { finalAnswer: "3.1416" },
  });

export const createNegativeMarkingQuestion = (overrides: QuestionOverrides = {}) =>
  createMCQQuestion({ ...overrides, markingScheme: { positive: 2, negative: 0.66 } });

export const createUnapprovedQuestion = (overrides: QuestionOverrides = {}) =>
  createApprovedQuestion({ ...overrides, status: "pending_review" });
