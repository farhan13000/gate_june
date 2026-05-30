import { beforeEach, describe, expect, it } from "vitest";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import { recomputeAll, seedCheckedInUser, submitDirect } from "../setup/lifecycle-helper";
import { resetContestCollections } from "../setup/test-db";
import { createLiveContest } from "../setup/test-contest-factory";
import { createMCQQuestion } from "../setup/test-question-factory";
import { createManyStudents } from "../setup/test-users";

describe("ranking rules", () => {
  beforeEach(resetContestCollections);

  it("ranks higher score first", async () => {
    const q = await createMCQQuestion();
    const contest = await createLiveContest({ questions: [q._id] });
    const [a, b] = await createManyStudents(2);
    await seedCheckedInUser(contest, a);
    await seedCheckedInUser(contest, b);
    await submitDirect(contest, a, q, {}, true, 2);
    await submitDirect(contest, b, q, {}, false, -0.66);
    await recomputeAll(contest, [a, b]);
    const rows = await ContestStanding.find({ contestId: contest._id }).sort({ rank: 1 }).lean();
    expect(String(rows[0].userId)).toBe(String(a._id));
  });
});
