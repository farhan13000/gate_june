import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { authCookie } from "../setup/auth-helper";
import { resetContestCollections } from "../setup/test-db";
import { createTestApp } from "../setup/test-server";
import { createTestUser } from "../setup/test-users";

const app = createTestApp();

describe("role permission", () => {
  beforeEach(resetContestCollections);

  it("student cannot access admin contest APIs", async () => {
    const student = await createTestUser("student");
    const response = await request(app).get("/api/admin/contests").set("Cookie", authCookie(student));
    expect(response.status).toBe(403);
  });
});
