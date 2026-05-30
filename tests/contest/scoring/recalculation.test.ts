import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { recomputeAll, seedCheckedInUser, submitDirect } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestUser } from "../setup/test-users";

describe("standing recalculation", () => {
  beforeEach(resetContestCollections);

  it("recomputes standings from persisted submissions", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion();
    const contest = await createLiveContest({ questions: [q._id] });
    await seedCheckedInUser(contest, user);
    await submitDirect(contest, user, q, { mcqSelected: String(q.options![0]._id) }, true, 2);
    await recomputeAll(contest, [user]);
    const standing = await ContestStanding.findOne({ contestId: contest._id, userId: user._id }).lean();
    expect(standing?.rank).toBe(1);
    expect(standing?.score).toBe(2);
  });
});
