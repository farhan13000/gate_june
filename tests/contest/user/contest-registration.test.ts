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

  it("allows registration after contest start until five minutes before end", async () => {
    const user = await createTestUser("student");
    const startTime = new Date(Date.now() - 10 * 60_000);
    const endTime = new Date(Date.now() + 50 * 60_000);
    const contest = await createRegistrationOpenContest({
      startTime,
      endTime,
      registrationStartTime: new Date(Date.now() - 60 * 60_000),
      registrationEndTime: new Date(Date.now() + 45 * 60_000),
    } as any);

    const response = await request(app).post(`/api/contests/${contest._id}/register`).set("Cookie", authCookie(user));
    expect(response.status).toBe(201);

    const closedContest = await createRegistrationOpenContest({
      startTime,
      endTime,
      registrationStartTime: new Date(Date.now() - 60 * 60_000),
      registrationEndTime: new Date(Date.now() - 1000),
    } as any);
    const late = await request(app).post(`/api/contests/${closedContest._id}/register`).set("Cookie", authCookie(user));
    expect(late.status).toBe(400);
  });
});
