import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { LIFECYCLE_STATES } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createDraftContest, createFinalizedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("admin contest publish lifecycle", () => {
  beforeEach(resetContestCollections);

  it("supports all declared lifecycle state labels in fixtures", () => {
    expect(LIFECYCLE_STATES).toEqual([
      "draft", "published", "registration_open", "live", "frozen", "ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied",
    ]);
  });

  it("publishes a draft contest", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createDraftContest({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}`).set("Cookie", authCookie(admin)).send({
      lifecycle: "published",
      status: "approved",
    });
    expect(response.status).toBe(200);
    expect(response.body.lifecycle).toBe("published");
  });

  it("detects missing lifecycle guards for finalized to live transition", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createFinalizedContest({ createdBy: admin._id });
    const response = await request(app).put(`/api/admin/contests/${contest._id}`).set("Cookie", authCookie(admin)).send({ lifecycle: "live", status: "approved" });
    expect(response.status).not.toBe(200); // Bug detector: current implementation may allow this.
  });
});
