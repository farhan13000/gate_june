import mongoose, { Schema, Document } from "mongoose";

export interface IAuditEntry {
  action: string;
  note?: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface ITheory extends Document {
  contentId: string; // e.g. PROB-TH-001
  title: string;
  topic: string;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  content: string;
  imageUrl?: string;
  examples: string[];
  status: "draft" | "pending_review" | "approved" | "rejected";
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
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

const theorySchema = new Schema<ITheory>(
  {
    contentId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    chapterId: { type: String, required: true },
    chapterTitle: { type: String, required: true },
    sectionId: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    examples: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    auditLog: [auditEntrySchema],
  },
  { timestamps: true }
);

import crypto from "crypto";

// Auto-generate meaningful content ID before save
theorySchema.pre("save", function (next) {
  if (!this.contentId) {
    const topicCode = (this.topic || "GEN")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .substring(0, 4)
      .padEnd(4, "X");
    
    // Generate a secure 6-character random hex to guarantee uniqueness
    const uniqueHash = crypto.randomBytes(3).toString("hex").toUpperCase();
    
    this.contentId = `${topicCode}-TH-${uniqueHash}`;
  }
  next();
});

const Theory = mongoose.model<ITheory>("Theory", theorySchema);
export default Theory;
