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

describe("user contest check-in", () => {
  beforeEach(resetContestCollections);

  it("checks in registered user and rejects unregistered user", async () => {
    const user = await createTestUser("student");
    const outsider = await createTestUser("student");
    const contest = await createLiveContest();
    await ContestRegistration.create({ contestId: contest._id, userId: user._id });
    const { result: ok } = await measureApiTime("check-in", PERFORMANCE_LIMITS.checkIn, () =>
      request(app).post(`/api/contests/${contest._id}/check-in`).set("Cookie", authCookie(user))
    );
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("checked_in");
    const denied = await request(app).post(`/api/contests/${contest._id}/check-in`).set("Cookie", authCookie(outsider));
    expect(denied.status).toBe(403);
  });
});
