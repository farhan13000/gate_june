import mongoose, { Schema, Document } from "mongoose";

export interface IContestClaim extends Document {
  contestId: mongoose.Types.ObjectId;
  questionId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "answer_key" | "ambiguous_question" | "marking" | "technical" | "other";
  status: "open" | "under_review" | "accepted" | "rejected" | "resolved";
  title: string;
  description: string;
  adminResponse?: string;
  contestLifecycleAtCreate?: string;
  questionSnapshot?: {
    title?: string;
    contentId?: string;
    problemId?: string;
    questionType?: string;
  };
  userAnswerSnapshot?: {
    submissionId?: mongoose.Types.ObjectId;
    answer?: Record<string, unknown>;
    isCorrect?: boolean;
    marksAwarded?: number;
    submittedAt?: Date;
  };
  statusHistory: Array<{
    status: "open" | "under_review" | "accepted" | "rejected" | "resolved";
    note?: string;
    performedBy: mongoose.Types.ObjectId;
    timestamp: Date;
  }>;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contestClaimSchema = new Schema<IContestClaim>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["answer_key", "ambiguous_question", "marking", "technical", "other"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "under_review", "accepted", "rejected", "resolved"],
      default: "open",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    adminResponse: { type: String, trim: true },
    contestLifecycleAtCreate: { type: String, trim: true },
    questionSnapshot: {
      title: { type: String, trim: true },
      contentId: { type: String, trim: true },
      problemId: { type: String, trim: true },
      questionType: { type: String, trim: true },
    },
    userAnswerSnapshot: {
      submissionId: { type: Schema.Types.ObjectId, ref: "ContestSubmission" },
      answer: { type: Schema.Types.Mixed, default: {} },
      isCorrect: { type: Boolean },
      marksAwarded: { type: Number },
      submittedAt: { type: Date },
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: ["open", "under_review", "accepted", "rejected", "resolved"],
            required: true,
          },
          note: { type: String, trim: true },
          performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

contestClaimSchema.index({ contestId: 1, status: 1, createdAt: -1 });
contestClaimSchema.index({ contestId: 1, userId: 1, createdAt: -1 });
contestClaimSchema.index({ contestId: 1, questionId: 1, userId: 1, createdAt: -1 });

const ContestClaim = mongoose.model<IContestClaim>("ContestClaim", contestClaimSchema);
export default ContestClaim;
