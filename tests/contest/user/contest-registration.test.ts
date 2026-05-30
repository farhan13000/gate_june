import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createRegistrationOpenContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("user contest registration", () => {
  beforeEach(resetContestCollections);

  it("registers once and upserts duplicate registration", async () => {
    const user = await createTestUser("student");
    const contest = await createRegistrationOpenContest();
    const { result: first } = await measureApiTime("register", PERFORMANCE_LIMITS.register, () =>
      request(app).post(`/api/contests/${contest._id}/register`).set("Cookie", authCookie(user))
    );
    const second = await request(app).post(`/api/contests/${contest._id}/register`).set("Cookie", authCookie(user));
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await ContestRegistration.countDocuments({ contestId: contest._id, userId: user._id })).toBe(1);
  });
});
