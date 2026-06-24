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

export interface ITheory extends Document {
  contentId: string;
  theoryId?: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId: string;
  title: string;
  topic: string;
  chapterTitle: string;
  sectionId: string;
  content: string;
  /** Legacy single-image field. New content should use images. */
  imageUrl?: string;
  images: IContentMedia[];
  examples: string[];
  formulas: string[];
  diagrams: string[];
  highlights: string[];
  tags: string[];
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

const theorySchema = new Schema<ITheory>(
  {
    contentId: { type: String, unique: true, sparse: true },
    theoryId: { type: String, unique: true, sparse: true },
    subjectId: { type: String, index: true },
    chapterId: { type: String, index: true },
    topicId: { type: String, index: true },
    subtopicId: { type: String, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, trim: true, default: "" },
    chapterTitle: { type: String, trim: true, default: "" },
    sectionId: { type: String, trim: true, default: "" },
    content: { type: String, required: true },
    imageUrl: { type: String },
    images: { type: [contentMediaSchema], default: [] },
    examples: [{ type: String }],
    formulas: [{ type: String }],
    diagrams: [{ type: String }],
    highlights: [{ type: String }],
    tags: { type: [String], default: [] },
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
theorySchema.index({ subjectId: 1, chapterId: 1, topicId: 1, subtopicId: 1, status: 1 });

theorySchema.pre("save", function (next) {
  if (!this.theoryId && this.subtopicId) {
    const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    this.theoryId = `THEORY_${this.subtopicId}_${suffix}`;
  }
  if (!this.contentId) {
    const prefix = this.subtopicId
      ? this.subtopicId.replace(/^SUBTOPIC_/, "").slice(0, 12)
      : (this.topic || "GEN").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4).padEnd(4, "X");
    const uniqueHash = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.contentId = `${prefix}-TH-${uniqueHash}`;
  }
  next();
});

const Theory = mongoose.model<ITheory>("Theory", theorySchema);
export default Theory;
