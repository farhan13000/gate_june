import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { recomputeAll, seedCheckedInUser, submitDirect } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createFrozenContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("public vs admin standings", () => {
  beforeEach(resetContestCollections);

  it("admin standings expose response details while public standings do not", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const user = await createTestUser();
    const q = await createMCQQuestion({ createdBy: admin._id });
    const contest = await createFrozenContest({ createdBy: admin._id, questions: [q._id], freezeTime: new Date(Date.now() - 60_000) });
    await seedCheckedInUser(contest, user);
    await submitDirect(contest, user, q, {}, true, 2);
    await recomputeAll(contest, [user]);
    await ContestStanding.updateOne({ contestId: contest._id, userId: user._id }, { frozenRank: 10, frozenScore: 0 });
    const publicRes = await request(app).get(`/api/contests/${contest._id}/standings`).set("Cookie", authCookie(user));
    const adminRes = await request(app).get(`/api/admin/contests/${contest._id}/standings`).set("Cookie", authCookie(admin));
    expect(publicRes.body.standings[0]).not.toHaveProperty("responses");
    expect(adminRes.body.standings[0].responses).toHaveLength(1);
  });
});
