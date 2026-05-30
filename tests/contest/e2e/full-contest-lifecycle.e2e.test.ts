import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import Contest from "../../../backend/src/models/Contest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("E2E normal contest lifecycle", () => {
  beforeEach(resetContestCollections);

  it("admin creates, publishes, user participates, admin releases key, user reviews", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const user = await createTestUser("student");
    const q = await createMCQQuestion({ createdBy: admin._id });
    const create = await request(app).post("/api/admin/contests").set("Cookie", authCookie(admin)).send({
      title: "E2E Normal Contest",
      description: "Normal flow",
      startTime: new Date(Date.now() - 60_000).toISOString(),
      endTime: new Date(Date.now() + 60 * 60_000).toISOString(),
      lifecycle: "live",
      status: "approved",
    });
    expect(create.status).toBe(201);
    const contestId = create.body._id;
    await request(app).put(`/api/admin/contests/${contestId}/problems`).set("Cookie", authCookie(admin)).send({ questionIds: [String(q._id)] });
    expect((await request(app).post(`/api/contests/${contestId}/register`).set("Cookie", authCookie(user))).status).toBe(201);
    expect((await request(app).post(`/api/contests/${contestId}/check-in`).set("Cookie", authCookie(user))).status).toBe(200);
    expect((await request(app).post(`/api/contests/${contestId}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![0]._id })).status).toBe(201);
    expect((await request(app).post(`/api/contests/${contestId}/finish`).set("Cookie", authCookie(user))).status).toBe(200);
    await Contest.updateOne({ _id: contestId }, { lifecycle: "ended", endTime: new Date(Date.now() - 1000), status: "completed" });
    expect((await request(app).post(`/api/admin/contests/${contestId}/release-answer-key`).set("Cookie", authCookie(admin))).body.lifecycle).toBe("answer_key_released");
    const review = await request(app).get(`/api/contests/${contestId}/room`).set("Cookie", authCookie(user));
    expect(review.body.canReveal).toBe(true);
  });
});
