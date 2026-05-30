import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import Contest from "../../../backend/src/models/Contest";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import { authCookie, createAuthedAgent } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("admin contest deletion", () => {
  beforeEach(resetContestCollections);

  it("deletes inactive contest and requires force for active contest", async () => {
    const { user: admin } = await createAuthedAgent(app, "admin");
    const inactive = await createPublishedContest({ createdBy: admin._id });
    const deleted = await request(app).delete(`/api/admin/contests/${inactive._id}`).set("Cookie", authCookie(admin));
    expect(deleted.status).toBe(200);
    expect(await Contest.findById(inactive._id)).toBeNull();

    const active = await createPublishedContest({ createdBy: admin._id });
    const student = await createTestUser("student");
    await ContestRegistration.create({ contestId: active._id, userId: student._id });
    const blocked = await request(app).delete(`/api/admin/contests/${active._id}`).set("Cookie", authCookie(admin));
    expect(blocked.status).toBe(409);
    const forced = await request(app).delete(`/api/admin/contests/${active._id}?force=true`).set("Cookie", authCookie(admin));
    expect(forced.status).toBe(200);
  });
});
