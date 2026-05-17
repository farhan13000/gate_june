/**
 * Core domain types for the GATE DA platform.
 * Designed to be multi-domain scalable (DA, Maths, Physics, etc.)
 */

export type QuestionType = "MCQ" | "MSQ" | "NAT";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type Domain = "GATE_DA" | "GATE_CS" | "GATE_MA" | "GATE_PH" | string;

export interface MCQOption {
  id: string;      // 'A' | 'B' | 'C' | 'D'
  latex: string;   // LaTeX string for the option text
}

export interface Problem {
  _id: string;
  problemId: string;       // e.g. "DA007"
  domain: Domain;
  subject: string;         // e.g. "Statistics"
  chapter: string;         // e.g. "Hypothesis Testing"
  tags: string[];

  title: string;
  questionType: QuestionType;
  difficulty: Difficulty;

  /** Full problem statement as LaTeX string */
  statementLatex: string;

  /** For MCQ/MSQ — list of 4 options */
  options?: MCQOption[];

  /** Correct answer:
   *  - NAT: number or range string e.g. "0.2266" or "0.22:0.23"
   *  - MCQ: option id e.g. "A"
   *  - MSQ: comma-separated ids e.g. "A,C"
   */
  correctAnswer: string;

  /** Marks for correct answer (default 2 for NAT/MSQ, 1 for MCQ) */
  positiveMarks: number;
  /** Marks deducted for wrong answer (negative, default -0.67) */
  negativeMarks: number;

  /** Step-by-step editorial as LaTeX */
  editorialLatex?: string;

  solveCount: number;
  yearAsked?: number;      // e.g. 2023 — GATE year
  source?: string;         // e.g. "GATE 2023 Official"

  createdBy: string;       // admin user id
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  userId: string;
  problemId: string;
  answer: string;
  isCorrect: boolean;
  questionType: QuestionType;
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface UserProfile {
  id: string;              // MongoDB _id
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  institution?: string;
  graduationYear?: number;
  targetGateYear?: number;
  domains: Domain[];       // which exams the user is preparing for
  role: "student" | "admin";
  rating: number;
  authProvider: "local" | "google";
  createdAt: string;
  updatedAt: string;
}

export interface Contest {
  _id: string;
  title: string;
  domain: Domain;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  problemIds: string[];
  isRated: boolean;
  registeredUsers: string[];
  createdBy: string;
  createdAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  domain: Domain;
  chapters: Chapter[];
  order: number;
}

export interface Chapter {
  _id: string;
  name: string;
  subjectId: string;
  recommendedFormats: QuestionType[];
  order: number;
}
