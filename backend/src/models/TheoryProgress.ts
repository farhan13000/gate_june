import mongoose, { Schema, Document } from "mongoose";

export interface ITheoryProgress extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId?: string;
  progressPercent: number;
  completed: boolean;
  lastReadAt: Date;
  revisionDueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const theoryProgressSchema = new Schema<ITheoryProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: String, required: true },
    chapterId: { type: String, required: true },
    topicId: { type: String, required: true },
    subtopicId: { type: String },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    lastReadAt: { type: Date, default: Date.now },
    revisionDueAt: { type: Date },
  },
  { timestamps: true }
);

theoryProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

const TheoryProgress = mongoose.model<ITheoryProgress>("TheoryProgress", theoryProgressSchema);
export default TheoryProgress;
