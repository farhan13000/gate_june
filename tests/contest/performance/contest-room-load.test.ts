import request from "supertest";
import { beforeEach, describe, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("contest room load performance", () => {
  beforeEach(resetContestCollections);

  it("loads room within threshold", async () => {
    const user = await createTestUser();
    const contest = await createLiveContest();
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in" });
    await measureApiTime("room load", PERFORMANCE_LIMITS.roomLoad, () => request(app).get(`/api/contests/${contest._id}/room`).set("Cookie", authCookie(user)));
  });
});
