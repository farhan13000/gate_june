import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import Contest from "../../../backend/src/models/Contest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("admin contest update", () => {
  beforeEach(resetContestCollections);

  it("updates contest metadata and status safely", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createPublishedContest({ createdBy: admin._id });
    const { result: response } = await measureApiTime("admin update contest", PERFORMANCE_LIMITS.contestDetails, () =>
      request(app).put(`/api/admin/contests/${contest._id}`).set("Cookie", authCookie(admin)).send({
        title: "Updated title",
        description: "Updated description",
        lifecycle: "registration_open",
        status: "approved",
      })
    );

    expect(response.status).toBe(200);
    const saved = await Contest.findById(contest._id).lean();
    expect(saved).toMatchObject({ title: "Updated title", lifecycle: "registration_open", status: "approved" });
  });

  it("rejects invalid end time", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createPublishedContest({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}`).set("Cookie", authCookie(admin)).send({
      startTime: new Date(Date.now() + 60_000).toISOString(),
      endTime: new Date(Date.now()).toISOString(),
    });
    expect(response.status).toBe(400);
  });
});
