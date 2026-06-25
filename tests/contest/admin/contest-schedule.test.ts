import { afterEach, describe, expect, it, vi } from "vitest";
import { REGISTRATION_CLOSE_BUFFER_MS, getContestState, isContestOpenForArena, isContestOpenForRegistration } from "../../../backend/src/utils/contestLifecycle";
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

  it("opens registration before start and starts a published contest at its scheduled start time", () => {
    expect(getClockLifecycle(scheduledContest, start - 1)).toBe("registration_open");
    expect(getClockLifecycle(scheduledContest, start)).toBe("live");
  });

  it("ends a scheduled contest at its end time even if it was never manually started", () => {
    expect(getClockLifecycle(scheduledContest, end)).toBe("ended");
  });

  it("does not accept arena activity before the scheduled start or after the end", () => {
    const publishedContest = { ...scheduledContest, lifecycle: "published" };
    const liveContest = { ...scheduledContest, lifecycle: "live" };
    vi.useFakeTimers();

    vi.setSystemTime(start - 1);
    expect(isContestOpenForArena(publishedContest)).toBe(false);

    vi.setSystemTime(start);
    expect(isContestOpenForArena(liveContest)).toBe(true);

    vi.setSystemTime(end);
    expect(isContestOpenForArena(liveContest)).toBe(false);
  });

  it("lets an admin-started contest open the arena before scheduled start", () => {
    const contest = { ...scheduledContest, lifecycle: "live" };
    vi.useFakeTimers();

    vi.setSystemTime(start - 30 * 60_000);
    expect(getContestState(contest)).toBe("live");
    expect(isContestOpenForArena(contest)).toBe(true);
  });

  it("keeps registration open until five minutes before contest end", () => {
    const contest = {
      ...scheduledContest,
      lifecycle: "live",
      registrationStartTime: new Date(start - 7 * 24 * 60 * 60_000),
      registrationEndTime: new Date(end - REGISTRATION_CLOSE_BUFFER_MS),
    };
    vi.useFakeTimers();

    vi.setSystemTime(start + 10 * 60_000);
    expect(isContestOpenForRegistration(contest)).toBe(true);

    vi.setSystemTime(end - REGISTRATION_CLOSE_BUFFER_MS);
    expect(isContestOpenForRegistration(contest)).toBe(false);
  });
});
