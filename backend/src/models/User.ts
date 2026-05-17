import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  institution?: string;
  graduationYear?: number;
  targetGateYear?: number;
  domains: string[];
  role: "student" | "admin";
  rating: number;

  // Auth fields
  passwordHash?: string;
  googleId?: string;
  authProvider: "local" | "google";

  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toProfile(): Record<string, any>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: String,
    institution: {
      type: String,
      trim: true,
    },
    graduationYear: Number,
    targetGateYear: Number,
    domains: {
      type: [String],
      default: ["GATE_DA"],
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    rating: {
      type: Number,
      default: 0,
    },

    // Auth
    passwordHash: {
      type: String,
      select: false, // Never returned in queries by default
    },
    googleId: {
      type: String,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      required: true,
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are automatically created by unique: true and sparse: true

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Return a clean user profile (no password hash)
userSchema.methods.toProfile = function (): Record<string, any> {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    avatarUrl: this.avatarUrl,
    institution: this.institution,
    graduationYear: this.graduationYear,
    targetGateYear: this.targetGateYear,
    domains: this.domains,
    role: this.role,
    rating: this.rating,
    authProvider: this.authProvider,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
