import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendationLog extends Document {
  userId: mongoose.Types.ObjectId;
  type: string; // "weak_topic_repair", "revision_due", "next_problems", "contest_prep"
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
  items: {
    kind: "theory" | "problem" | "contest";
    id: string; // problemId, theoryId, contestId
    title: string;
    difficulty?: string;
  }[];
  status: "pending" | "in_progress" | "completed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

const recommendationLogSchema = new Schema<IRecommendationLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    reason: { type: String, required: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    items: [
      {
        kind: { type: String, enum: ["theory", "problem", "contest"] },
        id: { type: String },
        title: { type: String },
        difficulty: { type: String },
      },
    ],
    status: { type: String, enum: ["pending", "in_progress", "completed", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

recommendationLogSchema.index({ userId: 1, status: 1 });

const RecommendationLog = mongoose.model<IRecommendationLog>("RecommendationLog", recommendationLogSchema);
export default RecommendationLog;
