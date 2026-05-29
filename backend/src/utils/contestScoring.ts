import ContestRegistration from "../models/ContestRegistration";
import ContestStanding from "../models/ContestStanding";
import ContestSubmission from "../models/ContestSubmission";

function rankKey(standing: any) {
  return [
    Number(standing.score || 0),
    Number(standing.penaltyMinutes || 0),
    Number(standing.solvedCount || 0),
    standing.lastAcceptedAt ? new Date(standing.lastAcceptedAt).getTime() : 0,
  ].join(":");
}

export async function getEligibleContestUserIds(contestId: any) {
  const [registrations, submitterIds, standingUserIds] = await Promise.all([
    ContestRegistration.find({
      contestId,
      status: { $nin: ["withdrawn", "disqualified"] },
      $or: [
        { status: "checked_in" },
        { startedAt: { $exists: true, $ne: null } },
        { finishedAt: { $exists: true, $ne: null } },
      ],
    })
      .select("userId")
      .lean(),
    ContestSubmission.distinct("userId", { contestId }),
    ContestStanding.distinct("userId", { contestId, disqualified: false }),
  ]);

  return Array.from(
    new Set([
      ...registrations.map((registration: any) => String(registration.userId)),
      ...submitterIds.map((userId: any) => String(userId)),
      ...standingUserIds.map((userId: any) => String(userId)),
    ])
  ).filter(Boolean);
}

export async function recomputeUserStanding(contest: any, userId: any) {
  const submissions = await ContestSubmission.find({ contestId: contest._id, userId })
    .sort({ submittedAt: 1 })
    .lean();
  const latestByQuestion = new Map<string, any>();
  for (const submission of submissions) {
    latestByQuestion.set(String(submission.questionId), submission);
  }

  const problemStats = [];
  let score = 0;
  let solvedCount = 0;
  let wrongAttempts = 0;
  let penaltyMinutes = 0;
  let lastAcceptedAt: Date | undefined;

  for (const questionId of (contest.questions || []).map((id: any) => String(id))) {
    const questionSubs = submissions.filter((submission) => String(submission.questionId) === questionId);
    const latest = latestByQuestion.get(questionId);
    const isSolved = Boolean(latest?.isCorrect);
    const wrongForQuestion = latest ? questionSubs.filter((submission) => !submission.isCorrect).length : 0;

    if (isSolved) {
      solvedCount += 1;
      score += latest.marksAwarded;
      wrongAttempts += wrongForQuestion;
      const acceptedAt = new Date(latest.submittedAt);
      const minutesFromStart = Math.max(
        0,
        Math.ceil((acceptedAt.getTime() - new Date(contest.startTime).getTime()) / 60000)
      );
      penaltyMinutes += minutesFromStart + wrongForQuestion * (contest.wrongPenaltyMinutes || 0);
      lastAcceptedAt = !lastAcceptedAt || acceptedAt > lastAcceptedAt ? acceptedAt : lastAcceptedAt;
    } else if (latest) {
      score += latest.marksAwarded;
      wrongAttempts += wrongForQuestion;
    }

    problemStats.push({
      questionId,
      attempts: questionSubs.length,
      isCorrect: isSolved,
      marksAwarded: latest?.marksAwarded ?? 0,
      solvedAt: isSolved ? latest.submittedAt : undefined,
    });
  }

  return ContestStanding.findOneAndUpdate(
    { contestId: contest._id, userId },
    {
      contestId: contest._id,
      userId,
      score,
      solvedCount,
      wrongAttempts,
      penaltyMinutes,
      lastAcceptedAt,
      visibleScore: score,
      problemStats,
    },
    { new: true, upsert: true }
  );
}

export async function recomputeContestRanks(contestId: any) {
  const standings = await ContestStanding.find({ contestId, disqualified: false })
    .sort({ score: -1, penaltyMinutes: 1, solvedCount: -1, lastAcceptedAt: 1, updatedAt: 1 })
    .lean();

  let rank = 0;
  let previousKey = "";
  for (let index = 0; index < standings.length; index += 1) {
    const standing = standings[index];
    const key = rankKey(standing);
    if (key !== previousKey) rank = index + 1;
    previousKey = key;
    await ContestStanding.updateOne(
      { _id: standing._id },
      { rank, visibleRank: standing.frozenRank || rank, visibleScore: standing.frozenScore ?? standing.score }
    );
  }
}

export async function recomputeContestStandings(contest: any) {
  const userIds = await getEligibleContestUserIds(contest._id);
  for (const userId of userIds) {
    await recomputeUserStanding(contest, userId);
  }
  await recomputeContestRanks(contest._id);
  return userIds.length;
}

