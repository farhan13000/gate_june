import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import ContestSubmission from "../../../backend/src/models/ContestSubmission";
import RatingHistory from "../../../backend/src/models/RatingHistory";
import Submission from "../../../backend/src/models/Submission";
import { authCookie } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createEndedContest, createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("past contest practice room", () => {
  beforeEach(resetContestCollections);

  it("lets a non-participant practice past contest questions without contest side effects", async () => {
    const user = await createTestUser("student");
    const question = await createMCQQuestion();
    const contest = await createEndedContest({ questions: [question._id] });

    const room = await request(app).get(`/api/contests/${contest._id}/practice-room`).set("Cookie", authCookie(user));

    expect(room.status).toBe(200);
    expect(room.body.mode).toBe("practice");
    expect(room.body.registration).toBeNull();
    expect(room.body.canSubmit).toBe(true);
    expect(room.body.contest.questions[0].options[0]).not.toHaveProperty("isCorrect");
    expect(room.body.contest.questions[0]).not.toHaveProperty("solution");

    const submit = await request(app)
      .post(`/api/contests/${contest._id}/practice-questions/${question._id}/submit`)
      .set("Cookie", authCookie(user))
      .send({ mcqSelected: String(question.options![0]._id) });

    expect(submit.status).toBe(201);
    expect(submit.body.result.isCorrect).toBe(true);

    const reviewRoom = await request(app).get(`/api/contests/${contest._id}/practice-room`).set("Cookie", authCookie(user));
    expect(reviewRoom.body.contest.questions[0].options[0]).toHaveProperty("isCorrect");
    expect(reviewRoom.body.contest.questions[0]).toHaveProperty("solution");

    expect(await Submission.countDocuments({ userId: user._id, questionId: question._id })).toBe(1);
    expect(await ContestRegistration.countDocuments({ contestId: contest._id, userId: user._id })).toBe(0);
    expect(await ContestSubmission.countDocuments({ contestId: contest._id, userId: user._id })).toBe(0);
    expect(await ContestStanding.countDocuments({ contestId: contest._id, userId: user._id })).toBe(0);
    expect(await RatingHistory.countDocuments({ contestId: contest._id, userId: user._id })).toBe(0);
  });

  it("does not open practice while a contest is live", async () => {
    const user = await createTestUser("student");
    const contest = await createLiveContest();

    const room = await request(app).get(`/api/contests/${contest._id}/practice-room`).set("Cookie", authCookie(user));

    expect(room.status).toBe(403);
  });
});
