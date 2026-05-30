import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("unauthorized access", () => {
  beforeEach(resetContestCollections);

  it("requires auth for room, registration actions, and admin APIs", async () => {
    const contest = await createLiveContest();
    expect((await request(app).get(`/api/contests/${contest._id}/room`)).status).toBe(401);
    expect((await request(app).post(`/api/contests/${contest._id}/check-in`)).status).toBe(401);
    expect((await request(app).get("/api/admin/contests")).status).toBe(401);
  });
});
