import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Award, BarChart3, Check, ChevronDown, ChevronUp, Clock3, Eye, EyeOff, FileQuestion, Gavel, KeyRound, List, Pencil, PlayCircle, Plus, Radio, Search, Settings2, ShieldCheck, Sparkles, Trash2, Trophy, Users, X } from "lucide-react";
import { toast } from "sonner";
import HierarchyPicker, { type HierarchyPickerValue } from "./HierarchyPicker";

type Contest = {
  _id: string;
  title: string;
  description: string;
  meta?: string;
  startTime: string;
  endTime: string;
  registrationStartTime?: string;
  registrationEndTime?: string;
  contestType?: string;
  visibility?: string;
  scoringMode?: string;
  lifecycle?: string;
  wrongPenaltyMinutes?: number;
  ratingEnabled?: boolean;
  instantFeedback?: boolean;
  questions?: ProblemCandidate[];
  status: string;
  showOnHome: boolean;
  showInPastContests: boolean;
  createdAt?: string;
};

type ProblemCandidate = {
  _id: string;
  title: string;
  contentId?: string;
  problemId?: string;
  difficulty: string;
  questionType: string;
  topic?: string;
  tags?: string[];
};

const emptyProblemHierarchy: HierarchyPickerValue = {
  subjectId: "",
  chapterId: "",
  topicId: "",
  subtopicId: "",
};

const emptyContestProblemForm = {
  title: "",
  statement: "",
  solution: "",
  difficulty: "Medium",
  questionType: "MCQ",
  positiveMarks: 2,
  negativeMarks: 0.66,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
};

type AdminStanding = {
  _id: string;
  rank?: number;
  visibleRank?: number;
  user: { fullName: string; email: string; rating: number };
  score: number;
  visibleScore: number;
  solvedCount: number;
  wrongAttempts: number;
  penaltyMinutes: number;
  disqualified: boolean;
  registrationStatus?: string;
  registeredAt?: string;
  startedAt?: string;
  finishedAt?: string;
  submissionCount?: number;
  attemptedQuestions?: number;
  lastSubmittedAt?: string;
  responses?: AdminContestResponse[];
  updatedAt: string;
};

type AdminContestResponse = {
  _id: string;
  question?: {
    _id: string;
    title?: string;
    contentId?: string;
    problemId?: string;
    questionType?: string;
    options?: Array<{ _id: string; text: string; isCorrect?: boolean }>;
  } | null;
  answer: {
    mcqSelected?: string | null;
    msqSelected?: string[];
    natAnswer?: string;
  };
  isCorrect: boolean;
  marksAwarded: number;
  attemptNumber: number;
  judgeStatus: string;
  submittedAt: string;
  judgedAt?: string;
};

type AdminClaim = {
  _id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  adminResponse?: string;
  userId?: { fullName?: string; email?: string };
  questionId?: { title?: string; contentId?: string; problemId?: string };
  createdAt: string;
};

type RatingPreview = {
  canApply: boolean;
  count: number;
  participants: number;
  alreadyApplied: boolean;
  message: string;
  changes: Array<{
    userId: string;
    fullName: string;
    email: string;
    oldRating: number;
    newRating: number;
    delta: number;
    rank: number;
    performanceRating?: number;
  }>;
};

const emptyForm = {
  title: "",
  description: "",
  meta: "",
  startTime: "",
  endTime: "",
  registrationStartTime: "",
  registrationEndTime: "",
  contestType: "full_mock",
  visibility: "public",
  scoringMode: "gate",
  lifecycle: "draft",
  wrongPenaltyMinutes: 10,
  ratingEnabled: false,
  instantFeedback: false,
  showOnHome: true,
  showInPastContests: true,
};

const contestTypes = [
  ["full_mock", "Full Mock Test", "Full-length scheduled exam simulation."],
  ["subject_wise", "Subject Wise Test", "Focused test for one syllabus area."],
  ["weekly", "Weekly Test", "Recurring ranked weekly practice."],
  ["challenge_yourself", "Challenge Yourself", "Harder practice challenge with review."],
  ["practice", "Practice Contest", "Unrated contest-style practice set."],
  ["rated", "Rated Contest", "Rating-first contest format."],
  ["gate_mock", "GATE Mock", "GATE-style full mock variant."],
  ["private", "Private Contest", "Admin-controlled private contest."],
  ["challenge", "Challenge", "Open challenge format."],
];

const lifecycleHelp = [
  ["draft", "Draft", "Saved in admin until published."],
  ["published", "Published", "Visible in contest hub."],
  ["registration_open", "Registration", "Users can register and prepare."],
  ["live", "Live", "Contest room accepts submissions."],
  ["frozen", "Frozen", "Late scoreboard changes can be hidden."],
  ["ended", "Ended", "Submissions close."],
  ["answer_key_released", "Answer Key", "Editorials and keys become visible."],
  ["claims_open", "Claims", "Users submit answer or marking claims."],
  ["claims_closed", "Claims Closed", "Admin completes review."],
  ["finalized", "Finalized", "Ranks are locked."],
  ["ratings_applied", "Ratings", "Rating history is written."],
];

type ContestForm = typeof emptyForm;
type AdminContestView = "draft" | "new" | "upcoming" | "live" | "past" | "all";
type EndTimeMode = "end-time" | "duration";

const MINUTE_MS = 60 * 1000;
const REGISTRATION_CLOSE_BUFFER_MINUTES = 5;
const REGISTRATION_CLOSE_BUFFER_MS = REGISTRATION_CLOSE_BUFFER_MINUTES * MINUTE_MS;

function getTimeValue(value?: string) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : NaN;
}

function toLocalInput(value: Date | number | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDurationMinutes(startTime?: string, endTime?: string) {
  const start = getTimeValue(startTime);
  const end = getTimeValue(endTime);
  if (start === null || end === null || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.max(1, Math.ceil((end - start) / MINUTE_MS));
}

function getDefaultRegistrationEndInput(endTime?: string) {
  const end = getTimeValue(endTime);
  return end !== null && Number.isFinite(end) ? toLocalInput(end - REGISTRATION_CLOSE_BUFFER_MS) : "";
}

function getContestTimingErrors(form: ContestForm) {
  const errors: Partial<Record<"startTime" | "endTime" | "registrationStartTime" | "registrationEndTime", string>> = {};
  const start = getTimeValue(form.startTime);
  const end = getTimeValue(form.endTime);
  const registrationStart = getTimeValue(form.registrationStartTime);
  const registrationEnd = getTimeValue(form.registrationEndTime);
  const effectiveRegistrationEnd =
    registrationEnd !== null
      ? registrationEnd
      : end !== null && Number.isFinite(end)
        ? end - REGISTRATION_CLOSE_BUFFER_MS
        : null;

  if (Number.isNaN(start)) errors.startTime = "Enter a valid contest start time.";
  if (Number.isNaN(end)) errors.endTime = "Enter a valid contest end time.";
  if (Number.isNaN(registrationStart)) errors.registrationStartTime = "Enter a valid registration opening time.";
  if (Number.isNaN(registrationEnd)) errors.registrationEndTime = "Enter a valid registration closing time.";

  if (start !== null && end !== null && Number.isFinite(start) && Number.isFinite(end) && end <= start) {
    errors.endTime = "Contest end time must be after the start time.";
  }

  if (
    registrationStart !== null &&
    effectiveRegistrationEnd !== null &&
    Number.isFinite(registrationStart) &&
    Number.isFinite(effectiveRegistrationEnd) &&
    effectiveRegistrationEnd <= registrationStart
  ) {
    errors.registrationEndTime = "Registration closing time must be after opening time.";
  }

  if (
    registrationStart === null &&
    registrationEnd !== null &&
    start !== null &&
    Number.isFinite(registrationEnd) &&
    Number.isFinite(start) &&
    effectiveRegistrationEnd !== null &&
    Number.isFinite(effectiveRegistrationEnd) &&
    effectiveRegistrationEnd <= start - 7 * 24 * 60 * 60 * 1000
  ) {
    errors.registrationEndTime = "Registration closing time must be after the auto opening time.";
  }

  if (
    effectiveRegistrationEnd !== null &&
    end !== null &&
    Number.isFinite(effectiveRegistrationEnd) &&
    Number.isFinite(end) &&
    effectiveRegistrationEnd > end - REGISTRATION_CLOSE_BUFFER_MS
  ) {
    errors.registrationEndTime = `Registration must close at least ${REGISTRATION_CLOSE_BUFFER_MINUTES} minutes before the contest ends.`;
  }

  return errors;
}

const managerPanels = [
  { id: "setup", label: "Setup", description: "Create or edit contest basics", Icon: Settings2 },
  { id: "problems", label: "Problems", description: "Attach approved problem set", Icon: FileQuestion },
  { id: "lifecycle", label: "Lifecycle", description: "Move contest through stages", Icon: Radio },
  { id: "monitor", label: "Monitor", description: "Review live standings", Icon: BarChart3 },
  { id: "claims", label: "Claims", description: "Review and resolve participant claims", Icon: Gavel },
] as const;

type ManagerPanel = (typeof managerPanels)[number]["id"];
type ContestLifecycleAction = "release-answer-key" | "open-claims" | "close-claims" | "finalize-ratings";
type LifecycleOperation = {
  stage: string;
  title: string;
  description: string;
  lifecycle?: string;
  action?: ContestLifecycleAction;
  completesAt?: string;
  Icon: React.ComponentType<{ size?: number }>;
  primary?: boolean;
};

function labelize(value?: string) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getContestTypeLabel(type?: string) {
  return contestTypes.find(([value]) => value === type)?.[1] || labelize(type || "contest");
}

function getLifecycleIndex(lifecycle?: string) {
  return lifecycleHelp.findIndex(([key]) => key === lifecycle);
}

function hasReachedLifecycle(current?: string, target?: string) {
  const currentIndex = getLifecycleIndex(current);
  const targetIndex = getLifecycleIndex(target);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
}

function canRunLifecycleFrom(current?: string, target?: string) {
  if (!current || !target || current === target) return true;
  if (["finalized", "ratings_applied"].includes(current)) return false;
  if (current === "draft") return target === "published";
  if (target === "published") return current === "draft";
  if (target === "registration_open") return ["published", "registration_open"].includes(current);
  if (target === "live") return ["published", "registration_open", "live"].includes(current);
  if (target === "frozen") return ["live", "frozen"].includes(current);
  if (target === "ended") return ["live", "frozen", "ended"].includes(current);
  return true;
}

function lifecycleBadgeClass(lifecycle?: string, selected = false) {
  if (lifecycle === "draft") return selected ? "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300" : "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300";
  if (["published", "registration_open"].includes(lifecycle || "")) return selected ? "border-sky-500/35 bg-sky-500/12 text-sky-700 dark:text-sky-300" : "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (["live", "frozen"].includes(lifecycle || "")) return selected ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (["ended", "answer_key_released", "claims_open", "claims_closed"].includes(lifecycle || "")) return selected ? "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-300" : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (["finalized", "ratings_applied"].includes(lifecycle || "")) return selected ? "border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-300" : "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300";
  return selected ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground";
}

function lifecycleActionClass(state: "current" | "done" | "primary" | "idle") {
  if (state === "current") return "border-sky-500/45 bg-sky-500/12 text-sky-700 shadow-[0_0_0_1px_hsl(199_89%_48%/0.10)] dark:text-sky-300";
  if (state === "done") return "border-green-500/35 bg-green-500/10 text-green-700 dark:text-green-300";
  if (state === "primary") return "border-primary/35 bg-primary text-primary-foreground hover:opacity-90";
  return "border-border bg-card hover:bg-secondary/25";
}

function lifecycleActionIconClass(state: "current" | "done" | "primary" | "idle") {
  if (state === "current") return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (state === "done") return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
  if (state === "primary") return "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground";
  return "border-border bg-background";
}

function statusForLifecycle(lifecycle?: string) {
  if (lifecycle === "draft") return "draft";
  if (["ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(lifecycle || "")) {
    return "completed";
  }
  return "approved";
}

function isPastContest(contest: Pick<Contest, "lifecycle" | "endTime">) {
  return (
    ["ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(contest.lifecycle || "") ||
    new Date(contest.endTime).getTime() < Date.now()
  );
}

function claimStatusClass(status?: string) {
  if (status === "accepted") return "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300";
  if (status === "rejected") return "border-destructive/25 bg-destructive/10 text-destructive";
  if (status === "under_review") return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "open") return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  return "border-border bg-background text-muted-foreground";
}

function buildContestReadiness(contest: Contest | null, standings: AdminStanding[]) {
  if (!contest) return [];
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  const problemCount = (contest.questions || []).length;
  const registered = standings.length;
  const activeParticipants = standings.filter((row) => row.registrationStatus !== "withdrawn" && !row.disqualified).length;
  const lifecycleIndex = getLifecycleIndex(contest.lifecycle);

  return [
    {
      label: "Setup",
      ready: Boolean(contest.title && contest.description && Number.isFinite(start) && Number.isFinite(end) && end > start),
      detail: "Basics and timing",
    },
    {
      label: "Problems",
      ready: problemCount > 0,
      detail: `${problemCount} attached`,
    },
    {
      label: "Registration",
      ready: lifecycleIndex >= getLifecycleIndex("registration_open") || registered > 0,
      detail: `${registered} registered`,
    },
    {
      label: "Live",
      ready: lifecycleIndex >= getLifecycleIndex("live") || now >= start,
      detail: now < start ? "Scheduled" : now <= end ? "Window open" : "Window closed",
    },
    {
      label: "Results",
      ready: lifecycleIndex >= getLifecycleIndex("finalized") || contest.lifecycle === "ratings_applied",
      detail: activeParticipants > 0 ? `${activeParticipants} eligible` : "No eligible users",
    },
  ];
}

function getLifecycleSafetyMessage(contest: Contest, lifecycle: string, metrics: { problems: number; registered: number; submissions: number; locked: number }) {
  const stage = labelize(lifecycle);
  const title = contest.title || "this contest";
  if (lifecycle === "live") {
    return `Start "${title}" now?\n\nThis opens the contest arena for registered users.\nProblems: ${metrics.problems}\nRegistered users: ${metrics.registered}`;
  }
  if (lifecycle === "frozen") {
    return `Freeze leaderboard for "${title}"?\n\nSubmissions can continue, but visible leaderboard values may be limited.`;
  }
  if (lifecycle === "ended") {
    return `End "${title}" now?\n\nNew submissions and final submits will be blocked after this stage.\nResponses saved: ${metrics.submissions}\nLocked attempts: ${metrics.locked}`;
  }
  return `Move "${title}" to ${stage}?\n\nCurrent stage: ${labelize(contest.lifecycle || contest.status)}`;
}

function getContestActionSafetyMessage(action: ContestLifecycleAction, contest: Contest, metrics: { registered: number; submissions: number; locked: number }, preview: RatingPreview | null) {
  const title = contest.title || "this contest";
  if (action === "release-answer-key") {
    return `Release answer key for "${title}"?\n\nParticipants will be able to see official answers and solutions.`;
  }
  if (action === "open-claims") {
    return `Open claims for "${title}"?\n\nParticipants can submit answer-key, marking, and technical claims.`;
  }
  if (action === "close-claims") {
    return `Close claims for "${title}"?\n\nParticipants will not be able to submit new claims after this.`;
  }
  return `Finalize results for "${title}"?\n\nThis recomputes standings and applies ratings if enabled.\nEligible participants: ${preview?.participants ?? metrics.registered}\nProjected rating changes: ${preview?.count ?? 0}\nResponses saved: ${metrics.submissions}`;
}

function AdminLifecycleRail({ current }: { current?: string }) {
  const currentIndex = Math.max(0, lifecycleHelp.findIndex(([key]) => key === current));
  return (
    <div className="academic-card p-4">
      <h3 className="font-serif text-sm font-bold text-foreground">Lifecycle Rail</h3>
      <p className="mt-1 text-xs text-muted-foreground">Use this as the stage checklist before finalizing a contest.</p>
      <div className="mt-4">
        {lifecycleHelp.map(([key, title, description], index) => {
          const active = key === current;
          const complete = index < currentIndex;
          return (
            <div key={key} className="relative flex gap-3 pb-4 last:pb-0">
              {index < lifecycleHelp.length - 1 && (
                <span className={`absolute left-[7px] top-4 h-full w-px ${complete ? "bg-primary/60" : "bg-border"}`} />
              )}
              <span
                className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${
                  active
                    ? "border-primary bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.55)]"
                    : complete
                      ? "border-primary bg-primary/70"
                      : "border-border bg-background"
                }`}
              />
              <div>
                <div className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>{title}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getProblemId(problem: any) {
  return String(problem?._id || problem || "");
}

function isContestOnlyProblem(problem?: ProblemCandidate | null) {
  return Boolean(problem?.tags?.includes("contest-only"));
}

const lifecycleActions: LifecycleOperation[] = [
  {
    stage: "Registration",
    title: "Publish Contest",
    description: "Move a draft into the public contest hub without opening registration yet.",
    lifecycle: "published",
    Icon: Eye,
  },
  {
    stage: "Registration",
    title: "Open Registration",
    description: "Allow users to register until the configured close time.",
    lifecycle: "registration_open",
    Icon: Radio,
  },
  {
    stage: "Live",
    title: "Start Contest Now",
    description: "Open the arena immediately. The saved end time still closes the contest.",
    lifecycle: "live",
    Icon: PlayCircle,
    primary: true,
  },
  {
    stage: "Live",
    title: "Freeze Leaderboard",
    description: "Keep submissions open while limiting leaderboard visibility.",
    lifecycle: "frozen",
    Icon: ShieldCheck,
  },
  {
    stage: "Review",
    title: "Release Answer Key",
    description: "Show official answers and solutions to participants.",
    action: "release-answer-key",
    completesAt: "answer_key_released",
    Icon: KeyRound,
  },
  {
    stage: "Review",
    title: "Open Claims",
    description: "Let participants submit answer-key or marking claims.",
    action: "open-claims",
    completesAt: "claims_open",
    Icon: Gavel,
  },
  {
    stage: "Review",
    title: "Close Claims",
    description: "Stop new claims after the review window ends.",
    action: "close-claims",
    completesAt: "claims_closed",
    Icon: Gavel,
  },
  {
    stage: "Results",
    title: "Finalize Results",
    description: "Lock ranks and apply ratings for rated contests.",
    action: "finalize-ratings",
    completesAt: "finalized",
    Icon: Award,
    primary: true,
  },
] as const;

export default function AdminContestSection() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [endTimeMode, setEndTimeMode] = useState<EndTimeMode>("end-time");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<ProblemCandidate[]>([]);
  const [problemSearch, setProblemSearch] = useState("");
  const [adminStandings, setAdminStandings] = useState<AdminStanding[]>([]);
  const [adminClaims, setAdminClaims] = useState<AdminClaim[]>([]);
  const [ratingPreview, setRatingPreview] = useState<RatingPreview | null>(null);
  const [claimResponses, setClaimResponses] = useState<Record<string, string>>({});
  const [activePanel, setActivePanel] = useState<ManagerPanel>("setup");
  const [adminContestView, setAdminContestView] = useState<AdminContestView>("draft");
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [composingNewContest, setComposingNewContest] = useState(false);
  const [showContestProblemCreator, setShowContestProblemCreator] = useState(false);
  const [creatingContestProblem, setCreatingContestProblem] = useState(false);
  const [problemHierarchy, setProblemHierarchy] = useState<HierarchyPickerValue>(emptyProblemHierarchy);
  const [contestProblemForm, setContestProblemForm] = useState(emptyContestProblemForm);
  const composingNewRef = useRef(false);
  const initialContestSelectionRef = useRef(false);

  const selectedContest = useMemo(
    () => contests.find((contest) => contest._id === selectedContestId) || null,
    [contests, selectedContestId]
  );
  const selectedContestReadiness = useMemo(
    () => buildContestReadiness(selectedContest, adminStandings),
    [adminStandings, selectedContest]
  );

  const workspaceReadiness = useMemo(() => {
    if (!composingNewContest) return selectedContestReadiness;
    const pseudo: Contest = {
      _id: "draft",
      title: form.title,
      description: form.description,
      startTime: form.startTime || new Date().toISOString(),
      endTime: form.endTime || new Date().toISOString(),
      lifecycle: form.lifecycle,
      status: "draft",
      showOnHome: form.showOnHome,
      showInPastContests: form.showInPastContests,
      questions: selectedQuestionIds.map((id) => ({ _id: id } as ProblemCandidate)),
    };
    return buildContestReadiness(pseudo, []);
  }, [composingNewContest, form, selectedContestReadiness, selectedQuestionIds]);

  const savedQuestionIds = useMemo(
    () => (selectedContest?.questions || []).map(getProblemId).filter(Boolean),
    [selectedContest]
  );

  const problemsDirty = useMemo(() => {
    if (savedQuestionIds.length !== selectedQuestionIds.length) return true;
    const saved = [...savedQuestionIds].sort().join(",");
    const selected = [...selectedQuestionIds].sort().join(",");
    return saved !== selected;
  }, [savedQuestionIds, selectedQuestionIds]);

  const showWorkspaceContest = Boolean(selectedContest && !composingNewContest);
  const workspaceTitle = composingNewContest
    ? form.title.trim() || "New Contest Draft"
    : selectedContest?.title || "No contest selected";
  const workspaceSubtitle = composingNewContest
    ? "Draft setup in progress — save the contest before attaching problems or running stages."
    : selectedContest
      ? `${getContestTypeLabel(selectedContest.contestType)} / ${labelize(selectedContest.lifecycle || selectedContest.status)}`
      : "Choose a contest from the library or create a new one.";

  const selectedContestMetrics = useMemo(() => {
    const submissions = adminStandings.reduce((sum, row) => sum + (row.submissionCount || 0), 0);
    const locked = adminStandings.filter((row) => row.finishedAt).length;
    return {
      problems: selectedContest?.questions?.length || 0,
      registered: adminStandings.length,
      submissions,
      locked,
    };
  }, [adminStandings, selectedContest]);

  const workspaceMetrics = composingNewContest
    ? {
        problems: selectedQuestionIds.length,
        registered: 0,
        submissions: 0,
        locked: 0,
      }
    : selectedContestMetrics;
  const selectedContestIsPast = selectedContest ? isPastContest(selectedContest) : false;
  const claimSummary = useMemo(() => {
    const byUser = new Map<string, { label: string; email: string; claims: AdminClaim[] }>();
    for (const claim of adminClaims) {
      const label = claim.userId?.fullName || claim.userId?.email || "Unknown user";
      const email = claim.userId?.email || "";
      const key = email || label;
      const group = byUser.get(key) || { label, email, claims: [] };
      group.claims.push(claim);
      byUser.set(key, group);
    }
    return {
      total: adminClaims.length,
      pending: adminClaims.filter((claim) => claim.status === "open").length,
      review: adminClaims.filter((claim) => claim.status === "under_review").length,
      accepted: adminClaims.filter((claim) => claim.status === "accepted").length,
      rejected: adminClaims.filter((claim) => claim.status === "rejected").length,
      users: Array.from(byUser.values()),
    };
  }, [adminClaims]);
  const lifecycleActionGroups = useMemo(
    () =>
      ["Registration", "Live", "Closure", "Review", "Results"]
        .map((stage) => ({
          stage,
          actions: lifecycleActions.filter((action) => action.stage === stage),
        }))
        .filter((group) => group.actions.length > 0),
    []
  );
  const timingErrors = useMemo(() => getContestTimingErrors(form), [form]);
  const hasTimingErrors = Object.keys(timingErrors).length > 0;
  const contestDurationMinutes = useMemo(() => getDurationMinutes(form.startTime, form.endTime), [form.endTime, form.startTime]);

  const fetchContests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setContests(data);
        if (!initialContestSelectionRef.current && !composingNewRef.current && data.length > 0) {
          initialContestSelectionRef.current = true;
          setSelectedContestId((current) => current || data[0]._id);
        }
      }
    } catch {
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    const params = new URLSearchParams({ limit: "60" });
    if (problemSearch.trim()) params.set("search", problemSearch.trim());
    if (selectedContestId) params.set("contestId", selectedContestId);
    const res = await fetch(`/api/admin/contests/problem-candidates?${params}`, { credentials: "include" });
    if (res.ok) setCandidates(await res.json());
  }, [problemSearch, selectedContestId]);

  const fetchAdminStandings = useCallback(async () => {
    if (!selectedContestId) return;
    const res = await fetch(`/api/admin/contests/${selectedContestId}/standings`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setAdminStandings(data.standings || []);
    }
  }, [selectedContestId]);

  const fetchAdminClaims = useCallback(async () => {
    if (!selectedContestId) return;
    const res = await fetch(`/api/admin/contests/${selectedContestId}/claims`, { credentials: "include" });
    if (res.ok) setAdminClaims(await res.json());
  }, [selectedContestId]);

  const fetchRatingPreview = useCallback(async () => {
    if (!selectedContestId) {
      setRatingPreview(null);
      return;
    }
    const res = await fetch(`/api/admin/contests/${selectedContestId}/rating-preview`, { credentials: "include" });
    if (res.ok) {
      setRatingPreview(await res.json());
    } else {
      setRatingPreview(null);
    }
  }, [selectedContestId]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    fetchAdminStandings();
  }, [fetchAdminStandings]);

  useEffect(() => {
    if (!selectedContestId) return undefined;
    const esUrl = `${import.meta.env.VITE_API_BASE || ""}/api/admin/contests/${selectedContestId}/standings/stream`;
    const es = new EventSource(esUrl, { withCredentials: true });
    es.addEventListener("admin-standings-update", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setAdminStandings(data.standings || []);
      } catch {
        // Keep the current monitor data; manual refresh remains available.
      }
    });
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [selectedContestId]);

  useEffect(() => {
    fetchAdminClaims();
  }, [fetchAdminClaims]);

  useEffect(() => {
    if (activePanel === "lifecycle") fetchRatingPreview();
  }, [activePanel, fetchRatingPreview]);

  useEffect(() => {
    if (selectedContest) {
      setSelectedQuestionIds((selectedContest.questions || []).map(getProblemId).filter(Boolean));
    }
  }, [selectedContest]);

  const selectedProblems = useMemo(() => {
    const byId = new Map<string, ProblemCandidate>();
    for (const problem of selectedContest?.questions || []) {
      if ((problem as any)?.title) byId.set(getProblemId(problem), problem as ProblemCandidate);
    }
    for (const problem of candidates) {
      if (selectedQuestionIds.includes(problem._id)) byId.set(problem._id, problem);
    }
    return selectedQuestionIds.map((id) => byId.get(id)).filter(Boolean) as ProblemCandidate[];
  }, [candidates, selectedContest, selectedQuestionIds]);

  const adminContestGroups = useMemo(() => {
    const now = Date.now();
    const recentlyCreatedCutoff = now - 7 * 24 * 60 * 60 * 1000;
    return {
      draft: contests.filter((contest) => (contest.lifecycle || contest.status) === "draft"),
      new: contests.filter((contest: any) =>
        (contest.lifecycle || contest.status) !== "draft" &&
        new Date(contest.createdAt || contest.startTime).getTime() >= recentlyCreatedCutoff &&
        !isPastContest(contest)
      ),
      upcoming: contests.filter((contest) => ["published", "registration_open"].includes(contest.lifecycle || "") && !isPastContest(contest)),
      live: contests.filter((contest) => ["live", "frozen"].includes(contest.lifecycle || "")),
      past: contests.filter(isPastContest),
      all: contests,
    };
  }, [contests]);

  const visibleAdminContests = adminContestGroups[adminContestView];

  const beginNewContest = () => {
    composingNewRef.current = true;
    setComposingNewContest(true);
    setForm(emptyForm);
    setEndTimeMode("end-time");
    setEditingId(null);
    setSelectedContestId(null);
    setSelectedQuestionIds([]);
    setAdminStandings([]);
    setAdminClaims([]);
    setRatingPreview(null);
    setExpandedParticipantId(null);
    setAdminContestView("draft");
    setActivePanel("setup");
    setLibraryOpen(false);
    setShowContestProblemCreator(false);
  };

  const resetForm = () => {
    beginNewContest();
  };

  const updateStartTime = (startTime: string) => {
    const previousDuration = endTimeMode === "duration" ? getDurationMinutes(form.startTime, form.endTime) : null;
    const nextStart = getTimeValue(startTime);
    setForm((current) => {
      const nextEndTime =
        previousDuration && nextStart !== null && Number.isFinite(nextStart)
          ? toLocalInput(nextStart + previousDuration * MINUTE_MS)
          : current.endTime;
      const currentDefaultRegistrationEnd = getDefaultRegistrationEndInput(current.endTime);
      const shouldSyncRegistrationEnd = !current.registrationEndTime || current.registrationEndTime === currentDefaultRegistrationEnd;
      return {
        ...current,
        startTime,
        endTime: nextEndTime,
        registrationEndTime: shouldSyncRegistrationEnd ? getDefaultRegistrationEndInput(nextEndTime) : current.registrationEndTime,
      };
    });
  };

  const updateEndTime = (endTime: string) => {
    setForm((current) => {
      const currentDefaultRegistrationEnd = getDefaultRegistrationEndInput(current.endTime);
      const shouldSyncRegistrationEnd = !current.registrationEndTime || current.registrationEndTime === currentDefaultRegistrationEnd;
      return {
        ...current,
        endTime,
        registrationEndTime: shouldSyncRegistrationEnd ? getDefaultRegistrationEndInput(endTime) : current.registrationEndTime,
      };
    });
  };

  const setContestDuration = (value: string) => {
    if (value === "") {
      updateEndTime("");
      return;
    }
    const duration = Math.ceil(Number(value));
    const start = getTimeValue(form.startTime);
    if (!Number.isFinite(duration) || duration < 1) return;
    if (start === null || !Number.isFinite(start)) {
      toast.error("Set the contest start time before choosing a duration");
      return;
    }
    updateEndTime(toLocalInput(start + duration * MINUTE_MS));
  };

  const addMinutesToEndTime = (minutes: number) => {
    const start = getTimeValue(form.startTime);
    const end = getTimeValue(form.endTime);
    const base = end !== null && Number.isFinite(end) ? end : start;
    if (base === null || !Number.isFinite(base)) {
      toast.error("Set the contest start time before adjusting the end time");
      return;
    }
    updateEndTime(toLocalInput(base + minutes * MINUTE_MS));
  };

  const selectContest = (contestId: string) => {
    composingNewRef.current = false;
    setComposingNewContest(false);
    setSelectedContestId(contestId);
    setEditingId(null);
    setExpandedParticipantId(null);
    setShowContestProblemCreator(false);
  };

  const createContestOnlyProblem = async () => {
    if (!selectedContestId) {
      toast.error("Save the contest first, then create contest-only problems");
      return;
    }
    if (!problemHierarchy.subtopicId) {
      toast.error("Select full taxonomy down to subtopic");
      return;
    }
    if (!contestProblemForm.title.trim() || !contestProblemForm.statement.trim() || !contestProblemForm.solution.trim()) {
      toast.error("Title, statement, and solution are required");
      return;
    }
    setCreatingContestProblem(true);
    try {
      const res = await fetch(`/api/admin/contests/${selectedContestId}/contest-only-questions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: problemHierarchy.subjectId,
          chapterId: problemHierarchy.chapterId,
          topicId: problemHierarchy.topicId,
          subtopicId: problemHierarchy.subtopicId,
          topic: problemHierarchy.topicId,
          title: contestProblemForm.title.trim(),
          statement: contestProblemForm.statement.trim(),
          solution: contestProblemForm.solution.trim(),
          difficulty: contestProblemForm.difficulty,
          questionType: contestProblemForm.questionType,
          options: contestProblemForm.questionType === "NAT" ? [] : contestProblemForm.options,
          markingScheme: {
            positive: contestProblemForm.positiveMarks,
            negative: contestProblemForm.negativeMarks,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create problem");
      const questionId = String(data.question?._id || "");
      if (questionId) {
        setSelectedQuestionIds((current) => (current.includes(questionId) ? current : [...current, questionId]));
      }
      setContestProblemForm(emptyContestProblemForm);
      setShowContestProblemCreator(false);
      toast.success("Contest-only problem created and attached");
      fetchContests();
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.message || "Failed to create contest-only problem");
    } finally {
      setCreatingContestProblem(false);
    }
  };

  const openContestView = (view: AdminContestView) => {
    setAdminContestView(view);
    if (view === "past") setActivePanel("monitor");
    else if (view === "live") setActivePanel("lifecycle");
    else setActivePanel("setup");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.startTime || !form.endTime) {
      toast.error("Fill all required fields");
      return;
    }
    if (hasTimingErrors) {
      toast.error("Please correct the contest timing before saving");
      return;
    }

    const payload = {
      ...form,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      registrationStartTime: form.registrationStartTime ? new Date(form.registrationStartTime).toISOString() : undefined,
      registrationEndTime: form.registrationEndTime ? new Date(form.registrationEndTime).toISOString() : undefined,
      status: statusForLifecycle(form.lifecycle),
    };

    try {
      const url = editingId ? `/api/admin/contests/${editingId}` : "/api/admin/contests";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        toast.success(editingId ? "Contest updated" : "Contest created");
        composingNewRef.current = false;
        setComposingNewContest(false);
        setForm(emptyForm);
        setEditingId(null);
        setSelectedContestId(saved._id);
        setAdminContestView(saved.lifecycle === "draft" ? "draft" : "upcoming");
        setSelectedQuestionIds((saved.questions || []).map(getProblemId).filter(Boolean));
        fetchContests();
      } else {
        const data = await res.json();
        toast.error(data.message || "Save failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const startEdit = (contest: Contest) => {
    composingNewRef.current = false;
    setComposingNewContest(false);
    setSelectedContestId(contest._id);
    setEditingId(contest._id);
    setEndTimeMode("end-time");
    setForm({
      title: contest.title,
      description: contest.description,
      meta: contest.meta || "",
      startTime: toLocalInput(contest.startTime),
      endTime: toLocalInput(contest.endTime),
      registrationStartTime: toLocalInput(contest.registrationStartTime || ""),
      registrationEndTime: toLocalInput(contest.registrationEndTime || ""),
      contestType: contest.contestType || "full_mock",
      visibility: contest.visibility || "public",
      scoringMode: contest.scoringMode || "gate",
      lifecycle: contest.lifecycle || "published",
      wrongPenaltyMinutes: contest.wrongPenaltyMinutes ?? 10,
      ratingEnabled: Boolean(contest.ratingEnabled),
      instantFeedback: Boolean(contest.instantFeedback),
      showOnHome: contest.showOnHome,
      showInPastContests: contest.showInPastContests !== false,
    });
  };

  const deleteContest = async (id: string) => {
    const contest = contests.find((item) => item._id === id);
    const title = contest?.title || "this contest";
    const problemCount = contest?.questions?.length || 0;
    if (
      !confirm(
        `Delete "${title}"?\n\nThis removes the contest configuration from admin/public views.\nAttached problems: ${problemCount}\nCurrent stage: ${labelize(contest?.lifecycle || contest?.status)}`
      )
    ) {
      return;
    }
    try {
      const performDelete = (force = false) => fetch(`/api/admin/contests/${id}${force ? "?force=true" : ""}`, {
        method: "DELETE",
        credentials: "include",
      });
      let res = await performDelete(false);
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        const stats = data.stats || {};
        const ok = confirm(
          `Force delete "${title}"?\n\nThis contest already has activity:\nRegistrations: ${stats.registrations || 0}\nSubmissions: ${stats.submissions || 0}\nStandings: ${stats.standings || 0}\nClaims: ${stats.claims || 0}\n\nThis action removes only the contest record; related records may remain for audit/history.`
        );
        if (!ok) return;
        res = await performDelete(true);
      }
      if (res.ok) {
        toast.success("Contest deleted");
        if (selectedContestId === id) beginNewContest();
        fetchContests();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Contest delete failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const setPastContestVisibility = async (contest: Contest) => {
    const nextVisibility = contest.showInPastContests === false;
    try {
      const res = await fetch(`/api/admin/contests/${contest._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInPastContests: nextVisibility }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Unable to update past-contest visibility");
      }
      toast.success(nextVisibility ? "Contest is now visible in Past Contests" : "Contest is now hidden from Past Contests");
      fetchContests();
    } catch (error: any) {
      toast.error(error.message || "Unable to update past-contest visibility");
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(id) ? current.filter((questionId) => questionId !== id) : [...current, id]
    );
  };

  const saveContestProblems = async () => {
    if (!selectedContestId) return;
    if (
      selectedContest &&
      ["live", "frozen", "ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(selectedContest.lifecycle || "") &&
      !confirm(
        `Update problems for "${selectedContest.title}"?\n\nThis contest is already ${labelize(selectedContest.lifecycle)}. Changing problems after launch can affect scoring and rankings.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/contests/${selectedContestId}/problems`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ questionIds: selectedQuestionIds }),
    });
    if (res.ok) {
      toast.success("Contest problems updated");
      fetchContests();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "Failed to update contest problems");
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const timingInputClass = (field: keyof typeof timingErrors) =>
    `w-full rounded-sm border bg-background px-3 py-2 text-xs outline-none focus:border-primary ${
      timingErrors[field] ? "border-destructive" : "border-border"
    }`;

  const formatAdminAnswer = (response: AdminContestResponse) => {
    const question = response.question;
    const options = question?.options || [];
    if (question?.questionType === "NAT") return response.answer?.natAnswer || "-";
    if (question?.questionType === "MSQ") {
      const selected = response.answer?.msqSelected || [];
      if (selected.length === 0) return "-";
      return selected
        .map((id) => options.find((option) => String(option._id) === String(id))?.text || id)
        .join(", ");
    }
    const selected = response.answer?.mcqSelected;
    if (!selected) return "-";
    return options.find((option) => String(option._id) === String(selected))?.text || selected;
  };

  const runContestAction = async (action: "release-answer-key" | "open-claims" | "close-claims" | "finalize-ratings") => {
    if (!selectedContestId) return;
    if (selectedContest && !confirm(getContestActionSafetyMessage(action, selectedContest, selectedContestMetrics, ratingPreview))) {
      return;
    }
    const res = await fetch(`/api/admin/contests/${selectedContestId}/${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.success(data.rating?.message || "Contest lifecycle updated");
      fetchContests();
      fetchRatingPreview();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "Contest action failed");
    }
  };

  const setContestLifecycle = async (lifecycle: string) => {
    if (!selectedContest) return;
    if (!confirm(getLifecycleSafetyMessage(selectedContest, lifecycle, selectedContestMetrics))) {
      return;
    }
    const res = await fetch(`/api/admin/contests/${selectedContest._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        lifecycle,
        status: statusForLifecycle(lifecycle),
      }),
    });
    if (res.ok) {
      toast.success(`Contest moved to ${lifecycle.replace(/_/g, " ")}`);
      fetchContests();
      fetchRatingPreview();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "Failed to update contest lifecycle");
    }
  };

  const updateClaim = async (claimId: string, status: string) => {
    if (!selectedContestId) return;
    const res = await fetch(`/api/admin/contests/${selectedContestId}/claims/${claimId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminResponse: claimResponses[claimId] || "" }),
    });
    if (res.ok) {
      toast.success("Claim updated");
      fetchAdminClaims();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "Failed to update claim");
    }
  };

  const syncLifecycleNow = async () => {
    const res = await fetch("/api/admin/contests/sync-lifecycle", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(`Lifecycle sync checked ${data.checked || 0} contests, updated ${data.changed || 0}`);
      fetchContests();
      fetchRatingPreview();
      fetchAdminStandings();
    } else {
      toast.error(data.message || "Lifecycle sync failed");
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-4 py-8">
        <div className="h-24 animate-pulse rounded-sm border border-border bg-secondary/30" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-28 animate-pulse rounded-sm border border-border bg-secondary/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-sm border border-border bg-card">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
              <Trophy size={14} />
              Contest Management
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Contest Command Center</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Build contests in focused stages, then move them through registration, live, review, and results with dedicated controls.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
            <button
              type="button"
              onClick={beginNewContest}
              className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
            >
              <Plus size={13} />
              New Contest
            </button>
            <button type="button" onClick={syncLifecycleNow} className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs">
              <Radio size={13} />
              Sync Lifecycle
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["draft", "Draft Builder", "Create, draft, publish, and edit contest setup without mixing it with live controls.", adminContestGroups.draft.length + adminContestGroups.new.length, Plus],
          ["upcoming", "Published Control", "Manage published contests, registration, and launch readiness.", adminContestGroups.upcoming.length + adminContestGroups.live.length, Radio],
          ["past", "Past Archive", "Review completed contest timings, participants, responses, claims, and standings.", adminContestGroups.past.length, BarChart3],
        ].map(([view, title, description, count, Icon]) => {
          const PageIcon = Icon as typeof Plus;
          const active =
            view === "draft"
              ? ["draft", "new"].includes(adminContestView)
              : view === "upcoming"
                ? ["upcoming", "live"].includes(adminContestView)
                : adminContestView === view;
          return (
            <button
              key={view as string}
              type="button"
              onClick={() => (view === "draft" ? beginNewContest() : openContestView(view as AdminContestView))}
              className={`rounded-sm border p-4 text-left transition-colors ${
                active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card hover:bg-secondary/25"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border bg-background">
                  <PageIcon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-3 text-sm font-bold">
                    {title as string}
                    <span className="font-mono text-xs">{String(count)}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description as string}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setLibraryOpen((open) => !open)}
          className="btn-outline inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs"
        >
          <List size={14} />
          {libraryOpen ? "Hide Contest Library" : "Show Contest Library"}
          {libraryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:gap-6">
        <aside
          className={`academic-card overflow-hidden lg:sticky lg:top-4 lg:self-start ${libraryOpen ? "block" : "hidden lg:block"}`}
        >
          <div className="border-b border-border bg-secondary/30 p-4">
            <h3 className="text-sm font-bold text-foreground">Contest Library</h3>
            <p className="mt-1 text-xs text-muted-foreground">Choose a contest from the current workspace page.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {[
                ["draft", "Drafts", adminContestGroups.draft.length],
                ["new", "Recent", adminContestGroups.new.length],
                ["upcoming", "Published", adminContestGroups.upcoming.length],
                ["live", "Live", adminContestGroups.live.length],
                ["past", "Archive", adminContestGroups.past.length],
                ["all", "All", adminContestGroups.all.length],
              ].map(([value, label, count]) => (
                <button
                  key={value as string}
                  type="button"
                  onClick={() => openContestView(value as AdminContestView)}
                  className={`rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                    adminContestView === value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="block font-semibold">{label as string}</span>
                  <span className="font-mono text-[11px]">{String(count)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[32rem] overflow-y-auto p-3">
            {visibleAdminContests.length === 0 ? (
              <div className="rounded-sm border border-border bg-background p-4 text-center">
                <p className="text-xs font-semibold text-foreground">No contests here</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Switch pages or create a new draft contest.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleAdminContests.map((contest) => {
                  const selected = selectedContestId === contest._id;
                  const isPast = isPastContest(contest);
                  const isVisibleInPast = contest.showInPastContests !== false;
                  return (
                    <div
                      key={contest._id}
                      className={`w-full rounded-sm border p-3 text-left transition-colors ${
                        selected ? "border-primary/40 bg-primary/10" : "border-border bg-background hover:bg-secondary/20"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          selectContest(contest._id);
                          setLibraryOpen(false);
                        }}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-foreground">{contest.title}</div>
                            <div className="mt-1 truncate text-[10px] text-muted-foreground">
                              {new Date(contest.startTime).toLocaleString()}
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold ${lifecycleBadgeClass(contest.lifecycle || contest.status, selected)}`}>
                            {labelize(contest.lifecycle || contest.status)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] text-muted-foreground">
                          <span className="rounded-sm border border-border bg-card px-1.5 py-0.5">{getContestTypeLabel(contest.contestType)}</span>
                          <span className="rounded-sm border border-border bg-card px-1.5 py-0.5">{(contest.questions || []).length} problems</span>
                          {contest.ratingEnabled && <span className="rounded-sm border border-green-500/25 bg-green-500/10 px-1.5 py-0.5 text-green-700">Rated</span>}
                        </div>
                      </button>
                      {isPast && (
                        <button
                          type="button"
                          onClick={() => setPastContestVisibility(contest)}
                          className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-sm border px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                            isVisibleInPast
                              ? "border-green-500/25 bg-green-500/10 text-green-700 hover:bg-green-500/15 dark:text-green-300"
                              : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                          title={isVisibleInPast ? "Hide this contest from the public Past Contests list" : "Show this contest in the public Past Contests list"}
                        >
                          {isVisibleInPast ? <Eye size={13} /> : <EyeOff size={13} />}
                          {isVisibleInPast ? "Visible in Past Contests — Hide" : "Hidden from Past Contests — Show"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="academic-card overflow-hidden">
            <div className="border-b border-border bg-secondary/30 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Workspace</div>
                  <h3 className="mt-1 truncate font-serif text-lg font-bold text-foreground">{workspaceTitle}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{workspaceSubtitle}</p>
                  {composingNewContest && (
                    <span className="mt-2 inline-flex rounded-sm border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-700 dark:text-sky-300">
                      New draft
                    </span>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:w-auto">
                  <button type="button" onClick={beginNewContest} className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-xs">
                    <Plus size={13} />
                    New
                  </button>
                  <button
                    type="button"
                    disabled={!showWorkspaceContest}
                    onClick={() => {
                      if (!selectedContest) return;
                      startEdit(selectedContest);
                      setActivePanel("setup");
                    }}
                    className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={!showWorkspaceContest}
                    onClick={() => setActivePanel("lifecycle")}
                    className="btn-primary inline-flex items-center justify-center gap-2 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    <Radio size={13} />
                    Stage
                  </button>
                </div>
              </div>
            </div>

            {showWorkspaceContest || composingNewContest ? (
              <div className="p-4">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Problems", workspaceMetrics.problems, FileQuestion],
                    ["Registered", workspaceMetrics.registered, Users],
                    ["Responses", workspaceMetrics.submissions, BarChart3],
                    ["Locked", workspaceMetrics.locked, Clock3],
                  ].map(([label, value, Icon]) => {
                    const MetricIcon = Icon as typeof FileQuestion;
                    return (
                      <div key={label as string} className="rounded-sm border border-border bg-background p-3">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                          <MetricIcon size={12} />
                          {label as string}
                        </div>
                        <div className="mt-1 font-mono text-lg font-bold text-foreground">{String(value)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {workspaceReadiness.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-sm border p-2 ${
                        item.ready ? "border-green-500/25 bg-green-500/10" : "border-border bg-background"
                      }`}
                    >
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${item.ready ? "text-green-700" : "text-muted-foreground"}`}>
                        <span className={`h-2 w-2 rounded-full ${item.ready ? "bg-green-600" : "bg-muted-foreground/40"}`} />
                        {item.label}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-muted-foreground">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Create a new contest or select an existing one from the library.
              </div>
            )}
          </div>

          <div className="rounded-sm border border-border bg-card p-2">
            <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Workspace Panels</div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
              {managerPanels.map(({ id, label, description, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActivePanel(id)}
                  className={`min-w-[9.5rem] shrink-0 rounded-sm border p-3 text-left transition-colors lg:min-w-0 ${
                    activePanel === id
                      ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]"
                      : "border-border bg-background hover:bg-secondary/25"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-card">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold">{label}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[10px] leading-relaxed text-muted-foreground">{description}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activePanel === "setup" && (
      <form onSubmit={handleSubmit} className="academic-card space-y-6 p-4 sm:p-6">
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h3 className="text-sm font-bold text-foreground">Contest Basics</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Name, summary, and how the contest appears to users.</p>
          </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold">Contest Name</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. GATE DA Weekly Mock #25"
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Display Meta</label>
            <input
              value={form.meta}
              onChange={(e) => setForm({ ...form, meta: e.target.value })}
              placeholder="Full Length / 65 Questions / 3 Hours"
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h3 className="text-sm font-bold text-foreground">Format & Rules</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Publication stage, contest type, and scoring settings.</p>
          </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold">Publication</label>
            <select
              value={form.lifecycle}
              onChange={(e) => setForm({ ...form, lifecycle: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none"
            >
              <option value="draft">Draft / hidden</option>
              <option value="published">Published / scheduled</option>
              <option value="registration_open">Registration open</option>
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Draft stays admin-only; published and registration open appear on the user contest hub.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Contest Type</label>
            <select
              value={form.contestType}
              onChange={(e) => setForm({ ...form, contestType: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none"
            >
              {contestTypes.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {contestTypes.find(([value]) => value === form.contestType)?.[2] || "Contest format controls how this appears to users."}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Scoring</label>
            <select
              value={form.scoringMode}
              onChange={(e) => setForm({ ...form, scoringMode: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none"
            >
              <option value="gate">GATE Marks</option>
              <option value="icpc">ICPC Penalty</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Wrong Penalty Min.</label>
            <input
              type="number"
              min={0}
              value={form.wrongPenaltyMinutes}
              onChange={(e) => setForm({ ...form, wrongPenaltyMinutes: Number(e.target.value) })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none"
            />
          </div>
        </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h3 className="text-sm font-bold text-foreground">Schedule</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Set an exact end time or a duration. The contest opens and closes automatically on this schedule.</p>
          </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold">Start Date & Time</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => updateStartTime(e.target.value)}
              className={timingInputClass("startTime")}
            />
            {timingErrors.startTime && <p className="mt-1 text-[11px] text-destructive">{timingErrors.startTime}</p>}
          </div>
          <div className="rounded-sm border border-border bg-background p-3 sm:p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="End time input mode">
              <button
                type="button"
                aria-pressed={endTimeMode === "end-time"}
                onClick={() => setEndTimeMode("end-time")}
                className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  endTimeMode === "end-time" ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Exact end time
              </button>
              <button
                type="button"
                aria-pressed={endTimeMode === "duration"}
                onClick={() => setEndTimeMode("duration")}
                className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  endTimeMode === "duration" ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Contest duration
              </button>
            </div>

            {endTimeMode === "end-time" ? (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-bold">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => updateEndTime(e.target.value)}
                  className={timingInputClass("endTime")}
                />
              </div>
            ) : (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-bold" htmlFor="contest-duration-minutes">Duration (minutes)</label>
                <input
                  id="contest-duration-minutes"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={contestDurationMinutes ?? ""}
                  onChange={(e) => setContestDuration(e.target.value)}
                  placeholder="e.g. 180"
                  className={timingInputClass("endTime")}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Changing the start time keeps this duration.</p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Quick adjust</span>
              {[15, 30].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => addMinutesToEndTime(minutes)}
                  className="rounded-sm border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  +{minutes} min
                </button>
              ))}
              {contestDurationMinutes && (
                <span className="ml-auto rounded-sm bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  {contestDurationMinutes} min total
                </span>
              )}
            </div>
            {timingErrors.endTime && <p className="mt-2 text-[11px] text-destructive">{timingErrors.endTime}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold">Registration Opens</label>
            <input
              type="datetime-local"
              value={form.registrationStartTime}
              onChange={(e) => setForm({ ...form, registrationStartTime: e.target.value })}
              className={timingInputClass("registrationStartTime")}
            />
            <p className={`mt-1 text-[11px] ${timingErrors.registrationStartTime ? "text-destructive" : "text-muted-foreground"}`}>
              {timingErrors.registrationStartTime || "Leave blank to auto-open before the contest."}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Registration Closes</label>
            <input
              type="datetime-local"
              value={form.registrationEndTime}
              onChange={(e) => setForm({ ...form, registrationEndTime: e.target.value })}
              className={timingInputClass("registrationEndTime")}
            />
            <p className={`mt-1 text-[11px] ${timingErrors.registrationEndTime ? "text-destructive" : "text-muted-foreground"}`}>
              {timingErrors.registrationEndTime || `Defaults to ${REGISTRATION_CLOSE_BUFFER_MINUTES} minutes before the contest ends.`}
            </p>
          </div>
        </div>
        </section>

        {hasTimingErrors && (
          <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Fix the highlighted timing fields before setting this contest.
          </div>
        )}

        <section className="space-y-3 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Visibility & Features</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Optional contest behavior flags.</p>
          </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["showOnHome", "Show on home"],
            ["showInPastContests", "Show in past contests"],
            ["ratingEnabled", "Rated contest"],
            ["instantFeedback", "Instant feedback"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(form[key as keyof typeof form])}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-sm border border-border px-4 py-2 text-xs">
              Cancel
            </button>
          )}
          <button type="submit" disabled={hasTimingErrors} className="btn-primary flex items-center justify-center gap-1 px-6 py-2 text-xs disabled:opacity-50">
            <Plus size={14} />
            {editingId ? "Update Contest" : "Save Contest"}
          </button>
        </div>
      </form>
      )}

      {activePanel === "problems" && (
      <div className="space-y-4">
        <div className="academic-card p-4">
          <h3 className="text-sm font-bold text-foreground">Problem Workspace Checklist</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Contest saved", showWorkspaceContest, "Save setup before adding problems"],
              ["At least 1 problem", selectedQuestionIds.length > 0, `${selectedQuestionIds.length} selected`],
              ["Changes saved", showWorkspaceContest && !problemsDirty, problemsDirty ? "Unsaved problem changes" : "Problem set matches server"],
              ["Ready to publish", showWorkspaceContest && selectedQuestionIds.length > 0 && !problemsDirty, "Save problems, then move lifecycle"],
            ].map(([label, ready, detail]) => (
              <div
                key={label as string}
                className={`rounded-sm border p-3 text-xs ${ready ? "border-green-500/25 bg-green-500/10" : "border-border bg-background"}`}
              >
                <div className={`font-semibold ${ready ? "text-green-700" : "text-foreground"}`}>{label as string}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{detail as string}</div>
              </div>
            ))}
          </div>
        </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]">
        <div className="academic-card overflow-hidden">
          <div className="border-b border-border bg-secondary/30 p-4">
            <h3 className="text-sm font-bold">Problem Workspace</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Attach approved bank problems or create contest-only problems that stay off the public problem bank.
            </p>
          </div>
          {composingNewContest ? (
            <div className="space-y-3 p-6 text-center">
              <p className="text-sm font-semibold text-foreground">Save the contest first</p>
              <p className="text-xs text-muted-foreground">
                Finish setup and click <strong>Save Contest</strong>. Problem attachment unlocks after the contest has an ID.
              </p>
              <button type="button" onClick={() => setActivePanel("setup")} className="btn-primary px-4 py-2 text-xs">
                Go to Setup
              </button>
            </div>
          ) : showWorkspaceContest && selectedContest ? (
            <div className="p-4">
              <div className="rounded-sm border border-border bg-background p-4">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected Contest</div>
                <h3 className="mt-1 line-clamp-2 text-base font-bold text-foreground">{selectedContest.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <span className="rounded-sm border border-border bg-card px-2 py-0.5">{getContestTypeLabel(selectedContest.contestType)}</span>
                  <span className="rounded-sm border border-border bg-card px-2 py-0.5">{labelize(selectedContest.lifecycle || selectedContest.status)}</span>
                  <span className="rounded-sm border border-border bg-card px-2 py-0.5">{selectedQuestionIds.length} selected</span>
                  {problemsDirty && (
                    <span className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700">Unsaved</span>
                  )}
                </div>
                <div className="mt-4 grid gap-2 text-xs">
                  <div className="rounded-sm border border-border bg-card p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Contest window</div>
                    <div className="mt-1 font-mono text-[10px] leading-relaxed text-foreground">
                      {formatDateTime(selectedContest.startTime)} → {formatDateTime(selectedContest.endTime)}
                    </div>
                  </div>
                  <div className="rounded-sm border border-border bg-card p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Registration</div>
                    <div className="mt-1 font-mono text-[10px] leading-relaxed text-foreground">
                      {formatDateTime(selectedContest.registrationStartTime)} → {formatDateTime(selectedContest.registrationEndTime)}
                    </div>
                  </div>
                  <div className="rounded-sm border border-border bg-card p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Scoring</div>
                    <div className="mt-1 font-semibold text-foreground">
                      {labelize(selectedContest.scoringMode || "gate")} · penalty {selectedContest.wrongPenaltyMinutes ?? 10}m
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => {
                      startEdit(selectedContest);
                      setActivePanel("setup");
                    }}
                    className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-xs"
                  >
                    <Pencil size={13} />
                    Edit Setup
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePanel("lifecycle")}
                    className="btn-primary inline-flex items-center justify-center gap-2 px-3 py-2 text-xs"
                  >
                    <Radio size={13} />
                    Manage Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteContest(selectedContest._id)}
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {workspaceReadiness.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-sm border border-border bg-background p-2 text-xs">
                    <span className={item.ready ? "font-semibold text-green-700" : "text-muted-foreground"}>{item.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Select a saved contest from the library, or create and save a new contest first.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="academic-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Selected Problems</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Attached to this contest. {problemsDirty ? "You have unsaved changes." : "Saved on server."}
                </p>
              </div>
              <span className="rounded-sm border border-border bg-background px-2 py-1 font-mono text-xs text-foreground">
                {selectedQuestionIds.length}
              </span>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {selectedProblems.map((problem, index) => (
                <div key={problem._id} className="rounded-sm border border-primary/25 bg-primary/5 p-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-primary">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="line-clamp-2 text-xs font-semibold text-foreground">{problem.title}</div>
                        {isContestOnlyProblem(problem) && (
                          <span className="shrink-0 rounded-sm border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-violet-700 dark:text-violet-300">
                            Contest-only
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                        {problem.contentId || problem.problemId || problem._id} / {problem.difficulty} / {problem.questionType}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        title="View problem"
                        onClick={() => window.open(`/problems/${problem._id}`, "_blank", "noopener,noreferrer")}
                        className="rounded-sm border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        type="button"
                        title="Remove from contest"
                        onClick={() => toggleQuestion(problem._id)}
                        className="rounded-sm border border-destructive/25 bg-background p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {selectedQuestionIds.length > 0 && selectedProblems.length === 0 && (
                <p className="rounded-sm border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  Selected problem IDs are saved, but their details are still loading. Refresh contests if this remains visible.
                </p>
              )}
              {selectedQuestionIds.length === 0 && (
                <p className="rounded-sm border border-border bg-background p-3 text-xs text-muted-foreground">
                  No problems selected yet. Use the approved-problem search below.
                </p>
              )}
            </div>
          </div>
          <div className="academic-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Create Contest-Only Problem</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  New problems created here are approved for this contest only and do not appear in the public problem bank.
                </p>
              </div>
              <button
                type="button"
                disabled={!showWorkspaceContest}
                onClick={() => setShowContestProblemCreator((open) => !open)}
                className="btn-outline inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-[10px] disabled:opacity-50"
              >
                <Sparkles size={12} />
                {showContestProblemCreator ? "Hide" : "Create"}
              </button>
            </div>
            {showContestProblemCreator && showWorkspaceContest && (
              <div className="mb-4 space-y-3 rounded-sm border border-violet-500/20 bg-violet-500/5 p-3">
                <HierarchyPicker value={problemHierarchy} onChange={setProblemHierarchy} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Title</label>
                    <input
                      value={contestProblemForm.title}
                      onChange={(e) => setContestProblemForm({ ...contestProblemForm, title: e.target.value })}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Type</label>
                    <select
                      value={contestProblemForm.questionType}
                      onChange={(e) => setContestProblemForm({ ...contestProblemForm, questionType: e.target.value })}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="MSQ">MSQ</option>
                      <option value="NAT">NAT</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Difficulty</label>
                    <select
                      value={contestProblemForm.difficulty}
                      onChange={(e) => setContestProblemForm({ ...contestProblemForm, difficulty: e.target.value })}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Statement</label>
                    <textarea
                      value={contestProblemForm.statement}
                      onChange={(e) => setContestProblemForm({ ...contestProblemForm, statement: e.target.value })}
                      rows={3}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Solution</label>
                    <textarea
                      value={contestProblemForm.solution}
                      onChange={(e) => setContestProblemForm({ ...contestProblemForm, solution: e.target.value })}
                      rows={3}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
                {contestProblemForm.questionType !== "NAT" && (
                  <div className="space-y-2">
                    {contestProblemForm.options.map((option, index) => (
                      <label key={index} className="flex items-center gap-2 rounded-sm border border-border bg-background px-2 py-1.5 text-xs">
                        <input
                          type="radio"
                          name="contest-correct-option"
                          checked={option.isCorrect}
                          onChange={() =>
                            setContestProblemForm({
                              ...contestProblemForm,
                              options: contestProblemForm.options.map((entry, i) => ({ ...entry, isCorrect: i === index })),
                            })
                          }
                        />
                        <input
                          value={option.text}
                          onChange={(e) =>
                            setContestProblemForm({
                              ...contestProblemForm,
                              options: contestProblemForm.options.map((entry, i) =>
                                i === index ? { ...entry, text: e.target.value } : entry
                              ),
                            })
                          }
                          placeholder={`Option ${index + 1}`}
                          className="min-w-0 flex-1 bg-transparent outline-none"
                        />
                      </label>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  disabled={creatingContestProblem}
                  onClick={createContestOnlyProblem}
                  className="btn-primary w-full px-4 py-2 text-xs disabled:opacity-60"
                >
                  {creatingContestProblem ? "Creating..." : "Create & attach to contest"}
                </button>
              </div>
            )}

            <div className="mb-4 border-t border-border pt-4">
              <h3 className="text-sm font-bold">Add From Approved Bank</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Search platform problems already approved for general use. Selected items appear above.
              </p>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                placeholder="Search approved problems"
                className="w-full rounded-sm border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
              {candidates.map((problem) => {
                const selected = selectedQuestionIds.includes(problem._id);
                return (
                  <button
                    key={problem._id}
                    type="button"
                    onClick={() => toggleQuestion(problem._id)}
                    className={`flex w-full items-start gap-3 rounded-sm border p-3 text-left ${
                      selected ? "border-primary/30 bg-primary/10" : "border-border bg-background hover:bg-secondary/25"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}>
                      {selected && <Check size={11} />}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-xs font-semibold text-foreground">{problem.title}</span>
                      {isContestOnlyProblem(problem) && (
                        <span className="mt-1 inline-block rounded-sm border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-violet-700">
                          Contest-only
                        </span>
                      )}
                      <span className="mt-1 block truncate font-mono text-[10px] text-muted-foreground">
                        {problem.contentId || problem.problemId || problem._id} / {problem.difficulty} / {problem.questionType}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!showWorkspaceContest}
              onClick={saveContestProblems}
              className="btn-primary mt-4 w-full px-4 py-2 text-xs disabled:opacity-50"
            >
              {problemsDirty ? `Save ${selectedQuestionIds.length} Problems` : `Saved (${selectedQuestionIds.length})`}
            </button>
          </div>
        </div>
      </div>
      </div>
      )}

      {activePanel === "lifecycle" && (
      <div className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <AdminLifecycleRail current={selectedContest?.lifecycle || form.lifecycle} />
          {selectedContest && (
            <div className="academic-card p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected Contest</div>
              <h3 className="mt-1 font-serif text-base font-bold text-foreground">{selectedContest.title}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-sm border border-border bg-background p-2">
                  <div className="text-[10px] text-muted-foreground">Current Stage</div>
                  <div className="font-semibold text-foreground">{selectedContest.lifecycle || selectedContest.status}</div>
                </div>
                <div className="rounded-sm border border-border bg-background p-2">
                  <div className="text-[10px] text-muted-foreground">Problems</div>
                  <div className="font-mono font-semibold text-foreground">{(selectedContest.questions || []).length}</div>
                </div>
                <div className="rounded-sm border border-border bg-background p-2">
                  <div className="text-[10px] text-muted-foreground">Rated</div>
                  <div className="font-semibold text-foreground">{selectedContest.ratingEnabled ? "Yes" : "No"}</div>
                </div>
                <div className="rounded-sm border border-border bg-background p-2">
                  <div className="text-[10px] text-muted-foreground">Scoring</div>
                  <div className="font-semibold text-foreground">{selectedContest.scoringMode || "gate"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="academic-card overflow-hidden">
          <div className="border-b border-border bg-secondary/30 p-3 sm:p-4">
            <h3 className="font-serif text-base font-bold text-foreground">Stage Operations</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Publishing, early start, and post-contest controls stay here. The saved end time remains the contest closure time.
            </p>
          </div>
          <div className="border-b border-border bg-background p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-sm border border-sky-500/25 bg-sky-500/5 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Contest window</div>
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  {selectedContest
                    ? `${formatDateTime(selectedContest.startTime)} to ${formatDateTime(selectedContest.endTime)}`
                    : "Save the contest schedule to enable automatic start and finish."}
                </p>
              </div>
              <div className="rounded-sm border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Registration window</div>
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  {selectedContest
                    ? `${formatDateTime(selectedContest.registrationStartTime)} to ${formatDateTime(selectedContest.registrationEndTime)}`
                    : `Registration closes ${REGISTRATION_CLOSE_BUFFER_MINUTES} minutes before the contest ends.`}
                </p>
              </div>
              <div className="rounded-sm border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Rating Declaration</div>
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  Click <strong>Finalize Results</strong> after claims are closed. The backend locks ranks, applies Elo-style rating deltas, stores RatingHistory, and updates each user rating.
                </p>
              </div>
              <div className="rounded-sm border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Formula</div>
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  Expected score uses 1 / (1 + 10^((opponent - user) / 400)); delta uses K-factor by experience/rating and is clamped between -150 and +150.
                </p>
              </div>
              <div className="rounded-sm border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Visibility</div>
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  Result, answer key, rank, and rating change become visible to participants from the contest room after key/result release stages.
                </p>
              </div>
            </div>
            {selectedContest?.ratingEnabled && (
              <div className="mt-3 rounded-sm border border-border bg-card p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Rating Preview</div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground">
                      {ratingPreview?.message || "Open this panel to calculate projected rating changes before finalizing."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-sm border border-border bg-background px-2 py-1">
                        Participants: {ratingPreview?.participants ?? "-"}
                      </span>
                      <span className="rounded-sm border border-border bg-background px-2 py-1">
                        Changes: {ratingPreview?.count ?? "-"}
                      </span>
                      {ratingPreview?.alreadyApplied && (
                        <span className="rounded-sm border border-green-500/25 bg-green-500/10 px-2 py-1 text-green-700">
                          Already applied
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={fetchRatingPreview} className="btn-outline px-3 py-1.5 text-xs">
                    Refresh Preview
                  </button>
                </div>
                {(ratingPreview?.changes || []).length > 0 && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-sm border border-border">
                    {(ratingPreview?.changes || []).slice(0, 20).map((change) => (
                      <div key={String(change.userId)} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-foreground">{change.fullName}</div>
                          <div className="truncate font-mono text-[10px] text-muted-foreground">Rank #{change.rank}</div>
                        </div>
                        <div className="font-mono text-muted-foreground">
                          {change.oldRating} {"->"} {change.newRating}
                        </div>
                        <div className={`font-mono font-bold ${change.delta >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {change.delta >= 0 ? "+" : ""}{change.delta}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4 p-4">
            {lifecycleActionGroups.map((group) => (
              <section key={group.stage} className="rounded-sm border border-border bg-background p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.stage}</h4>
                  <span className="text-[10px] text-muted-foreground">{group.actions.length} action{group.actions.length === 1 ? "" : "s"}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.actions.map(({ stage, title, description, lifecycle, action, completesAt, Icon, primary }) => {
                    const targetLifecycle = lifecycle || completesAt;
                    const currentLifecycle = selectedContest?.lifecycle;
                    const actionCompleted = Boolean(action && hasReachedLifecycle(currentLifecycle, completesAt));
                    const isCurrent = Boolean(!action && targetLifecycle && currentLifecycle === targetLifecycle);
                    const completed = actionCompleted || Boolean(
                      targetLifecycle &&
                      hasReachedLifecycle(currentLifecycle, targetLifecycle) &&
                      currentLifecycle !== targetLifecycle
                    );
                    const blockedLifecycleMove = Boolean(lifecycle && !canRunLifecycleFrom(currentLifecycle, lifecycle));
                    const actionState = isCurrent ? "current" : completed ? "done" : primary ? "primary" : "idle";
                    return (
                      <button
                        key={title}
                        type="button"
                        disabled={!selectedContestId || Boolean(isCurrent) || actionCompleted || blockedLifecycleMove}
                        onClick={() => lifecycle ? setContestLifecycle(lifecycle) : runContestAction(action!)}
                        className={`rounded-sm border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-80 ${lifecycleActionClass(actionState)}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border ${lifecycleActionIconClass(actionState)}`}>
                            <Icon size={17} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[10px] uppercase tracking-wide opacity-75">{stage}</span>
                            <span className="mt-1 block text-sm font-bold">
                              {isCurrent ? `${title} active` : completed ? `${title} done` : title}
                            </span>
                            <span className={`mt-1 block text-xs leading-relaxed ${actionState === "primary" ? "text-primary-foreground/80" : actionState === "done" || actionState === "current" ? "opacity-80" : "text-muted-foreground"}`}>
                              {description}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      )}

      {activePanel === "monitor" && (
      <div className="academic-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold">{selectedContestIsPast ? "Past Contest Archive" : "Live Monitor"}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedContestIsPast
                ? "Saved timings, student registrations, responses, locks, claims, and final standings for the selected contest."
                : "Admin view of registrations, saved responses, locks, and computed standings for the selected contest."}
            </p>
          </div>
          <button type="button" onClick={fetchAdminStandings} className="btn-outline px-3 py-1.5 text-xs">
            Refresh Standings
          </button>
        </div>
        {selectedContest && (
          <div className="grid gap-3 border-b border-border bg-background p-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Stage", labelize(selectedContest.lifecycle || selectedContest.status)],
              ["Registration", `${formatDateTime(selectedContest.registrationStartTime)} -> ${formatDateTime(selectedContest.registrationEndTime)}`],
              ["Contest Time", `${formatDateTime(selectedContest.startTime)} -> ${formatDateTime(selectedContest.endTime)}`],
              ["Activity", `${selectedContestMetrics.registered} students / ${selectedContestMetrics.submissions} responses`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-sm border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-1 break-words text-xs font-semibold leading-relaxed text-foreground">{value}</div>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3 p-3 sm:p-4 lg:hidden">
          {adminStandings.map((row) => {
            const expanded = expandedParticipantId === row._id;
            return (
              <article key={row._id} className="rounded-sm border border-border bg-card">
                <div className="flex items-start justify-between gap-3 border-b border-border bg-secondary/15 p-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-muted-foreground">Rank #{row.rank || "-"}</div>
                    <div className="mt-0.5 truncate text-sm font-bold text-foreground">{row.user.fullName}</div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">{row.user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-foreground">{row.score}</div>
                    <div className="text-[10px] text-muted-foreground">score</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Status</div>
                    <div className="font-semibold">{row.finishedAt ? "locked" : row.registrationStatus || "standing"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Responses</div>
                    <div className="font-mono">{row.attemptedQuestions ?? 0} q / {row.submissionCount ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Solved</div>
                    <div className="font-mono">{row.solvedCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Wrong</div>
                    <div className="font-mono">{row.wrongAttempts}</div>
                  </div>
                </div>
                <div className="border-t border-border px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setExpandedParticipantId(expanded ? null : row._id)}
                    className="btn-outline w-full px-3 py-1.5 text-[10px]"
                  >
                    {expanded ? "Hide details" : "View details"}
                  </button>
                </div>
                {expanded && (
                  <div className="space-y-3 border-t border-border bg-secondary/10 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Registered", formatDateTime(row.registeredAt)],
                        ["Started", formatDateTime(row.startedAt)],
                        ["Locked", formatDateTime(row.finishedAt)],
                        ["Last Response", formatDateTime(row.lastSubmittedAt)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-sm border border-border bg-background p-2">
                          <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
                          <div className="mt-0.5 font-mono text-[10px]">{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-sm border border-border bg-background">
                      <div className="border-b border-border px-3 py-2 text-xs font-bold">Saved Responses</div>
                      <div className="max-h-64 space-y-0 divide-y divide-border overflow-y-auto">
                        {(row.responses || []).map((response) => (
                          <div key={response._id} className="space-y-1 p-3 text-xs">
                            <div className="font-semibold text-foreground">
                              {response.question?.contentId || response.question?.problemId || response.question?._id || "Question"}
                            </div>
                            <div className="text-muted-foreground">{response.question?.title || "Question details unavailable"}</div>
                            <div className="text-foreground">{formatAdminAnswer(response)}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {response.judgeStatus} / {response.marksAwarded} · {formatDateTime(response.submittedAt)}
                            </div>
                          </div>
                        ))}
                        {(row.responses || []).length === 0 && (
                          <div className="p-4 text-center text-xs text-muted-foreground">No saved responses yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {adminStandings.length === 0 && (
            <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No registrations or standings yet for this contest.
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[52rem] text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground sm:px-4">Rank</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground sm:px-4">User</th>
                <th className="hidden px-3 py-2 text-left font-medium text-muted-foreground md:table-cell sm:px-4">Status</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground sm:px-4">Responses</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground sm:px-4">Score</th>
                <th className="hidden px-3 py-2 text-right font-medium text-muted-foreground lg:table-cell sm:px-4">Visible</th>
                <th className="hidden px-3 py-2 text-right font-medium text-muted-foreground xl:table-cell sm:px-4">Solved</th>
                <th className="hidden px-3 py-2 text-right font-medium text-muted-foreground xl:table-cell sm:px-4">Wrong</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground sm:px-4">Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adminStandings.map((row) => {
                const expanded = expandedParticipantId === row._id;
                return (
                  <Fragment key={row._id}>
                    <tr className="hover:bg-secondary/20">
                      <td className="px-4 py-3 font-mono text-muted-foreground">#{row.rank || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{row.user.fullName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{row.user.email}</div>
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell sm:px-4">
                        <div className="font-semibold text-foreground">{row.finishedAt ? "locked" : row.registrationStatus || "standing"}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {formatDateTime(row.lastSubmittedAt || row.startedAt || row.registeredAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-muted-foreground sm:px-4">
                        {row.attemptedQuestions ?? 0} q / {row.submissionCount ?? 0}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-foreground sm:px-4">{row.score}</td>
                      <td className="hidden px-3 py-3 text-right font-mono text-muted-foreground lg:table-cell sm:px-4">{row.visibleScore}</td>
                      <td className="hidden px-3 py-3 text-right font-mono text-muted-foreground xl:table-cell sm:px-4">{row.solvedCount}</td>
                      <td className="hidden px-3 py-3 text-right font-mono text-muted-foreground xl:table-cell sm:px-4">{row.wrongAttempts}</td>
                      <td className="px-3 py-3 text-right sm:px-4">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-mono text-muted-foreground">{row.penaltyMinutes}</span>
                          <button
                            type="button"
                            onClick={() => setExpandedParticipantId(expanded ? null : row._id)}
                            className="rounded-sm border border-border px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-secondary"
                          >
                            {expanded ? "Hide" : "Details"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-secondary/10">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid gap-3 lg:grid-cols-4">
                            {[
                              ["Registered", formatDateTime(row.registeredAt)],
                              ["Started", formatDateTime(row.startedAt)],
                              ["Locked", formatDateTime(row.finishedAt)],
                              ["Last Response", formatDateTime(row.lastSubmittedAt)],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-sm border border-border bg-background p-3">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
                                <div className="mt-1 font-mono text-[11px] text-foreground">{value}</div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 rounded-sm border border-border bg-background">
                            <div className="border-b border-border px-3 py-2 text-xs font-bold">Saved Responses</div>
                            <div className="max-h-96 overflow-y-auto">
                              {(row.responses || []).map((response) => (
                                <div key={response._id} className="grid gap-2 border-b border-border p-3 text-xs last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_8rem_8rem]">
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-foreground">
                                      {response.question?.contentId || response.question?.problemId || response.question?._id || "Question"}
                                    </div>
                                    <div className="mt-1 line-clamp-2 text-muted-foreground">{response.question?.title || "Question details unavailable"}</div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Answer</div>
                                    <div className="mt-1 line-clamp-2 text-foreground">{formatAdminAnswer(response)}</div>
                                  </div>
                                  <div>
                                    <div className="font-mono text-foreground">Attempt {response.attemptNumber}</div>
                                    <div className={response.isCorrect ? "text-green-600" : "text-destructive"}>
                                      {response.judgeStatus} / {response.marksAwarded}
                                    </div>
                                  </div>
                                  <div className="font-mono text-[11px] text-muted-foreground">
                                    {formatDateTime(response.submittedAt)}
                                  </div>
                                </div>
                              ))}
                              {(row.responses || []).length === 0 && (
                                <div className="p-4 text-center text-xs text-muted-foreground">No saved responses for this participant yet.</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {adminStandings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No registrations or standings yet for this contest.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activePanel === "claims" && (
      <div className="academic-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border bg-secondary/30 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-sm font-bold">Contest Claims Desk</h3>
            <p className="mt-1 text-xs text-muted-foreground">Review every user claim for this contest with question context, response notes, and final decision controls.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button type="button" onClick={() => setActivePanel("lifecycle")} className="btn-primary px-3 py-2 text-xs">
              Lifecycle Actions
            </button>
            <button type="button" onClick={fetchAdminClaims} className="btn-outline px-3 py-2 text-xs">
              Refresh
            </button>
          </div>
        </div>
        <div className="grid gap-3 border-b border-border bg-background p-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Total", claimSummary.total],
            ["Open", claimSummary.pending],
            ["Reviewing", claimSummary.review],
            ["Accepted", claimSummary.accepted],
            ["Rejected", claimSummary.rejected],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-sm border border-border bg-card p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label as string}</div>
              <div className="mt-1 font-mono text-lg font-bold text-foreground">{String(value)}</div>
            </div>
          ))}
        </div>
        <div className="space-y-4 p-4">
          {claimSummary.users.map((group) => (
            <section key={group.email || group.label} className="rounded-sm border border-border bg-background">
              <div className="flex flex-col gap-1 border-b border-border bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{group.label}</h4>
                  {group.email && <p className="font-mono text-[10px] text-muted-foreground">{group.email}</p>}
                </div>
                <span className="rounded-sm border border-border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  {group.claims.length} claim{group.claims.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="divide-y divide-border">
                {group.claims.map((claim) => (
                  <div key={claim._id} className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase ${claimStatusClass(claim.status)}`}>
                          {labelize(claim.status)}
                        </span>
                        <span className="rounded-sm border border-border bg-card px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {labelize(claim.type)}
                        </span>
                        <span className="rounded-sm border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                          {formatDateTime(claim.createdAt)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-foreground">{claim.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {claim.questionId?.contentId || claim.questionId?.problemId || "Contest level"} {claim.questionId?.title ? `/ ${claim.questionId.title}` : ""}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{claim.description}</p>
                      {claim.adminResponse && (
                        <div className="mt-3 rounded-sm border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                          <span className="mb-1 block font-bold text-primary">Current admin response</span>
                          {claim.adminResponse}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Admin Response</label>
                      <textarea
                        value={claimResponses[claim._id] ?? claim.adminResponse ?? ""}
                        onChange={(event) => setClaimResponses({ ...claimResponses, [claim._id]: event.target.value })}
                        rows={5}
                        placeholder="Write the decision note visible to the user"
                        className="w-full rounded-sm border border-border bg-card px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => updateClaim(claim._id, "under_review")} className="rounded-sm border border-border px-2 py-1.5 text-[10px] hover:bg-secondary">
                          Review
                        </button>
                        <button type="button" onClick={() => updateClaim(claim._id, "accepted")} className="rounded-sm border border-green-500/30 px-2 py-1.5 text-[10px] text-green-700 hover:bg-green-500/10">
                          Accept
                        </button>
                        <button type="button" onClick={() => updateClaim(claim._id, "rejected")} className="rounded-sm border border-destructive/30 px-2 py-1.5 text-[10px] text-destructive hover:bg-destructive/10">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {adminClaims.length === 0 && (
            <div className="rounded-sm border border-border bg-background p-8 text-center text-sm text-muted-foreground">
              No claims submitted for this contest.
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
