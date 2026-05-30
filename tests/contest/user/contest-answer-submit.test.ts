import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestSubmission from "../../../backend/src/models/ContestSubmission";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("user answer submission", () => {
  beforeEach(resetContestCollections);

  it("submits MCQ and persists judged submission", async () => {
    const user = await createTestUser("student");
    const question = await createMCQQuestion();
    const contest = await createLiveContest({ questions: [question._id] });
    await seedCheckedInUser(contest, user);
    const { result: response } = await measureApiTime("answer submit", PERFORMANCE_LIMITS.answerSubmit, () =>
      request(app).post(`/api/contests/${contest._id}/questions/${question._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: question.options![0]._id })
    );
    expect(response.status).toBe(201);
    expect(response.body.submission.isCorrect).toBe(true);
    expect(await ContestSubmission.countDocuments({ contestId: contest._id, userId: user._id })).toBe(1);
  });
});
