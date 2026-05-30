import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie } from "../setup/auth-helper";
import { seedCheckedInUser } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createNATQuestion } from "../setup/test-question-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("NAT scoring", () => {
  beforeEach(resetContestCollections);

  it("accepts exact, whitespace, equivalent decimals, and tolerance within 1e-4", async () => {
    const user = await createTestUser();
    const q = await createNATQuestion({ solution: { finalAnswer: "3.1416" }, markingScheme: { positive: 2, negative: 0 } });
    const contest = await createLiveContest({ questions: [q._id] });
    await seedCheckedInUser(contest, user);
    for (const answer of ["3.1416", " 3.1416 ", "3.14160", "3.14161"]) {
      const response = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ natAnswer: answer });
      expect(response.body.submission.isCorrect).toBe(true);
    }
    const outside = await request(app).post(`/api/contests/${contest._id}/questions/${q._id}/submit`).set("Cookie", authCookie(user)).send({ natAnswer: "3.142" });
    expect(outside.body.submission.isCorrect).toBe(false);
  });
});
