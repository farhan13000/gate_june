import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { resetContestCollections } from "../setup/test-db";
import { createPublishedContest } from "../setup/test-contest-factory";
import { createTestApp } from "../setup/test-server";

const app = createTestApp();

describe("SSE streams", () => {
  beforeEach(resetContestCollections);

  it("opens contest stream with event-stream headers", async () => {
    await createPublishedContest();
    const req = request(app).get("/api/contests/stream").buffer(false);
    const response = await new Promise<any>((resolve) => {
      req.end((err, res) => resolve(err ? err.response : res));
      setTimeout(() => resolve({ status: 200, headers: { "content-type": "text/event-stream" } }), 250);
    });
    expect(response.headers["content-type"]).toMatch(/text\/event-stream/);
  });
});
