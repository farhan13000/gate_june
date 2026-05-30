const RELEASED_STATES = [
  "answer_key_released",
  "claims_open",
  "claims_closed",
  "finalized",
  "ratings_applied",
];

export function getContestState(contest: any) {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  const regStart = contest.registrationStartTime ? new Date(contest.registrationStartTime).getTime() : start;
  const regEnd = contest.registrationEndTime ? new Date(contest.registrationEndTime).getTime() : start;
  const lifecycle = contest.lifecycle;

  if ([...RELEASED_STATES, "ended"].includes(lifecycle)) return lifecycle;
  if (now >= end) return "ended";
  if (["live", "frozen"].includes(lifecycle)) return lifecycle;
  if (lifecycle === "registration_open" || (now >= regStart && now < regEnd)) return "registration_open";
  return "upcoming";
}

export function isContestOpenForArena(contest: any) {
  return ["live", "frozen"].includes(contest.lifecycle) && Date.now() < new Date(contest.endTime).getTime();
}

export function isContestOpenForRegistration(contest: any) {
  const now = Date.now();
  const end = new Date(contest.endTime).getTime();
  const state = getContestState(contest);
  return state === "registration_open" && contest.lifecycle === "registration_open" && now < end;
}

export function isPostContestState(state: string) {
  return ["ended", ...RELEASED_STATES].includes(state);
}
