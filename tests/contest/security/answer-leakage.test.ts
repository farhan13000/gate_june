import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("answer leakage security", () => {
  beforeEach(resetContestCollections);

  it("hides correct option flags and editorial before answer key release", async () => {
    const user = await createTestUser();
    const contest = await createLiveContest();
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in" });
    const response = await request(app).get(`/api/contests/${contest._id}/room`).set("Cookie", authCookie(user));
    expect(response.body.canReveal).toBe(false);
    expect(JSON.stringify(response.body.contest.questions)).not.toContain("isCorrect");
    expect(JSON.stringify(response.body.contest.questions)).not.toContain("solution");
  });
});
