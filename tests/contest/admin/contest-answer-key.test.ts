import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createEndedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("admin answer key release", () => {
  beforeEach(resetContestCollections);

  it("changes lifecycle and release time", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createEndedContest({ createdBy: admin._id });
    const { result: response } = await measureApiTime("answer key release", PERFORMANCE_LIMITS.answerKeyRelease, () =>
      request(app).post(`/api/admin/contests/${contest._id}/release-answer-key`).set("Cookie", authCookie(admin))
    );
    expect(response.status).toBe(200);
    expect(response.body.lifecycle).toBe("answer_key_released");
    expect(response.body.answerKeyReleaseTime).toBeTruthy();
  });
});
