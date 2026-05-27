import mongoose, { Schema, Document } from "mongoose";

export interface IContestStanding extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rank?: number;
  score: number;
  solvedCount: number;
  wrongAttempts: number;
  penaltyMinutes: number;
  lastAcceptedAt?: Date;
  frozenScore?: number;
  frozenRank?: number;
  visibleScore: number;
  visibleRank?: number;
  isFinal: boolean;
  disqualified: boolean;
  problemStats: Array<{
    questionId: mongoose.Types.ObjectId;
    attempts: number;
    isCorrect: boolean;
    marksAwarded: number;
    solvedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const problemStandingSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    attempts: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    solvedAt: { type: Date },
  },
  { _id: false }
);

const contestStandingSchema = new Schema<IContestStanding>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rank: { type: Number, index: true },
    score: { type: Number, default: 0, index: true },
    solvedCount: { type: Number, default: 0 },
    wrongAttempts: { type: Number, default: 0 },
    penaltyMinutes: { type: Number, default: 0, index: true },
    lastAcceptedAt: { type: Date },
    frozenScore: { type: Number },
    frozenRank: { type: Number },
    visibleScore: { type: Number, default: 0 },
    visibleRank: { type: Number },
    isFinal: { type: Boolean, default: false, index: true },
    disqualified: { type: Boolean, default: false, index: true },
    problemStats: { type: [problemStandingSchema], default: [] },
  },
  { timestamps: true }
);

contestStandingSchema.index({ contestId: 1, userId: 1 }, { unique: true });
contestStandingSchema.index({ contestId: 1, score: -1, penaltyMinutes: 1, lastAcceptedAt: 1 });
contestStandingSchema.index({ contestId: 1, visibleRank: 1 });

const ContestStanding = mongoose.model<IContestStanding>("ContestStanding", contestStandingSchema);
export default ContestStanding;
