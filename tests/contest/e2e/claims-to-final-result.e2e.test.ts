import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestClaim from "../../../backend/src/models/ContestClaim";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createClaimsOpenContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("E2E claims to final result", () => {
  beforeEach(resetContestCollections);

  it("user claims, admin resolves, admin finalizes", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const user = await createTestUser();
    const contest = await createClaimsOpenContest({ createdBy: admin._id });
    const claimResponse = await request(app).post(`/api/contests/${contest._id}/claims`).set("Cookie", authCookie(user)).send({
      questionId: contest.questions[0],
      type: "answer_key",
      title: "Claim",
      description: "Check official key.",
    });
    expect(claimResponse.status).toBe(201);
    const review = await request(app).put(`/api/admin/contests/${contest._id}/claims/${claimResponse.body._id}`).set("Cookie", authCookie(admin)).send({ status: "accepted", adminResponse: "Accepted." });
    expect(review.body.status).toBe("accepted");
    const claim = await ContestClaim.findById(claimResponse.body._id).lean();
    expect(claim?.statusHistory.length).toBe(2);
    await request(app).post(`/api/admin/contests/${contest._id}/close-claims`).set("Cookie", authCookie(admin));
    const final = await request(app).post(`/api/admin/contests/${contest._id}/finalize-ratings`).set("Cookie", authCookie(admin));
    expect(final.status).toBe(200);
  });
});
