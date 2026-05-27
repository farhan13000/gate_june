import mongoose, { Schema, Document } from "mongoose";

export interface IRatingHistory extends Document {
  userId: mongoose.Types.ObjectId;
  contestId: mongoose.Types.ObjectId;
  oldRating: number;
  newRating: number;
  delta: number;
  rank: number;
  participants: number;
  performanceRating?: number;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ratingHistorySchema = new Schema<IRatingHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    oldRating: { type: Number, required: true },
    newRating: { type: Number, required: true },
    delta: { type: Number, required: true },
    rank: { type: Number, required: true },
    participants: { type: Number, required: true },
    performanceRating: { type: Number },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ratingHistorySchema.index({ userId: 1, contestId: 1 }, { unique: true });
ratingHistorySchema.index({ userId: 1, appliedAt: -1 });
ratingHistorySchema.index({ contestId: 1, rank: 1 });

const RatingHistory = mongoose.model<IRatingHistory>("RatingHistory", ratingHistorySchema);
export default RatingHistory;
