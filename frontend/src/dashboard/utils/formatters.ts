export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatSeconds(seconds: number) {
  if (!Number.isFinite(seconds)) return "0s";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

export function clampMetric(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}
