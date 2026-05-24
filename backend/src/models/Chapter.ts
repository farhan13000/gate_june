import mongoose, { Schema, Document } from "mongoose";

export interface IChapter extends Document {
  chapterId: string;
  subjectId: string;
  name: string;
  order: number;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<IChapter>(
  {
    chapterId: { type: String, required: true, unique: true, trim: true },
    subjectId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    enabled: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

chapterSchema.index({ subjectId: 1, order: 1 });

const Chapter = mongoose.model<IChapter>("Chapter", chapterSchema);
export default Chapter;
