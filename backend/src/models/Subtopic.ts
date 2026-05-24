import mongoose, { Schema, Document } from "mongoose";

export interface ISubtopic extends Document {
  subtopicId: string;
  topicId: string;
  chapterId: string;
  subjectId: string;
  name: string;
  order: number;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subtopicSchema = new Schema<ISubtopic>(
  {
    subtopicId: { type: String, required: true, unique: true, trim: true },
    topicId: { type: String, required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    enabled: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

subtopicSchema.index({ topicId: 1, order: 1 });

const Subtopic = mongoose.model<ISubtopic>("Subtopic", subtopicSchema);
export default Subtopic;
