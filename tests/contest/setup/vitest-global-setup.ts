import { afterAll, beforeAll, beforeEach } from "vitest";
import { connectTestDb, disconnectTestDb, resetContestCollections } from "./test-db";

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "contest-test-secret";
  await connectTestDb();
});

beforeEach(async () => {
  await resetContestCollections();
});

afterAll(async () => {
  await disconnectTestDb();
});
