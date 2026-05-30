export const DEFAULT_CONTEST_RATING = 1200;

export function normalizeContestRating(value?: number | null) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating > 0 ? rating : DEFAULT_CONTEST_RATING;
}
