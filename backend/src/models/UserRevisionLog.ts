import mongoose, { Schema, Document } from "mongoose";

export interface IUserRevisionLog extends Document {
  userId: mongoose.Types.ObjectId;
  topicId: string;
  revisionType: "theory" | "problem" | "mixed";
  confidenceBefore: number; // 0-100
  confidenceAfter: number;  // 0-100
  revisedAt: Date;
  nextRevisionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userRevisionLogSchema = new Schema<IUserRevisionLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topicId: { type: String, required: true },
    revisionType: { type: String, enum: ["theory", "problem", "mixed"], required: true },
    confidenceBefore: { type: Number, min: 0, max: 100, default: 0 },
    confidenceAfter: { type: Number, min: 0, max: 100, default: 0 },
    revisedAt: { type: Date, default: Date.now },
    nextRevisionAt: { type: Date },
  },
  { timestamps: true }
);

userRevisionLogSchema.index({ userId: 1, topicId: 1, revisedAt: -1 });

const UserRevisionLog = mongoose.model<IUserRevisionLog>("UserRevisionLog", userRevisionLogSchema);
export default UserRevisionLog;
