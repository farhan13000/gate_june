import Contest from "../models/Contest";
import { getContestRegistrationEndMs, getContestRegistrationStartMs } from "./contestLifecycle";
import { invalidateHomeCache } from "./homeCache";

const TERMINAL_STATES = new Set(["draft", "finalized", "ratings_applied"]);
const ORDER: Record<string, number> = {
  draft: 0,
  published: 1,
  registration_open: 2,
  live: 3,
  frozen: 4,
  ended: 5,
  answer_key_released: 6,
  claims_open: 7,
  claims_closed: 8,
  finalized: 9,
  ratings_applied: 10,
};

function timeValue(value?: Date | string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function getClockLifecycle(contest: any, now = Date.now()) {
  const current = contest.lifecycle || "published";
  if (TERMINAL_STATES.has(current)) return current;

  const start = timeValue(contest.startTime);
  const end = timeValue(contest.endTime);
  const regStart = getContestRegistrationStartMs(contest);
  const regEnd = getContestRegistrationEndMs(contest);
  const freeze = timeValue(contest.freezeTime);
  const answerKey = timeValue(contest.answerKeyReleaseTime);
  const claimsOpen = timeValue(contest.claimsOpenTime);
  const claimsClose = timeValue(contest.claimsCloseTime);

  let target = current;

  // The contest clock owns the live window. A published contest enters the
  // arena at its scheduled start, and every non-terminal contest closes at
  // its scheduled end even if nobody visits the contest page at that moment.
  if (end !== null && now >= end && (ORDER[current] || 0) < ORDER.ended) {
    target = "ended";
  } else if (["published", "registration_open"].includes(current) && start !== null && now >= start) {
    target = "live";
  } else if (current === "published" && regStart !== null && now >= regStart && (regEnd === null || now < regEnd)) {
    target = "registration_open";
  }

  if (target === "live" && freeze !== null && now >= freeze && end !== null && now < end) target = "frozen";
  if ((ORDER[target] || 0) >= ORDER.ended && answerKey !== null && now >= answerKey) target = "answer_key_released";
  if ((ORDER[target] || 0) >= ORDER.answer_key_released && claimsOpen !== null && now >= claimsOpen) target = "claims_open";
  if ((ORDER[target] || 0) >= ORDER.claims_open && claimsClose !== null && now >= claimsClose) target = "claims_closed";

  return (ORDER[target] || 0) > (ORDER[current] || 0) ? target : current;
}

export async function syncContestLifecycle(contest: any, now = Date.now()) {
  const nextLifecycle = getClockLifecycle(contest, now);
  const previousLifecycle = contest.lifecycle;
  if (nextLifecycle === previousLifecycle) {
    return { changed: false, previousLifecycle, lifecycle: previousLifecycle };
  }

  contest.lifecycle = nextLifecycle;
  if (nextLifecycle === "ended" || ORDER[nextLifecycle] >= ORDER.finalized) {
    contest.status = "completed";
  }
  await contest.save();
  invalidateHomeCache();

  return { changed: true, previousLifecycle, lifecycle: nextLifecycle };
}

export async function syncContestLifecycleById(contestId: any, now = Date.now()) {
  const contest = await Contest.findById(contestId);
  if (!contest) return null;
  await syncContestLifecycle(contest, now);
  return contest;
}

export async function syncDueContestLifecycles(now = Date.now()) {
  const contests = await Contest.find({
    lifecycle: { $nin: ["draft", "finalized", "ratings_applied"] },
    status: { $in: ["approved", "completed"] },
  }).limit(200);

  let changed = 0;
  for (const contest of contests) {
    const result = await syncContestLifecycle(contest, now);
    if (result.changed) changed += 1;
  }

  return { checked: contests.length, changed };
}

export function startContestLifecycleSync(intervalMs = 1000) {
  const run = () => {
    syncDueContestLifecycles().catch((error) => {
      console.error("Contest lifecycle sync failed:", error);
    });
  };

  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return timer;
}
