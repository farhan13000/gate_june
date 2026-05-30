import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createApprovedQuestion, createUnapprovedQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("admin contest problem selection", () => {
  beforeEach(resetContestCollections);

  it("attaches only approved questions", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createPublishedContest({ createdBy: admin._id, questions: [] });
    const approved = await createApprovedQuestion({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}/problems`).set("Cookie", authCookie(admin)).send({ questionIds: [String(approved._id)] });
    expect(response.status).toBe(200);
    expect(response.body.questions).toHaveLength(1);
  });

  it("rejects unapproved question attachment", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createPublishedContest({ createdBy: admin._id, questions: [] });
    const unapproved = await createUnapprovedQuestion({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}/problems`).set("Cookie", authCookie(admin)).send({ questionIds: [String(unapproved._id)] });
    expect(response.status).toBe(400);
  });
});
