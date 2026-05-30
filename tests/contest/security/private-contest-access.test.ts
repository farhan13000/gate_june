import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("private contest access", () => {
  beforeEach(resetContestCollections);

  it("does not expose private contest in public list or detail", async () => {
    const contest = await createPublishedContest({ visibility: "private" });
    const list = await request(app).get("/api/contests");
    expect(list.body.find((item: any) => String(item._id) === String(contest._id))).toBeUndefined();
    const detail = await request(app).get(`/api/contests/${contest._id}`);
    expect(detail.status).toBe(404);
  });
});
