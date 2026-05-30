import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("contest room access", () => {
  beforeEach(resetContestCollections);

  it("allows registered participant and hides answers before release", async () => {
    const user = await createTestUser("student");
    const contest = await createLiveContest();
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in", checkedInAt: new Date(), startedAt: new Date() });
    const { result: response } = await measureApiTime("room load", PERFORMANCE_LIMITS.roomLoad, () =>
      request(app).get(`/api/contests/${contest._id}/room`).set("Cookie", authCookie(user))
    );
    expect(response.status).toBe(200);
    expect(response.body.canReveal).toBe(false);
    expect(response.body.contest.questions[0].options[0]).not.toHaveProperty("isCorrect");
    expect(response.body.contest.questions[0]).not.toHaveProperty("solution");
  });
});
