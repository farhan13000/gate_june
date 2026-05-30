import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMSQQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("MSQ scoring", () => {
  beforeEach(resetContestCollections);

  it("requires exact option set; partial and extra sets are wrong", async () => {
    const user = await createTestUser();
    const q = await createMSQQuestion({ markingScheme: { positive: 3, negative: 1 } });
    const contest = await createLiveContest({ questions: [q._id] });
    await seedCheckedInUser(contest, user);
    const correctIds = q.options!.filter((o) => o.isCorrect).map((o: any) => String(o._id));
    const exact = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ msqSelected: correctIds });
    expect(exact.body.submission.isCorrect).toBe(true);
    const partial = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ msqSelected: [correctIds[0]] });
    expect(partial.body.submission.isCorrect).toBe(false);
    const extra = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ msqSelected: [...correctIds, String(q.options![2]._id)] });
    expect(extra.body.submission.isCorrect).toBe(false);
  });
});
