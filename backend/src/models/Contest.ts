import mongoose, { Schema, Document } from "mongoose";

export interface IContest extends Document {
  title: string;
  description: string;
  questions: mongoose.Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  status: "draft" | "pending_review" | "approved" | "completed";
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "completed"],
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Contest = mongoose.model<IContest>("Contest", contestSchema);
export default Contest;
