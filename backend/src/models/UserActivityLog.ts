import mongoose, { Schema, Document } from "mongoose";

export interface IUserActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  activityType: "problem_solved" | "test_attempted" | "theory_read" | "topic_completed" | "contest_participated";
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  subtopicId?: string;
  questionId?: mongoose.Types.ObjectId;
  testId?: mongoose.Types.ObjectId;
  contestId?: mongoose.Types.ObjectId;
  difficulty?: "Easy" | "Medium" | "Hard";
  questionType?: "MCQ" | "MSQ" | "NAT";
  isCorrect?: boolean;
  selectedOption?: string;
  correctOption?: string;
  timeSpentSeconds?: number;
  marksAwarded?: number;
  negativeMarks?: number;
  attemptedAt: Date;
  source?: string;
}

const userActivityLogSchema = new Schema<IUserActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    activityType: { type: String, required: true, index: true },
    subjectId: { type: String },
    chapterId: { type: String },
    topicId: { type: String },
    subtopicId: { type: String },
    questionId: { type: Schema.Types.ObjectId, ref: "Question" },
    testId: { type: Schema.Types.ObjectId },
    contestId: { type: Schema.Types.ObjectId, ref: "Contest" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    questionType: { type: String, enum: ["MCQ", "MSQ", "NAT"] },
    isCorrect: { type: Boolean },
    selectedOption: { type: String },
    correctOption: { type: String },
    timeSpentSeconds: { type: Number },
    marksAwarded: { type: Number },
    negativeMarks: { type: Number },
    attemptedAt: { type: Date, default: Date.now, index: true },
    source: { type: String },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for analytics queries
userActivityLogSchema.index({ userId: 1, activityType: 1 });
userActivityLogSchema.index({ userId: 1, subjectId: 1 });

export default mongoose.model<IUserActivityLog>("UserActivityLog", userActivityLogSchema);
