import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestClaim from "../../../backend/src/models/ContestClaim";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie } from "../setup/auth-helper";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createAnswerKeyReleasedContest, createClaimsOpenContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("user claims", () => {
  beforeEach(resetContestCollections);

  it("submits claim only during claims window and stores trace", async () => {
    const user = await createTestUser("student");
    const contest = await createClaimsOpenContest();
    await ContestRegistration.create({ contestId: contest._id, userId: user._id, status: "checked_in" });
    const { result: response } = await measureApiTime("claim submit", PERFORMANCE_LIMITS.claimSubmit, () =>
      request(app).post(`/api/contests/${contest._id}/claims`).set("Cookie", authCookie(user)).send({
        questionId: contest.questions[0],
        type: "answer_key",
        title: "Please recheck answer",
        description: "The official answer appears inconsistent.",
      })
    );
    expect(response.status).toBe(201);
    const saved = await ContestClaim.findById(response.body._id).lean();
    expect(saved?.contestLifecycleAtCreate).toBe("claims_open");
    expect(saved?.statusHistory).toHaveLength(1);
  });

  it("rejects claim before claims window", async () => {
    const user = await createTestUser("student");
    const contest = await createAnswerKeyReleasedContest();
    const response = await request(app).post(`/api/contests/${contest._id}/claims`).set("Cookie", authCookie(user)).send({ type: "answer_key", title: "x", description: "y" });
    expect(response.status).toBe(400);
  });
});
