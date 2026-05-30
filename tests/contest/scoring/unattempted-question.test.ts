import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { recomputeUserStanding, seedCheckedInUser } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createTestUser } from "../setup/test-users";

describe("unattempted question scoring", () => {
  beforeEach(resetContestCollections);

  it("keeps unattempted questions at zero marks", async () => {
    const user = await createTestUser();
    const contest = await createLiveContest();
    await seedCheckedInUser(contest, user);
    await recomputeUserStanding(contest, user._id);
    const standing = await ContestStanding.findOne({ contestId: contest._id, userId: user._id }).lean();
    expect(standing?.score).toBe(0);
    expect(standing?.problemStats[0].marksAwarded).toBe(0);
  });
});
