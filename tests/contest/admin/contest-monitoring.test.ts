import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { seedCheckedInUser, submitDirect, recomputeAll } from "../setup/lifecycle-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("admin contest monitoring", () => {
  beforeEach(resetContestCollections);

  it("shows registrations, responses, and standings for admin", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const user = await createTestUser("student");
    const question = await createMCQQuestion({ createdBy: admin._id });
    const contest = await createLiveContest({ createdBy: admin._id, questions: [question._id] });
    await seedCheckedInUser(contest, user);
    await submitDirect(contest, user, question, { mcqSelected: String(question.options![0]._id) });
    await recomputeAll(contest, [user]);
    const { result: response } = await measureApiTime("admin standings", PERFORMANCE_LIMITS.standings, () =>
      request(app).get(`/api/admin/contests/${contest._id}/standings`).set("Cookie", authCookie(admin))
    );
    expect(response.status).toBe(200);
    expect(response.body.standings[0]).toMatchObject({ score: 2, solvedCount: 1 });
    expect(response.body.standings[0].responses).toHaveLength(1);
  });
});
