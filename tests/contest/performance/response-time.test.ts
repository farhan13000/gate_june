import request from "supertest";
import { beforeEach, describe, it } from "vitest";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("contest API response time", () => {
  beforeEach(resetContestCollections);

  it("keeps list and detail APIs under thresholds", async () => {
    const contest = await createPublishedContest();
    await measureApiTime("contest list", PERFORMANCE_LIMITS.contestList, () => request(app).get("/api/contests"));
    await measureApiTime("contest detail", PERFORMANCE_LIMITS.contestDetails, () => request(app).get(`/api/contests/${contest._id}`));
  });
});
