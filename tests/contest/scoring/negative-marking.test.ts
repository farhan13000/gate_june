import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createNegativeMarkingQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("negative marking", () => {
  beforeEach(resetContestCollections);

  it("applies configured negative marks for wrong answers", async () => {
    const user = await createTestUser();
    const q = await createNegativeMarkingQuestion();
    const contest = await createLiveContest({ questions: [q._id] });
    await seedCheckedInUser(contest, user);
    const response = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![1]._id });
    expect(response.body.submission.marksAwarded).toBe(-0.66);
  });
});
