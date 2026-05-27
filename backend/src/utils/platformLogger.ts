import { Types } from "mongoose";
import PlatformLog, { PlatformLogStatus } from "../models/PlatformLog";

interface PlatformLogInput {
  category: string;
  action: string;
  status?: PlatformLogStatus;
  message: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  performedBy?: Types.ObjectId;
  requestId?: string;
}

export async function writePlatformLog(input: PlatformLogInput): Promise<void> {
  try {
    await PlatformLog.create({
      status: "success",
      ...input,
    });
  } catch (error) {
    console.error("[platformLogger] Failed to write platform log", error);
  }
}

export async function writePlatformLogs(inputs: PlatformLogInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    await PlatformLog.insertMany(
      inputs.map((input) => ({
        status: "success",
        ...input,
      })),
      { ordered: false }
    );
  } catch (error) {
    console.error("[platformLogger] Failed to write platform logs", error);
  }
}
