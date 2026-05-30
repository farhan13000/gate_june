import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("latest answer scoring", () => {
  beforeEach(resetContestCollections);

  it("uses latest saved response for standing score", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion({ markingScheme: { positive: 2, negative: 1 } });
    const contest = await createLiveContest({ questions: [q._id] });
    await seedCheckedInUser(contest, user);
    await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![1]._id });
    await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![0]._id });
    const standing = await ContestStanding.findOne({ contestId: contest._id, userId: user._id }).lean();
    expect(standing?.score).toBe(2);
    expect(standing?.solvedCount).toBe(1);
  });
});
