import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformSettings extends Document {
  problemOfTheDayId?: mongoose.Types.ObjectId | null;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    problemOfTheDayId: { type: Schema.Types.ObjectId, ref: "Question", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model<IPlatformSettings>(
  "PlatformSettings",
  platformSettingsSchema
);

export async function getOrCreateSettings(): Promise<IPlatformSettings> {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  return settings;
}

export default PlatformSettings;
