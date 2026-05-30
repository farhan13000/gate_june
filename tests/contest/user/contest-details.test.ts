import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("user contest details", () => {
  beforeEach(resetContestCollections);

  it("loads contest details and registration count", async () => {
    const contest = await createPublishedContest();
    const { result: response } = await measureApiTime("contest details", PERFORMANCE_LIMITS.contestDetails, () => request(app).get(`/api/contests/${contest._id}`));
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ title: contest.title, registrationCount: 0 });
    expect(response.body.questions[0]).not.toHaveProperty("solution");
  });
});
