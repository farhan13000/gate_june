import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { recomputeAll, seedCheckedInUser, submitDirect } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createManyStudents } from "../setup/test-users";

describe("ranking tie breakers", () => {
  beforeEach(resetContestCollections);

  it("exposes configured order: score, lower penalty, solved count, earlier accepted", async () => {
    const q = await createMCQQuestion();
    const contest = await createLiveContest({ questions: [q._id], wrongPenaltyMinutes: 10 });
    const [fast, slow] = await createManyStudents(2);
    await seedCheckedInUser(contest, fast);
    await seedCheckedInUser(contest, slow);
    await submitDirect(contest, fast, q, {}, true, 2, new Date(contest.startTime.getTime() + 60_000));
    await submitDirect(contest, slow, q, {}, true, 2, new Date(contest.startTime.getTime() + 10 * 60_000));
    await recomputeAll(contest, [fast, slow]);
    const rows = await ContestStanding.find({ contestId: contest._id }).sort({ rank: 1 }).lean();
    expect(String(rows[0].userId)).toBe(String(fast._id));
    expect(rows[0].penaltyMinutes).toBeLessThan(rows[1].penaltyMinutes);
  });
});
