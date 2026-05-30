import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("MCQ scoring", () => {
  beforeEach(resetContestCollections);

  it("awards positive marks for correct and negative for wrong option", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion({ markingScheme: { positive: 2, negative: 0.66 } });
    const contest = await createLiveContest({ questions: [q._id] });
    await seedCheckedInUser(contest, user);
    const correct = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![0]._id });
    expect(correct.body.submission).toMatchObject({ isCorrect: true, marksAwarded: 2 });
    const wrong = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![1]._id });
    expect(wrong.body.submission).toMatchObject({ isCorrect: false, marksAwarded: -0.66 });
  });
});
