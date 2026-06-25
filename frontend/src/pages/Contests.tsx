import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenCheck, CalendarClock, CheckCircle2, Clock3, Eye, FileQuestion, Lock, LogIn, RefreshCw, ShieldCheck, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type ContestQuestion = {
  _id: string;
  title: string;
  contentId?: string;
  problemId?: string;
  difficulty: string;
  questionType: string;
  topic?: string;
  markingScheme?: { positive: number; negative: number };
};

type Contest = {
  _id: string;
  title: string;
  description: string;
  meta?: string;
  contestType: string;
  scoringMode: string;
  lifecycle: string;
  contestState:
    | "upcoming"
    | "registration_open"
    | "live"
    | "frozen"
    | "ended"
    | "answer_key_released"
    | "claims_open"
    | "claims_closed"
    | "finalized"
    | "ratings_applied";
  startTime: string;
  endTime: string;
  registrationStartTime?: string;
  registrationEndTime?: string;
  durationMinutes: number;
  wrongPenaltyMinutes: number;
  ratingEnabled: boolean;
  instantFeedback: boolean;
  registrationCount: number;
  maxParticipants?: number;
  rules?: string[];
  questions?: ContestQuestion[];
  userRegistration?: { status: string; registeredAt: string } | null;
};

const stateClass: Record<string, string> = {
  live: "border-primary/30 bg-primary/12 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.14)]",
  frozen: "border-primary/25 bg-primary/10 text-primary",
  registration_open: "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300",
  upcoming: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  ended: "border-border bg-secondary/35 text-muted-foreground",
  answer_key_released: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  claims_open: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  claims_closed: "border-border bg-secondary/35 text-muted-foreground",
  finalized: "border-border bg-secondary/35 text-muted-foreground",
  ratings_applied: "border-border bg-secondary/35 text-muted-foreground",
};

const viewOptions = [
  { value: "active", label: "Active & Upcoming", description: "Register or enter live contests." },
  { value: "registered", label: "My Contests", description: "Your registered contest list." },
  { value: "past", label: "Past Contests", description: "Completed and archived contests." },
  { value: "results", label: "Results & Keys", description: "Released keys, claims, and results." },
] as const;

const REGISTRATION_CLOSE_BUFFER_MS = 5 * 60 * 1000;

const sectionMeta: Record<string, { description: string; className: string }> = {
  "Live Now": {
    description: "Submission windows are open. Registration is required before entering.",
    className: "border-primary/30 bg-primary/5",
  },
  Upcoming: {
    description: "Register early and check the schedule before the arena opens.",
    className: "border-blue-500/20 bg-blue-500/5",
  },
  "My Participated Contests": {
    description: "Answer keys, claims, and results for contests you joined.",
    className: "border-amber-500/20 bg-amber-500/5",
  },
  "Past / Finalizing": {
    description: "Closed contests and finalization history.",
    className: "border-border bg-secondary/20",
  },
};

function contestCardClass(state: Contest["contestState"]) {
  if (["live", "frozen"].includes(state)) return "border-primary/35 bg-primary/5";
  if (["registration_open", "upcoming"].includes(state)) return "border-blue-500/20 bg-blue-500/5";
  if (["answer_key_released", "claims_open", "claims_closed"].includes(state)) return "border-amber-500/25 bg-amber-500/5";
  if (["finalized", "ratings_applied"].includes(state)) return "border-green-500/20 bg-green-500/5";
  return "border-border bg-card";
}

const testTypes = [
  {
    title: "Full Mock Test",
    type: "Exam Simulation",
    Icon: BookOpenCheck,
    description: "Full-length GATE DA simulation with exam-style timing and result review.",
    rules: ["Complete syllabus coverage", "Answer key after release", "Rank and rating can apply"],
  },
  {
    title: "Subject Wise Test",
    type: "Focused",
    Icon: Trophy,
    description: "Focused tests for one subject or major syllabus area.",
    rules: ["Subject-level analysis", "Useful for weak-area repair", "Leaderboard can be enabled"],
  },
  {
    title: "Weekly Test",
    type: "Regular",
    Icon: FileQuestion,
    description: "Scheduled weekly tests for consistency and time-pressure practice.",
    rules: ["Weekly ranking cycle", "Timed participation", "Rating can update after finalization"],
  },
  {
    title: "Challenge Yourself",
    type: "Advanced",
    Icon: ShieldCheck,
    description: "Advanced challenge tests with harder problem mixes and claims support.",
    rules: ["Higher difficulty mix", "Answer-key claims window", "Final results after review"],
  },
];

function labelize(value?: string) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function TestTypeCards() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {testTypes.map(({ title, type, Icon, description, rules }) => (
        <div key={title} className="rounded-sm border border-border bg-card p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-secondary/30 text-primary">
              <Icon size={18} />
            </div>
            <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {type}
            </span>
          </div>
          <h3 className="font-serif text-base font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {rules.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.45)]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeValue(value?: string) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function getRegistrationStartTime(contest: Contest) {
  return getTimeValue(contest.registrationStartTime) ?? new Date(contest.startTime).getTime() - 7 * 24 * 60 * 60 * 1000;
}

function getRegistrationEndTime(contest: Contest) {
  return getTimeValue(contest.registrationEndTime) ?? new Date(contest.endTime).getTime() - REGISTRATION_CLOSE_BUFFER_MS;
}

function formatDuration(value: number) {
  const diff = Math.max(0, value);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const postContestStates = ["ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"];

function isContestRegistrationOpen(contest: Contest) {
  const now = Date.now();
  const registrationStart = getRegistrationStartTime(contest);
  const registrationEnd = getRegistrationEndTime(contest);
  return (
    !postContestStates.includes(contest.contestState) &&
    contest.contestState !== "ended" &&
    now < registrationEnd &&
    (contest.contestState === "registration_open" || now >= registrationStart)
  );
}

function getContestCountdown(contest: Contest) {
  if (postContestStates.includes(contest.contestState) || contest.contestState === "ended") {
    return { label: "Closed", value: "Closed" };
  }
  const now = Date.now();
  if (["live", "frozen"].includes(contest.contestState)) {
    return { label: "Contest Running", value: formatDuration(new Date(contest.endTime).getTime() - now) };
  }
  return { label: "Contest Starts In", value: formatDuration(new Date(contest.startTime).getTime() - now) };
}

function resultActionLabel(state: Contest["contestState"]) {
  if (state === "claims_open") return "Answer Key / Claim";
  if (state === "answer_key_released" || state === "claims_closed") return "Answer Key";
  if (state === "finalized" || state === "ratings_applied") return "View Results";
  return "View Summary";
}

function registrationLabel(status?: string) {
  if (status === "checked_in") return "Entered";
  if (status === "disqualified") return "Disqualified";
  return "Registered";
}

export default function Contests() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [contestView, setContestView] = useState<"active" | "registered" | "past" | "results">("active");

  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contests", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load contests");
      const data = await res.json();
      setContests(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  useEffect(() => {
    const esUrl = `${import.meta.env.VITE_API_BASE || ""}/api/contests/stream`;
    const es = new EventSource(esUrl, { withCredentials: true });
    es.addEventListener("contests-update", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data.contests)) {
          setContests(data.contests);
          setLoading(false);
        }
      } catch {
        // Keep the last good contest list; the next event or manual refresh will recover.
      }
    });
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleContests = useMemo(() => {
    const registered = (contest: Contest) => contest.userRegistration && contest.userRegistration.status !== "withdrawn";
    const newestFirst = (items: Contest[]) =>
      [...items].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    if (contestView === "registered") return newestFirst(contests.filter(registered));
    if (contestView === "past") return newestFirst(contests.filter((contest) => postContestStates.includes(contest.contestState)));
    if (contestView === "results") {
      return newestFirst(contests.filter((contest) => registered(contest) && ["answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(contest.contestState)));
    }
    return newestFirst(contests.filter((contest) => ["live", "frozen", "registration_open", "upcoming"].includes(contest.contestState)));
  }, [contestView, contests]);

  const grouped = useMemo(() => {
    const registered = (contest: Contest) => contest.userRegistration && contest.userRegistration.status !== "withdrawn";
    const live = visibleContests.filter((contest) => ["live", "frozen"].includes(contest.contestState));
    const upcoming = visibleContests.filter((contest) => ["registration_open", "upcoming"].includes(contest.contestState));
    const myPast = visibleContests.filter((contest) => registered(contest) && postContestStates.includes(contest.contestState));
    const past = visibleContests.filter((contest) => !live.includes(contest) && !upcoming.includes(contest) && !myPast.includes(contest));
    return { live, upcoming, myPast, past };
  }, [visibleContests]);

  const updateRegistration = async (contest: Contest, action: "register" | "withdraw" | "check-in") => {
    if (!isAuthenticated) {
      toast.error("Please sign in to register for contests");
      return;
    }
    setBusyId(contest._id);
    try {
      const res = await fetch(`/api/contests/${contest._id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Contest action failed");
      toast.success(action === "withdraw" ? "Registration withdrawn" : action === "check-in" ? "Contest check-in complete" : "Registered for contest");
      if (action === "check-in") {
        navigate(`/contests/${contest._id}`);
        return;
      }
      fetchContests();
    } catch (error: any) {
      toast.error(error.message || "Contest action failed");
    } finally {
      setBusyId(null);
    }
  };

  const renderAction = (contest: Contest) => {
    const registered = contest.userRegistration && contest.userRegistration.status !== "withdrawn";
    if (!isAuthenticated) {
      return (
        <Link to="/login" className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs">
          <LogIn size={13} />
          Sign in
        </Link>
      );
    }
    if (["live", "frozen"].includes(contest.contestState)) {
      if (!registered) {
        return contest.contestState === "live" && isContestRegistrationOpen(contest) ? (
          <button
            type="button"
            disabled={busyId === contest._id}
            onClick={() => updateRegistration(contest, "register")}
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
          >
            Register
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs opacity-60"
          >
            <Lock size={13} />
            {Date.now() < getRegistrationStartTime(contest) ? "Registration Not Open" : "Registration Closed"}
          </button>
        );
      }
      return (
        <button
          type="button"
          disabled={busyId === contest._id}
          onClick={() => updateRegistration(contest, "check-in")}
          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
        >
          <Trophy size={13} />
          Enter
        </button>
      );
    }
    if (registered && postContestStates.includes(contest.contestState)) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/contests/${contest._id}`)}
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
          >
            <Eye size={13} />
            {resultActionLabel(contest.contestState)}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/contests/${contest._id}/practice`)}
            className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
          >
            <BookOpenCheck size={13} />
            Practice
          </button>
        </div>
      );
    }
    if (postContestStates.includes(contest.contestState)) {
      return (
        <button
          type="button"
          onClick={() => navigate(`/contests/${contest._id}/practice`)}
          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
        >
          <BookOpenCheck size={13} />
          Practice
        </button>
      );
    }
    if (registered) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-sm border border-green-500/25 bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300">
            <CheckCircle2 size={13} />
            Registered
          </span>
          <button
            type="button"
            disabled={busyId === contest._id}
            onClick={() => updateRegistration(contest, "withdraw")}
            className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs"
          >
            Withdraw
          </button>
        </div>
      );
    }
    if (contest.contestState === "registration_open" && isContestRegistrationOpen(contest)) {
      return (
        <button
          type="button"
          disabled={busyId === contest._id}
          onClick={() => updateRegistration(contest, "register")}
          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
        >
          Register
        </button>
      );
    }
    if (contest.contestState === "upcoming") {
      return (
        <button type="button" disabled className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs opacity-60">
          <Lock size={13} />
          Registration Not Open
        </button>
      );
    }
    return (
      <button type="button" disabled className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs opacity-60">
        <Lock size={13} />
        Closed
      </button>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 text-xs font-mono text-muted-foreground">Contest Hub</div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Live Contests</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Register for scheduled GATE DA contests, track timing, and prepare for live ranked sessions.
          </p>
        </div>
        <button type="button" onClick={fetchContests} className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <TestTypeCards />
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {viewOptions.map(({ value, label, description }) => {
          const count =
            value === "active"
              ? contests.filter((contest) => ["live", "frozen", "registration_open", "upcoming"].includes(contest.contestState)).length
              : value === "registered"
                ? contests.filter((contest) => contest.userRegistration && contest.userRegistration.status !== "withdrawn").length
                : value === "past"
                  ? contests.filter((contest) => postContestStates.includes(contest.contestState)).length
                  : contests.filter((contest) => contest.userRegistration && contest.userRegistration.status !== "withdrawn" && ["answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(contest.contestState)).length;
          return (
          <button
            key={value}
            type="button"
            onClick={() => setContestView(value as typeof contestView)}
            className={`rounded-sm border p-3 text-left transition-colors ${
              contestView === value
                ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]"
                : "border-border bg-card hover:bg-secondary/25"
            }`}
          >
            <div className="font-serif text-sm font-bold">{label}</div>
            <p className="mt-1 min-h-8 text-xs leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-1 font-mono text-lg font-bold">{String(count)}</div>
          </button>
          );
        })}
      </div>

      {loading ? (
        <div className="academic-card p-12 text-center text-sm text-muted-foreground">Loading contests...</div>
      ) : contests.length === 0 ? (
        <div className="academic-card p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-secondary/30 text-primary">
            <CalendarClock size={22} />
          </div>
          <h2 className="font-serif text-xl font-bold text-foreground">No contests are published yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            The platform supports full mock tests, subject wise tests, weekly tests, and advanced Challenge Yourself tests. When an admin publishes a contest, it will appear here with registration and result controls.
          </p>
        </div>
      ) : visibleContests.length === 0 ? (
        <div className="academic-card p-8 text-center">
          <h2 className="font-serif text-xl font-bold text-foreground">No contests in this view</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Switch filters to see active contests, registered contests, past contests, or released results and answer keys.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="space-y-4">
            {[
              ["Live Now", grouped.live],
              ["Upcoming", grouped.upcoming],
              ["My Participated Contests", grouped.myPast],
              ["Past / Finalizing", grouped.past],
            ].map(([title, list]) => {
              const items = list as Contest[];
              if (items.length === 0) return null;
              return (
                <section key={title as string} className="space-y-3">
                  <div className={`rounded-sm border p-3 ${sectionMeta[title as string]?.className || "border-border bg-card"}`}>
                    <h2 className="font-serif text-base font-bold text-foreground">{title as string}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{sectionMeta[title as string]?.description}</p>
                  </div>
                  <div className="grid gap-3">
                    {items.map((contest) => (
                      <div
                        key={contest._id}
                        onClick={() => navigate(`/contests/${contest._id}/details`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") navigate(`/contests/${contest._id}/details`);
                        }}
                        className={`rounded-sm border p-4 text-left transition-colors hover:bg-secondary/25 ${contestCardClass(contest.contestState)}`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold ${stateClass[contest.contestState] || stateClass.upcoming}`}>
                                {labelize(contest.contestState)}
                              </span>
                              {contest.ratingEnabled && (
                                <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                                  Rated
                                </span>
                              )}
                              <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                                {labelize(contest.contestType)}
                              </span>
                            </div>
                            <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{contest.title}</h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{contest.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {formatDate(contest.startTime)}</span>
                              <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> Reg closes {formatDate(new Date(getRegistrationEndTime(contest)).toISOString())}</span>
                              <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {contest.durationMinutes} min</span>
                              <span className="inline-flex items-center gap-1"><Users size={12} /> {contest.registrationCount}</span>
                              {contest.userRegistration && contest.userRegistration.status !== "withdrawn" && (
                                <span className="inline-flex items-center gap-1 text-primary">
                                  <CheckCircle2 size={12} /> {registrationLabel(contest.userRegistration.status)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {getContestCountdown(contest).label}
                            </div>
                            <div className="font-mono text-lg font-bold text-foreground" key={nowTick}>
                              {getContestCountdown(contest).value}
                            </div>
                            <div className="flex flex-wrap justify-start gap-2 lg:justify-end" onClick={(event) => event.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => navigate(`/contests/${contest._id}/details`)}
                                className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
                              >
                                <Eye size={13} />
                                View Details
                              </button>
                              {renderAction(contest)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
