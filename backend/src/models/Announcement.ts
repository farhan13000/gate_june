import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  link?: string;
  type: "important" | "recent";
  showNewBadge: boolean;
  isActive: boolean;
  sortOrder: number;
  publishedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    link: { type: String, trim: true },
    type: { type: String, enum: ["important", "recent"], required: true },
    showNewBadge: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ type: 1, isActive: 1, sortOrder: -1, publishedAt: -1 });

const Announcement = mongoose.model<IAnnouncement>("Announcement", announcementSchema);
export default Announcement;
