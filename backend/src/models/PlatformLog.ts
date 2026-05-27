import mongoose, { Schema, Document, Types } from "mongoose";

export type PlatformLogStatus = "success" | "warning" | "error";

export interface IPlatformLog extends Document {
  category: string;
  action: string;
  status: PlatformLogStatus;
  message: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  performedBy?: Types.ObjectId;
  requestId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const platformLogSchema = new Schema<IPlatformLog>(
  {
    category: { type: String, required: true, index: true, trim: true },
    action: { type: String, required: true, index: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["success", "warning", "error"],
      default: "success",
      index: true,
    },
    message: { type: String, required: true, trim: true },
    targetType: { type: String, trim: true, index: true },
    targetId: { type: String, trim: true, index: true },
    details: { type: Schema.Types.Mixed },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    requestId: { type: String, trim: true, index: true },
  },
  { timestamps: true }
);

platformLogSchema.index({ createdAt: -1 });
platformLogSchema.index({ category: 1, createdAt: -1 });

const PlatformLog = mongoose.model<IPlatformLog>("PlatformLog", platformLogSchema);
export default PlatformLog;
