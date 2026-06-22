import { afterEach, describe, expect, it, vi } from "vitest";
import { isContestOpenForArena } from "../../../backend/src/utils/contestLifecycle";
import { getClockLifecycle } from "../../../backend/src/utils/contestLifecycleSync";

describe("scheduled contest lifecycle", () => {
  const start = Date.UTC(2030, 0, 1, 9, 0, 0);
  const end = start + 60 * 60_000;
  const scheduledContest = {
    lifecycle: "published",
    startTime: new Date(start),
    endTime: new Date(end),
  };

  afterEach(() => vi.useRealTimers());

  it("starts a published contest at its scheduled start time", () => {
    expect(getClockLifecycle(scheduledContest, start - 1)).toBe("published");
    expect(getClockLifecycle(scheduledContest, start)).toBe("live");
  });

  it("ends a scheduled contest at its end time even if it was never manually started", () => {
    expect(getClockLifecycle(scheduledContest, end)).toBe("ended");
  });

  it("does not accept arena activity before the scheduled start or after the end", () => {
    const contest = { ...scheduledContest, lifecycle: "live" };
    vi.useFakeTimers();

    vi.setSystemTime(start - 1);
    expect(isContestOpenForArena(contest)).toBe(false);

    vi.setSystemTime(start);
    expect(isContestOpenForArena(contest)).toBe(true);

    vi.setSystemTime(end);
    expect(isContestOpenForArena(contest)).toBe(false);
  });
});
