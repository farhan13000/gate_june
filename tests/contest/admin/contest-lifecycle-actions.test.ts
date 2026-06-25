import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createAnswerKeyReleasedContest, createDraftContest, createEndedContest, createFinalizedContest, createLiveContest, createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("admin contest lifecycle actions", () => {
  beforeEach(resetContestCollections);

  it("releases answer key from ended contest", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createEndedContest({ createdBy: admin._id });
    const response = await request(app).post(`/api/admin/contests/${contest._id}/release-answer-key`).set("Cookie", authCookie(admin));
    expect(response.status).toBe(200);
    expect(response.body.lifecycle).toBe("answer_key_released");
  });

  it("opens and closes claims", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createAnswerKeyReleasedContest({ createdBy: admin._id });
    const open = await request(app).post(`/api/admin/contests/${contest._id}/open-claims`).set("Cookie", authCookie(admin));
    expect(open.status).toBe(200);
    expect(open.body.lifecycle).toBe("claims_open");
    const close = await request(app).post(`/api/admin/contests/${contest._id}/close-claims`).set("Cookie", authCookie(admin));
    expect(close.status).toBe(200);
    expect(close.body.lifecycle).toBe("claims_closed");
  });

  it("allows admin to start a published contest before scheduled start", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const startTime = new Date(Date.now() + 60 * 60_000);
    const endTime = new Date(Date.now() + 120 * 60_000);
    const contest = await createPublishedContest({ createdBy: admin._id, startTime, endTime });
    const response = await request(app)
      .put(`/api/admin/contests/${contest._id}`)
      .set("Cookie", authCookie(admin))
      .send({ lifecycle: "live", status: "approved" });
    expect(response.status).toBe(200);
    expect(response.body.lifecycle).toBe("live");
    expect(new Date(response.body.endTime).getTime()).toBe(endTime.getTime());
  });

  it("allows admin to end a live contest before scheduled end", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createLiveContest({ createdBy: admin._id });
    const response = await request(app)
      .put(`/api/admin/contests/${contest._id}`)
      .set("Cookie", authCookie(admin))
      .send({ lifecycle: "ended", status: "completed" });
    expect(response.status).toBe(200);
    expect(response.body.lifecycle).toBe("ended");
    expect(response.body.status).toBe("completed");
  });

  it("detects invalid draft to live transition", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createDraftContest({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}`).set("Cookie", authCookie(admin)).send({ lifecycle: "live", status: "approved" });
    expect(response.status).not.toBe(200);
  });

  it("detects invalid finalized to live transition", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createFinalizedContest({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}`).set("Cookie", authCookie(admin)).send({ lifecycle: "live", status: "approved" });
    expect(response.status).not.toBe(200);
  });

  it("detects invalid ratings_applied to claims_open transition", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createFinalizedContest({ createdBy: admin._id, lifecycle: "ratings_applied" } as any);
    contest.lifecycle = "ratings_applied";
    await contest.save();
    const response = await request(app).post(`/api/admin/contests/${contest._id}/open-claims`).set("Cookie", authCookie(admin));
    expect(response.status).not.toBe(200);
  });
});
