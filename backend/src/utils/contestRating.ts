import ContestStanding from "../models/ContestStanding";
import RatingHistory from "../models/RatingHistory";
import User from "../models/User";

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

  const standings = await ContestStanding.find({ contestId, disqualified: false })
    .populate("userId", "rating")
    .sort({ rank: 1 })
    .lean();

  if (standings.length < 2) {
    return { applied: false, count: 0, message: "At least two participants are required" };
  }

  const users = standings.map((standing: any) => ({
    userId: standing.userId._id,
    oldRating: Number(standing.userId.rating || 0),
    rank: Number(standing.rank || standings.length),
  }));

  const histories = [];
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

    await User.updateOne({ _id: user.userId }, { rating: newRating });
    histories.push({
      userId: user.userId,
      contestId,
      oldRating: user.oldRating,
      newRating,
      delta,
      rank: user.rank,
      participants: users.length,
      performanceRating: user.oldRating + Math.round((actual - expected) * 400),
    });
  }

  await RatingHistory.insertMany(histories, { ordered: false });
  return { applied: true, count: histories.length, message: "Ratings applied" };
}
