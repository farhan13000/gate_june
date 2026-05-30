import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import RatingHistory from "../../../backend/src/models/RatingHistory";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { seedCheckedInUser, submitDirect, recomputeAll } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createEndedContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createManyStudents } from "../setup/test-users";

const app = createTestApp();

describe("E2E rated contest flow", () => {
  beforeEach(resetContestCollections);

  it("previews, applies, and prevents duplicate rating history", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const q = await createMCQQuestion({ createdBy: admin._id });
    const contest = await createEndedContest({ createdBy: admin._id, questions: [q._id], ratingEnabled: true });
    const users = await createManyStudents(2, 1200);
    for (const user of users) await seedCheckedInUser(contest, user);
    await submitDirect(contest, users[0], q, {}, true, 2);
    await submitDirect(contest, users[1], q, {}, false, -0.66);
    await recomputeAll(contest, users);
    expect((await request(app).get(`/api/admin/contests/${contest._id}/rating-preview`).set("Cookie", authCookie(admin))).body.canApply).toBe(true);
    expect((await request(app).post(`/api/admin/contests/${contest._id}/finalize-ratings`).set("Cookie", authCookie(admin))).status).toBe(200);
    expect(await RatingHistory.countDocuments({ contestId: contest._id })).toBe(2);
    await request(app).post(`/api/admin/contests/${contest._id}/finalize-ratings`).set("Cookie", authCookie(admin));
    expect(await RatingHistory.countDocuments({ contestId: contest._id })).toBe(2);
  });
});
