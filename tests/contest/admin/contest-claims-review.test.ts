import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import ContestClaim from "../../../backend/src/models/ContestClaim";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createClaimsOpenContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("admin claim review", () => {
  beforeEach(resetContestCollections);

  it("reviews, responds, and stores trace history", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const student = await createTestUser("student");
    const contest = await createClaimsOpenContest({ createdBy: admin._id });
    const claim = await ContestClaim.create({
      contestId: contest._id,
      questionId: contest.questions[0],
      userId: student._id,
      type: "answer_key",
      title: "Answer mismatch",
      description: "Please recheck.",
      statusHistory: [{ status: "open", note: "Created", performedBy: student._id, timestamp: new Date() }],
    });
    const response = await request(app).put(`/api/admin/contests/${contest._id}/claims/${claim._id}`).set("Cookie", authCookie(admin)).send({
      status: "accepted",
      adminResponse: "Accepted and will be recalculated.",
    });
    expect(response.status).toBe(200);
    const saved = await ContestClaim.findById(claim._id).lean();
    expect(saved?.status).toBe("accepted");
    expect(saved?.reviewedBy?.toString()).toBe(String(admin._id));
    expect(saved?.statusHistory).toHaveLength(2);
  });
});
