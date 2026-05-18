import mongoose, { Schema, Document } from "mongoose";

export interface IAuditEntry {
  action: string;
  note?: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IQuestion extends Document {
  contentId: string; // Meaningful ID e.g. PROB-MCQ-001
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string;
  options?: { text: string; isCorrect: boolean }[];
  questionType: "MCQ" | "MSQ" | "NAT";
  imageUrl?: string;
  solution: string;
  markingScheme: { positive: number; negative: number };
  status: "draft" | "pending_review" | "approved" | "rejected";
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  auditLog: IAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const auditEntrySchema = new Schema<IAuditEntry>(
  {
    action: { type: String, required: true },
    note: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    contentId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    statement: { type: String, required: true },
    options: [
      {
        text: { type: String },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    questionType: { type: String, enum: ["MCQ", "MSQ", "NAT"], required: true },
    imageUrl: { type: String },
    solution: { type: String, required: true },
    markingScheme: {
      positive: { type: Number, required: true, default: 1 },
      negative: { type: Number, required: true, default: 0 },
    },
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    auditLog: [auditEntrySchema],
  },
  { timestamps: true }
);

import crypto from "crypto";

// Auto-generate a meaningful content ID before save
questionSchema.pre("save", function (next) {
  if (!this.contentId) {
    const topicCode = (this.topic || "GEN")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .substring(0, 4)
      .padEnd(4, "X");
    const typeCode = this.questionType || "MCQ";
    
    // Generate a secure 6-character random hex to guarantee uniqueness
    const uniqueHash = crypto.randomBytes(3).toString("hex").toUpperCase();

    this.contentId = `${topicCode}-${typeCode}-${uniqueHash}`;
  }
  next();
});

const Question = mongoose.model<IQuestion>("Question", questionSchema);
export default Question;
