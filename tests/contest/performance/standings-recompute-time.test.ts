import { beforeEach, describe, it } from "vitest";
import { recomputeContestStandings } from "../../../backend/src/utils/contestScoring";
import { measureApiTime, PERFORMANCE_LIMITS } from "../setup/performance-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";

describe("standings recompute performance", () => {
  beforeEach(resetContestCollections);

  it("recomputes standings within threshold", async () => {
    const contest = await createLiveContest();
    await measureApiTime("recompute standings", PERFORMANCE_LIMITS.recomputeStandings, () => recomputeContestStandings(contest));
  });
});
