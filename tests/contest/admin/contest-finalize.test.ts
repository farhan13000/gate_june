import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import Contest from "../../../backend/src/models/Contest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createEndedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("admin result finalization", () => {
  beforeEach(resetContestCollections);

  it("finalizes an unrated ended contest", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const contest = await createEndedContest({ createdBy: admin._id, ratingEnabled: false });
    const { result: response } = await measureApiTime("finalize result", PERFORMANCE_LIMITS.finalizeResult, () =>
      request(app).post(`/api/admin/contests/${contest._id}/finalize-ratings`).set("Cookie", authCookie(admin))
    );
    expect(response.status).toBe(200);
    const saved = await Contest.findById(contest._id).lean();
    expect(saved?.lifecycle).toBe("finalized");
    expect(response.body.rating).toMatchObject({ applied: false });
  });
});
