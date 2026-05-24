import mongoose, { Schema, Document } from "mongoose";

export type TopicDifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface ITopic extends Document {
  topicId: string;
  chapterId: string;
  subjectId: string;
  name: string;
  order: number;
  difficultyLevel: TopicDifficultyLevel;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    topicId: { type: String, required: true, unique: true, trim: true },
    chapterId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    difficultyLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    enabled: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

topicSchema.index({ chapterId: 1, order: 1 });
topicSchema.index({ subjectId: 1, order: 1 });

const Topic = mongoose.model<ITopic>("Topic", topicSchema);
export default Topic;
