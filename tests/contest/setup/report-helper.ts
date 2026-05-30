export const CORRECTNESS_WEIGHTS = {
  lifecycle: 0.15,
  registration: 0.10,
  roomAccess: 0.10,
  submission: 0.15,
  scoring: 0.15,
  standings: 0.10,
  security: 0.10,
  claims: 0.05,
  rating: 0.05,
  performance: 0.05,
};

export function calculateCorrectnessScore(results: Record<keyof typeof CORRECTNESS_WEIGHTS, { passed: number; total: number }>) {
  return Object.entries(CORRECTNESS_WEIGHTS).reduce((score, [key, weight]) => {
    const result = results[key as keyof typeof CORRECTNESS_WEIGHTS];
    const ratio = result.total === 0 ? 0 : result.passed / result.total;
    return score + ratio * weight * 100;
  }, 0);
}
