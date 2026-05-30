import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createEndedContest, createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("submit after lock", () => {
  beforeEach(resetContestCollections);

  it("rejects submission after final submit", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion();
    const contest = await createLiveContest({ questions: [q._id] });
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in", finishedAt: new Date() });
    const response = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![0]._id });
    expect(response.status).toBe(400);
  });

  it("rejects submission after contest end", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion();
    const contest = await createEndedContest({ questions: [q._id] });
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in" });
    const response = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![0]._id });
    expect(response.status).toBe(400);
  });
});
