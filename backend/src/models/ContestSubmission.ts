import mongoose, { Schema, Document } from "mongoose";

export interface IContestSubmission extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  answer: {
    mcqSelected?: string | null;
    msqSelected?: string[];
    natAnswer?: string;
  };
  isCorrect: boolean;
  marksAwarded: number;
  attemptNumber: number;
  submittedAt: Date;
  judgedAt?: Date;
  judgeStatus: "pending" | "accepted" | "wrong" | "manual_review" | "rejudged";
  source: "live" | "rejudge" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const contestSubmissionSchema = new Schema<IContestSubmission>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    answer: {
      mcqSelected: { type: String, default: null },
      msqSelected: { type: [String], default: [] },
      natAnswer: { type: String, default: "" },
    },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1, min: 1 },
    submittedAt: { type: Date, default: Date.now, index: true },
    judgedAt: { type: Date },
    judgeStatus: {
      type: String,
      enum: ["pending", "accepted", "wrong", "manual_review", "rejudged"],
      default: "pending",
      index: true,
    },
    source: {
      type: String,
      enum: ["live", "rejudge", "admin"],
      default: "live",
    },
  },
  { timestamps: true }
);

contestSubmissionSchema.index({ contestId: 1, userId: 1, questionId: 1, submittedAt: -1 });
contestSubmissionSchema.index({ contestId: 1, questionId: 1, judgeStatus: 1 });

const ContestSubmission = mongoose.model<IContestSubmission>("ContestSubmission", contestSubmissionSchema);
export default ContestSubmission;
