import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  submittedOptionIds?: string[];
  natAnswer?: string;
  isCorrect: boolean;
  marksAwarded: number;
  timeTaken?: number;
  
  // Analytics fields (denormalized)
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  subtopicId?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  attemptNumber?: number;
  mistakeType?: string; // e.g. "calculation error", "conceptual error", "time pressure", "skipped"

  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    submittedOptionIds: {
      type: [String],
      default: [],
    },
    natAnswer: {
      type: String,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    marksAwarded: {
      type: Number,
      required: true,
    },
    timeTaken: {
      type: Number,
      default: 120, // default 2 minutes (120 seconds)
    },
    
    // Analytics fields
    subjectId: { type: String },
    chapterId: { type: String },
    topicId: { type: String },
    subtopicId: { type: String },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    attemptNumber: { type: Number, default: 1 },
    mistakeType: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up stats lookup and checking duplicate attempts
submissionSchema.index({ userId: 1, questionId: 1 });
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, subjectId: 1 });
submissionSchema.index({ userId: 1, topicId: 1 });

const Submission = mongoose.model<ISubmission>("Submission", submissionSchema);
export default Submission;
