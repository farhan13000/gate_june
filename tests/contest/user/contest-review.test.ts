import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createAnswerKeyReleasedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("user answer key review", () => {
  beforeEach(resetContestCollections);

  it("reveals correct answers and solution after answer key release", async () => {
    const user = await createTestUser("student");
    const contest = await createAnswerKeyReleasedContest();
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in" });
    const response = await request(app).get(`/api/contests/${contest._id}/room`).set("Cookie", authCookie(user));
    expect(response.status).toBe(200);
    expect(response.body.canReveal).toBe(true);
    expect(response.body.contest.questions[0].options[0]).toHaveProperty("isCorrect");
    expect(response.body.contest.questions[0]).toHaveProperty("solution");
  });
});
