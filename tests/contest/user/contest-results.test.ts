import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createFinalizedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("user contest results", () => {
  beforeEach(resetContestCollections);

  it("loads final standings/result view for participant", async () => {
    const user = await createTestUser("student");
    const contest = await createFinalizedContest();
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in" });
    const response = await request(app).get(`/api/contests/${contest._id}/room`).set("Cookie", authCookie(user));
    expect(response.status).toBe(200);
    expect(response.body.canReveal).toBe(true);
    expect(response.body.claimsOpen).toBe(false);
  });
});
