import mongoose, { Schema, Document } from "mongoose";

export interface IContest extends Document {
  title: string;
  description: string;
  meta?: string;
  questions: mongoose.Types.ObjectId[];
  contestType:
    | "full_mock"
    | "subject_wise"
    | "weekly"
    | "challenge_yourself"
    | "practice"
    | "rated"
    | "gate_mock"
    | "private"
    | "challenge";
  visibility: "public" | "private" | "invite_only";
  scoringMode: "gate" | "icpc";
  lifecycle:
    | "draft"
    | "published"
    | "registration_open"
    | "live"
    | "frozen"
    | "ended"
    | "answer_key_released"
    | "claims_open"
    | "claims_closed"
    | "finalized"
    | "ratings_applied";
  registrationStartTime?: Date;
  registrationEndTime?: Date;
  startTime: Date;
  endTime: Date;
  freezeTime?: Date;
  answerKeyReleaseTime?: Date;
  claimsOpenTime?: Date;
  claimsCloseTime?: Date;
  durationMinutes: number;
  wrongPenaltyMinutes: number;
  ratingEnabled: boolean;
  instantFeedback: boolean;
  maxParticipants?: number;
  instructions?: string;
  rules: string[];
  status: "draft" | "pending_review" | "approved" | "completed";
  showOnHome: boolean;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    meta: { type: String, trim: true },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    contestType: {
      type: String,
      enum: [
        "full_mock",
        "subject_wise",
        "weekly",
        "challenge_yourself",
        "practice",
        "rated",
        "gate_mock",
        "private",
        "challenge",
      ],
      default: "full_mock",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "invite_only"],
      default: "public",
      index: true,
    },
    scoringMode: {
      type: String,
      enum: ["gate", "icpc"],
      default: "gate",
    },
    lifecycle: {
      type: String,
      enum: [
        "draft",
        "published",
        "registration_open",
        "live",
        "frozen",
        "ended",
        "answer_key_released",
        "claims_open",
        "claims_closed",
        "finalized",
        "ratings_applied",
      ],
      default: "draft",
      index: true,
    },
    registrationStartTime: { type: Date },
    registrationEndTime: { type: Date },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    freezeTime: { type: Date },
    answerKeyReleaseTime: { type: Date },
    claimsOpenTime: { type: Date },
    claimsCloseTime: { type: Date },
    durationMinutes: { type: Number, default: 180, min: 1 },
    wrongPenaltyMinutes: { type: Number, default: 10, min: 0 },
    ratingEnabled: { type: Boolean, default: false },
    instantFeedback: { type: Boolean, default: false },
    maxParticipants: { type: Number, min: 1 },
    instructions: { type: String, trim: true },
    rules: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "completed"],
      default: "draft",
    },
    showOnHome: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

contestSchema.index({ lifecycle: 1, startTime: 1 });
contestSchema.index({ status: 1, showOnHome: 1, startTime: 1 });

contestSchema.pre("validate", function (next) {
  if (this.startTime && this.endTime) {
    this.durationMinutes = Math.max(1, Math.ceil((this.endTime.getTime() - this.startTime.getTime()) / 60000));
  }
  if (!this.registrationStartTime && this.startTime) {
    this.registrationStartTime = new Date(this.startTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (!this.registrationEndTime && this.startTime) {
    this.registrationEndTime = this.startTime;
  }
  if (!this.rules?.length) {
    this.rules = [
      "Do not refresh or navigate away during the live contest unless required.",
      "Only the final submitted answer before contest end is considered for scoring.",
      "Final ranks are published after answer key release and claim review.",
    ];
  }
  next();
});

const Contest = mongoose.model<IContest>("Contest", contestSchema);
export default Contest;
