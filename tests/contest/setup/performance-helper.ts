import { expect } from "vitest";

export const PERFORMANCE_LIMITS = {
  contestList: 300,
  contestDetails: 300,
  register: 500,
  checkIn: 500,
  roomLoad: 800,
  answerSubmit: 400,
  finalSubmit: 800,
  standings: 1000,
  recomputeStandings: 2000,
  answerKeyRelease: 1000,
  claimSubmit: 500,
  finalizeResult: 2000,
  ratingApply: 3000,
};

export async function measureApiTime<T>(
  label: string,
  limitMs: number,
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;

  if (durationMs > limitMs) {
    console.warn(`[SLOW API] ${label}: ${durationMs.toFixed(2)}ms > ${limitMs}ms`);
  }

  expect(durationMs).toBeLessThan(limitMs);
  return { result, durationMs };
}

export function expectJsonResponse(response: any, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers["content-type"]).toMatch(/json/);
  expect(response.body).toBeDefined();
}
