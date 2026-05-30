import request from "supertest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import ContestSubmission from "../../../backend/src/models/ContestSubmission";
import { recomputeUserStanding, recomputeContestRanks } from "../../../backend/src/utils/contestScoring";

export const LIFECYCLE_STATES = [
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
];

export async function registerAndCheckIn(app: any, contest: any, cookie: string[]) {
  await request(app).post(`/api/contests/${contest._id}/register`).set("Cookie", cookie);
  await request(app).post(`/api/contests/${contest._id}/check-in`).set("Cookie", cookie);
}

export async function seedCheckedInUser(contest: any, user: any) {
  return ContestRegistration.findOneAndUpdate(
    { contestId: contest._id, userId: user._id },
    { contestId: contest._id, userId: user._id, status: "checked_in", checkedInAt: new Date(), startedAt: new Date(), ratingBefore: user.rating || 0 },
    { upsert: true, new: true }
  );
}

export async function submitDirect(contest: any, user: any, question: any, answer: any, isCorrect = true, marksAwarded = 2, submittedAt = new Date()) {
  const count = await ContestSubmission.countDocuments({ contestId: contest._id, userId: user._id, questionId: question._id });
  return ContestSubmission.create({
    contestId: contest._id,
    userId: user._id,
    questionId: question._id,
    answer,
    isCorrect,
    marksAwarded,
    attemptNumber: count + 1,
    submittedAt,
    judgedAt: submittedAt,
    judgeStatus: isCorrect ? "accepted" : "wrong",
  });
}

export async function recomputeAll(contest: any, users: any[]) {
  for (const user of users) {
    await recomputeUserStanding(contest, user._id);
  }
  await recomputeContestRanks(contest._id);
}
