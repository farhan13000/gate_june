import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("user final submit", () => {
  beforeEach(resetContestCollections);

  it("locks attempt and prevents later mutation", async () => {
    const user = await createTestUser("student");
    const contest = await createLiveContest();
    await seedCheckedInUser(contest, user);
    const { result: finish } = await measureApiTime("final submit", PERFORMANCE_LIMITS.finalSubmit, () =>
      request(app).post(`/api/contests/${contest._id}/finish`).set("Cookie", authCookie(user))
    );
    expect(finish.status).toBe(200);
    const registration = await ContestRegistration.findOne({ contestId: contest._id, userId: user._id }).lean();
    expect(registration?.finishedAt).toBeTruthy();
  });
});
