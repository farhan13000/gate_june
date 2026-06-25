const RELEASED_STATES = [
  "answer_key_released",
  "claims_open",
  "claims_closed",
  "finalized",
  "ratings_applied",
];

export const REGISTRATION_CLOSE_BUFFER_MS = 5 * 60 * 1000;
export const DEFAULT_REGISTRATION_LEAD_MS = 7 * 24 * 60 * 60 * 1000;

function timeValue(value?: Date | string | number | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function getDefaultRegistrationStartTime(startTime: Date | string | number) {
  return new Date(new Date(startTime).getTime() - DEFAULT_REGISTRATION_LEAD_MS);
}

export function getDefaultRegistrationEndTime(endTime: Date | string | number) {
  return new Date(new Date(endTime).getTime() - REGISTRATION_CLOSE_BUFFER_MS);
}

export function getContestRegistrationStartMs(contest: any) {
  const explicit = timeValue(contest.registrationStartTime);
  if (explicit !== null) return explicit;
  const start = timeValue(contest.startTime);
  return start === null ? null : start - DEFAULT_REGISTRATION_LEAD_MS;
}

export function getContestRegistrationEndMs(contest: any) {
  const explicit = timeValue(contest.registrationEndTime);
  if (explicit !== null) return explicit;
  const end = timeValue(contest.endTime);
  return end === null ? null : end - REGISTRATION_CLOSE_BUFFER_MS;
}

export function getContestState(contest: any) {
  const now = Date.now();
  const start = timeValue(contest.startTime);
  const end = timeValue(contest.endTime);
  const regStart = getContestRegistrationStartMs(contest);
  const regEnd = getContestRegistrationEndMs(contest);
  const lifecycle = contest.lifecycle;

  if (lifecycle === "draft") return "upcoming";
  if ([...RELEASED_STATES, "ended"].includes(lifecycle)) return lifecycle;
  if (end !== null && now >= end) return "ended";
  if (["live", "frozen"].includes(lifecycle)) return lifecycle === "frozen" ? "frozen" : "live";
  if (start !== null && now >= start) return "live";
  if (regEnd !== null && now < regEnd && (lifecycle === "registration_open" || (regStart !== null && now >= regStart))) {
    return "registration_open";
  }
  return "upcoming";
}

export function isContestOpenForArena(contest: any) {
  const now = Date.now();
  const end = timeValue(contest.endTime);
  return ["live", "frozen"].includes(contest.lifecycle) && end !== null && now < end;
}

export function isContestOpenForRegistration(contest: any) {
  const now = Date.now();
  const end = timeValue(contest.endTime);
  const regStart = getContestRegistrationStartMs(contest);
  const regEnd = getContestRegistrationEndMs(contest);
  const lifecycle = contest.lifecycle;
  const manuallyOpened = lifecycle === "registration_open";
  return (
    !["draft", "ended", ...RELEASED_STATES].includes(lifecycle) &&
    end !== null &&
    regEnd !== null &&
    now < end &&
    now < regEnd &&
    (manuallyOpened || (regStart !== null && now >= regStart))
  );
}

export function isPostContestState(state: string) {
  return ["ended", ...RELEASED_STATES].includes(state);
}
