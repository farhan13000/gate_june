import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("user contest list", () => {
  beforeEach(resetContestCollections);

  it("returns public published contests with state metadata", async () => {
    await createPublishedContest();
    const { result: response } = await measureApiTime("contest list", PERFORMANCE_LIMITS.contestList, () => request(app).get("/api/contests"));
    expect(response.status).toBe(200);
    expect(response.body[0]).toHaveProperty("contestState");
    expect(response.body[0]).not.toHaveProperty("createdBy");
  });
});
