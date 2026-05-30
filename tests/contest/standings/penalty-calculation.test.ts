import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { recomputeAll, seedCheckedInUser, submitDirect } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createTestUser } from "../setup/test-users";

describe("penalty calculation", () => {
  beforeEach(resetContestCollections);

  it("adds accepted minute plus wrong attempts before correct", async () => {
    const user = await createTestUser();
    const q = await createMCQQuestion();
    const contest = await createLiveContest({ questions: [q._id], wrongPenaltyMinutes: 10 });
    await seedCheckedInUser(contest, user);
    await submitDirect(contest, user, q, {}, false, -0.66, new Date(contest.startTime.getTime() + 60_000));
    await submitDirect(contest, user, q, {}, true, 2, new Date(contest.startTime.getTime() + 5 * 60_000));
    await recomputeAll(contest, [user]);
    const standing = await ContestStanding.findOne({ contestId: contest._id, userId: user._id }).lean();
    expect(standing?.penaltyMinutes).toBe(15);
  });
});
