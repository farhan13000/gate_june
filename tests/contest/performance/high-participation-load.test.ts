import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createManyStudents } from "../setup/test-users";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("high participation load", () => {
  beforeEach(resetContestCollections);

  it("supports 100 users registering and checking in", async () => {
    const contest = await createLiveContest();
    const users = await createManyStudents(100);
    await measureApiTime("100 registrations", PERFORMANCE_LIMITS.recomputeStandings, async () => {
      await Promise.all(users.map((user) => request(app).post(`/api/contests/${contest._id}/register`).set("Cookie", authCookie(user))));
    });
    expect(await ContestRegistration.countDocuments({ contestId: contest._id })).toBe(100);
    await measureApiTime("100 check-ins", PERFORMANCE_LIMITS.recomputeStandings, async () => {
      await Promise.all(users.map((user) => request(app).post(`/api/contests/${contest._id}/check-in`).set("Cookie", authCookie(user))));
    });
  });
});
