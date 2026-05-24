import mongoose, { Schema, Document } from "mongoose";

export interface ISubject extends Document {
  subjectId: string;
  name: string;
  code: string;
  order: number;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    subjectId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    order: { type: Number, required: true, default: 0 },
    enabled: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

subjectSchema.index({ order: 1 });
subjectSchema.index({ enabled: 1, order: 1 });

const Subject = mongoose.model<ISubject>("Subject", subjectSchema);
export default Subject;
