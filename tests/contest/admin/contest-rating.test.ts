import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import RatingHistory from "../../../backend/src/models/RatingHistory";
import User from "../../../backend/src/models/User";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { recomputeAll, seedCheckedInUser, submitDirect } from "../setup/lifecycle-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createEndedContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("admin contest rating", () => {
  beforeEach(resetContestCollections);

  it("previews and applies ratings once", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const q = await createMCQQuestion({ createdBy: admin._id });
    const contest = await createEndedContest({ createdBy: admin._id, questions: [q._id], ratingEnabled: true });
    const users = [await createTestUser("student", 1200), await createTestUser("student", 1300)];
    await seedCheckedInUser(contest, users[0]);
    await seedCheckedInUser(contest, users[1]);
    await submitDirect(contest, users[0], q, { mcqSelected: String(q.options![0]._id) }, true, 2);
    await submitDirect(contest, users[1], q, { mcqSelected: String(q.options![1]._id) }, false, -0.66);
    await recomputeAll(contest, users);

    const preview = await request(app).get(`/api/admin/contests/${contest._id}/rating-preview`).set("Cookie", authCookie(admin));
    expect(preview.status).toBe(200);
    expect(preview.body.canApply).toBe(true);
    const { result: applied } = await measureApiTime("rating apply", PERFORMANCE_LIMITS.ratingApply, () =>
      request(app).post(`/api/admin/contests/${contest._id}/finalize-ratings`).set("Cookie", authCookie(admin))
    );
    expect(applied.status).toBe(200);
    expect(await RatingHistory.countDocuments({ contestId: contest._id })).toBe(2);
    const updated = await User.findById(users[0]._id).lean();
    expect(updated?.rating).not.toBe(1200);
    const second = await request(app).post(`/api/admin/contests/${contest._id}/finalize-ratings`).set("Cookie", authCookie(admin));
    expect(second.body.rating.applied).toBe(false);
  });
});
