import request from "supertest";
import { beforeEach, describe, it } from "vitest";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("answer submit latency", () => {
  beforeEach(resetContestCollections);

  it("submits answer within latency threshold", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion();
    const contest = await createLiveContest({ questions: [q._id] });
    await seedCheckedInUser(contest, user);
    await measureApiTime("answer submit", PERFORMANCE_LIMITS.answerSubmit, () =>
      request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ mcqSelected: q.options![0]._id })
    );
  });
});
