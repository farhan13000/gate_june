import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createFinalizedContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("finalized contest mutation security", () => {
  beforeEach(resetContestCollections);

  it("detects scoring mutation risk after finalization unless explicit admin override exists", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createFinalizedContest({ createdBy: admin._id });
    const q = await createMCQQuestion({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}/problems`).set("Cookie", authCookie(admin)).send({ questionIds: [String(q._id)] });
    expect(response.status).not.toBe(200); // Bug detector: backend currently permits this without override semantics.
  });
});
