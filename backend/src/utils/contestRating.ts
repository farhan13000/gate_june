import ContestStanding from "../models/ContestStanding";
import ContestRegistration from "../models/ContestRegistration";
import RatingHistory from "../models/RatingHistory";
import User from "../models/User";
import Contest from "../models/Contest";
import { recomputeContestStandings } from "./contestScoring";

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function ratingK(rating: number, contestsPlayed: number) {
  if (contestsPlayed < 5) return 80;
  if (rating >= 2200) return 16;
  if (rating >= 1600) return 24;
  return 40;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function applyContestRatings(contestId: string) {
  const existing = await RatingHistory.countDocuments({ contestId });
  if (existing > 0) {
    return { applied: false, count: existing, message: "Ratings already applied" };
  }

  const contest = await Contest.findById(contestId);
  if (!contest) {
    return { applied: false, count: 0, message: "Contest not found" };
  }

  await recomputeContestStandings(contest);

  const preview = await previewContestRatings(contestId);
  if (!preview.canApply) {
    return { applied: false, count: preview.count, message: preview.message, changes: preview.changes };
  }

  for (const change of preview.changes) {
    await User.updateOne({ _id: change.userId }, { rating: change.newRating });
    await ContestRegistration.updateOne(
      { contestId, userId: change.userId },
      { ratingBefore: change.oldRating, ratingAfter: change.newRating }
    );
  }

  await RatingHistory.insertMany(
    preview.changes.map((change) => ({
      userId: change.userId,
      contestId,
      oldRating: change.oldRating,
      newRating: change.newRating,
      delta: change.delta,
      rank: change.rank,
      participants: preview.participants,
      performanceRating: change.performanceRating,
    })),
    { ordered: false }
  );

  return { applied: true, count: preview.changes.length, message: "Ratings applied", changes: preview.changes };
}

export async function previewContestRatings(contestId: string) {
  const existing = await RatingHistory.countDocuments({ contestId });
  if (existing > 0) {
    const histories = await RatingHistory.find({ contestId })
      .populate("userId", "fullName email")
      .sort({ rank: 1, createdAt: 1 })
      .lean();

    return {
      canApply: false,
      count: histories.length,
      participants: histories[0]?.participants || histories.length,
      alreadyApplied: true,
      message: "Ratings already applied",
      changes: histories.map((history: any) => ({
        userId: history.userId?._id || history.userId,
        fullName: history.userId?.fullName || "User",
        email: history.userId?.email || "",
        oldRating: history.oldRating,
        newRating: history.newRating,
        delta: history.delta,
        rank: history.rank,
        performanceRating: history.performanceRating,
      })),
    };
  }

  const standings = await ContestStanding.find({ contestId, disqualified: false })
    .populate("userId", "fullName email rating")
    .sort({ score: -1, penaltyMinutes: 1, solvedCount: -1, lastAcceptedAt: 1, updatedAt: 1 })
    .lean();

  if (standings.length === 0) {
    return {
      canApply: false,
      count: 0,
      participants: 0,
      alreadyApplied: existing > 0,
      message: "Finalized without rating changes",
      changes: [],
    };
  }

  let rank = 0;
  let previousKey = "";
  const users = [];
  for (let index = 0; index < standings.length; index += 1) {
    const standing: any = standings[index];
    const key = [
      standing.score,
      standing.penaltyMinutes,
      standing.solvedCount,
      standing.lastAcceptedAt ? new Date(standing.lastAcceptedAt).getTime() : 0,
    ].join(":");
    if (key !== previousKey) rank = index + 1;
    previousKey = key;
    users.push({
      userId: standing.userId._id,
      fullName: standing.userId.fullName || "User",
      email: standing.userId.email || "",
      oldRating: Number(standing.userId.rating || 0),
      rank,
    });
  }

  const changes = [];
  for (const user of users) {
    let actual = 0;
    let expected = 0;
    for (const opponent of users) {
      if (String(opponent.userId) === String(user.userId)) continue;
      actual += user.rank < opponent.rank ? 1 : user.rank === opponent.rank ? 0.5 : 0;
      expected += expectedScore(user.oldRating, opponent.oldRating);
    }

    const contestsPlayed = await RatingHistory.countDocuments({ userId: user.userId });
    const k = ratingK(user.oldRating, contestsPlayed);
    const rawDelta = Math.round(k * (actual - expected));
    const delta = clamp(rawDelta, -150, 150);
    const newRating = Math.max(0, user.oldRating + delta);

    changes.push({
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      oldRating: user.oldRating,
      newRating,
      delta,
      rank: user.rank,
      performanceRating: user.oldRating + Math.round((actual - expected) * 400),
    });
  }

  return {
    canApply: existing === 0,
    count: changes.length,
    participants: users.length,
    alreadyApplied: existing > 0,
    message: existing > 0 ? "Ratings already applied" : "Ratings ready",
    changes,
  };
}
