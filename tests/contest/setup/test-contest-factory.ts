import mongoose from "mongoose";
import Contest from "../../../backend/src/models/Contest";
import { createMCQQuestion } from "./test-question-factory";

let cSeq = 0;

export function contestTimes(offsetStartMs = 60_000, durationMs = 60 * 60_000) {
  const start = new Date(Date.now() + offsetStartMs);
  const end = new Date(start.getTime() + durationMs);
  return { start, end };
}

async function createContestWithLifecycle(lifecycle: string, overrides: Record<string, any> = {}) {
  cSeq += 1;
  const actorId = overrides.createdBy || new mongoose.Types.ObjectId();
  const { start, end } = contestTimes(
    ["live", "frozen", "ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(lifecycle)
      ? -60 * 60_000
      : 60 * 60_000,
    lifecycle === "ended" || lifecycle.includes("claim") || lifecycle.includes("final") || lifecycle === "ratings_applied" ? 30 * 60_000 : 60 * 60_000
  );
  const question = overrides.question || (await createMCQQuestion({ createdBy: actorId }));
  return Contest.create({
    title: overrides.title || `Contest ${cSeq} ${lifecycle}`,
    description: "Contest feature test fixture",
    questions: overrides.questions || [question._id],
    contestType: overrides.contestType || "full_mock",
    visibility: overrides.visibility || "public",
    scoringMode: overrides.scoringMode || "gate",
    lifecycle,
    registrationStartTime: overrides.registrationStartTime || new Date(start.getTime() - 7 * 24 * 60 * 60_000),
    registrationEndTime: overrides.registrationEndTime || start,
    startTime: overrides.startTime || start,
    endTime: overrides.endTime || end,
    freezeTime: overrides.freezeTime,
    answerKeyReleaseTime: overrides.answerKeyReleaseTime,
    claimsOpenTime: overrides.claimsOpenTime,
    claimsCloseTime: overrides.claimsCloseTime,
    wrongPenaltyMinutes: overrides.wrongPenaltyMinutes ?? 10,
    ratingEnabled: Boolean(overrides.ratingEnabled),
    instantFeedback: Boolean(overrides.instantFeedback),
    status: lifecycle === "draft" ? "draft" : ["ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(lifecycle) ? "completed" : "approved",
    showOnHome: true,
    createdBy: actorId,
    approvedBy: actorId,
    rules: overrides.rules || ["Test contest rules"],
  });
}

export const createDraftContest = (overrides = {}) => createContestWithLifecycle("draft", overrides);
export const createPublishedContest = (overrides = {}) => createContestWithLifecycle("published", overrides);
export const createRegistrationOpenContest = (overrides = {}) => createContestWithLifecycle("registration_open", overrides);
export const createLiveContest = (overrides = {}) => createContestWithLifecycle("live", overrides);
export const createFrozenContest = (overrides = {}) => createContestWithLifecycle("frozen", overrides);
export const createEndedContest = (overrides = {}) => createContestWithLifecycle("ended", overrides);
export const createAnswerKeyReleasedContest = (overrides = {}) => createContestWithLifecycle("answer_key_released", overrides);
export const createClaimsOpenContest = (overrides = {}) => createContestWithLifecycle("claims_open", overrides);
export const createFinalizedContest = (overrides = {}) => createContestWithLifecycle("finalized", overrides);
export const createRatedContest = (overrides = {}) => createContestWithLifecycle("live", { ...overrides, ratingEnabled: true, contestType: "rated" });
