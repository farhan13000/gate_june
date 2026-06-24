import mongoose, { Schema, Document } from "mongoose";

export interface IAuditEntry {
  action: string;
  note?: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IContentMedia {
  url: string;
  alt?: string;
  caption?: string;
  kind?: "image" | "diagram";
  placement?: "inline" | "left" | "right" | "full";
}

export interface IQuestion extends Document {
  contentId: string;
  problemId?: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string;
  options?: { text: string; isCorrect: boolean }[];
  questionType: "MCQ" | "MSQ" | "NAT" | "PROOF";
  /** Legacy single-image field. New content should use images. */
  imageUrl?: string;
  images: IContentMedia[];
  solution: any;
  markingScheme: { positive: number; negative: number };
  tags: string[];
  isPyq?: boolean;
  yearAsked?: number;
  source?: string;
  estimatedTime: number;
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

const contentMediaSchema = new Schema<IContentMedia>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: "" },
    caption: { type: String, trim: true, default: "" },
    kind: { type: String, enum: ["image", "diagram"], default: "image" },
    placement: { type: String, enum: ["inline", "left", "right", "full"], default: "inline" },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    contentId: { type: String, unique: true, sparse: true },
    problemId: { type: String, unique: true, sparse: true },
    subjectId: { type: String, index: true },
    chapterId: { type: String, index: true },
    topicId: { type: String, index: true },
    subtopicId: { type: String, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, trim: true, default: "" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    statement: { type: String, required: true },
    options: [
      {
        text: { type: String },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    questionType: { type: String, enum: ["MCQ", "MSQ", "NAT", "PROOF"], required: true },
    imageUrl: { type: String },
    images: { type: [contentMediaSchema], default: [] },
    solution: { type: Schema.Types.Mixed, required: true },
    markingScheme: {
      positive: { type: Number, required: true, default: 1 },
      negative: { type: Number, required: true, default: 0 },
    },
    tags: { type: [String], default: [] },
    isPyq: { type: Boolean, default: false, index: true },
    yearAsked: { type: Number, min: 1900, max: 2100, index: true },
    source: { type: String, trim: true, default: "" },
    estimatedTime: { type: Number, default: 180 },
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
questionSchema.index({ subjectId: 1, chapterId: 1, topicId: 1, subtopicId: 1, status: 1 });

questionSchema.pre("save", function (next) {
  if (!this.problemId && this.subtopicId) {
    const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    this.problemId = `PROB_${this.subtopicId}_${suffix}`;
  }
  if (!this.contentId) {
    const prefix = this.subtopicId
      ? this.subtopicId.replace(/^SUBTOPIC_/, "").slice(0, 12)
      : (this.topic || "GEN").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4).padEnd(4, "X");
    const typeCode = this.questionType || "MCQ";
    const uniqueHash = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.contentId = `${prefix}-${typeCode}-${uniqueHash}`;
  }
  next();
});

const Question = mongoose.model<IQuestion>("Question", questionSchema);
export default Question;
