import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { authCookie } from "../setup/auth-helper";
import { recomputeAll, seedCheckedInUser, submitDirect } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createFrozenContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("frozen leaderboard", () => {
  beforeEach(resetContestCollections);

  it("public standings use frozen visible rank while admin can inspect actual", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion();
    const contest = await createFrozenContest({ questions: [q._id], freezeTime: new Date(Date.now() - 60_000) });
    await seedCheckedInUser(contest, user);
    await submitDirect(contest, user, q, {}, true, 2);
    await recomputeAll(contest, [user]);
    await ContestStanding.updateOne({ contestId: contest._id, userId: user._id }, { frozenRank: 99, frozenScore: 0, visibleRank: 99, visibleScore: 0 });
    const publicRes = await request(app).get(`/api/contests/${contest._id}/standings`).set("Cookie", authCookie(user));
    expect(publicRes.body.frozen).toBe(true);
    expect(publicRes.body.standings[0].rank).toBe(99);
    expect(publicRes.body.standings[0].score).toBe(0);
  });
});
