import mongoose, { Schema, Document } from "mongoose";

export interface IContestRegistration extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: "registered" | "checked_in" | "withdrawn" | "disqualified";
  registeredAt: Date;
  checkedInAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  ratingBefore?: number;
  ratingAfter?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const contestRegistrationSchema = new Schema<IContestRegistration>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["registered", "checked_in", "withdrawn", "disqualified"],
      default: "registered",
      index: true,
    },
    registeredAt: { type: Date, default: Date.now },
    checkedInAt: { type: Date },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    ratingBefore: { type: Number },
    ratingAfter: { type: Number },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

contestRegistrationSchema.index({ contestId: 1, userId: 1 }, { unique: true });
contestRegistrationSchema.index({ contestId: 1, status: 1, registeredAt: -1 });

const ContestRegistration = mongoose.model<IContestRegistration>(
  "ContestRegistration",
  contestRegistrationSchema
);

export default ContestRegistration;
