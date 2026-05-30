import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import Contest from "../../../backend/src/models/Contest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("admin contest creation", () => {
  beforeEach(resetContestCollections);

  it("creates an approved contest and persists timing/status", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const startTime = new Date(Date.now() + 60 * 60_000).toISOString();
    const endTime = new Date(Date.now() + 120 * 60_000).toISOString();
    const { result: response, durationMs } = await measureApiTime("admin create contest", PERFORMANCE_LIMITS.register, () =>
      request(app).post("/api/admin/contests").set("Cookie", authCookie(admin)).send({
        title: "Weekly Mock",
        description: "Full contest creation test",
        startTime,
        endTime,
        lifecycle: "published",
        ratingEnabled: true,
      })
    );

    expect(response.status).toBe(201);
    expect(durationMs).toBeLessThan(PERFORMANCE_LIMITS.register);
    expect(response.body).toMatchObject({ title: "Weekly Mock", lifecycle: "published", status: "approved" });
    const saved = await Contest.findById(response.body._id).lean();
    expect(saved?.createdBy.toString()).toBe(String(admin._id));
    expect(saved?.ratingEnabled).toBe(true);
  });

  it("rejects student access to admin creation", async () => {
    const student = await createTestUser("student");
    const response = await request(app).post("/api/admin/contests").set("Cookie", authCookie(student)).send({});
    expect(response.status).toBe(403);
    expect(await Contest.countDocuments()).toBe(0);
  });
});
