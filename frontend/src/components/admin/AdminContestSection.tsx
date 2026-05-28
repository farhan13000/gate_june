import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, BarChart3, Check, Eye, FileQuestion, Flag, Gavel, KeyRound, Pencil, PlayCircle, Plus, Radio, Search, Settings2, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";

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
  updatedAt: string;
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
  lifecycle: "published",
  wrongPenaltyMinutes: 10,
  ratingEnabled: false,
  instantFeedback: false,
  showOnHome: true,
};

const contestTypes = [
  ["full_mock", "Full Mock Test"],
  ["subject_wise", "Subject Wise Test"],
  ["weekly", "Weekly Test"],
  ["challenge_yourself", "Challenge Yourself"],
];

const lifecycleHelp = [
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

const managerPanels = [
  { id: "setup", label: "Setup", description: "Create or edit contest basics", Icon: Settings2 },
  { id: "problems", label: "Problems", description: "Attach approved problem set", Icon: FileQuestion },
  { id: "lifecycle", label: "Lifecycle", description: "Move contest through stages", Icon: Radio },
  { id: "monitor", label: "Monitor", description: "Review live standings", Icon: BarChart3 },
  { id: "claims", label: "Claims", description: "Review submitted appeals", Icon: ShieldCheck },
] as const;

type ManagerPanel = (typeof managerPanels)[number]["id"];
type ContestLifecycleAction = "release-answer-key" | "open-claims" | "close-claims" | "finalize-ratings";
type LifecycleOperation = {
  stage: string;
  title: string;
  description: string;
  lifecycle?: string;
  action?: ContestLifecycleAction;
  Icon: React.ComponentType<{ size?: number }>;
  primary?: boolean;
};

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

const lifecycleActions: LifecycleOperation[] = [
  {
    stage: "Registration",
    title: "Open Registration",
    description: "Allow users to register before the contest begins.",
    lifecycle: "registration_open",
    Icon: Radio,
  },
  {
    stage: "Live",
    title: "Start Contest",
    description: "Open the contest arena and begin accepting submissions.",
    lifecycle: "live",
    Icon: PlayCircle,
  },
  {
    stage: "Live",
    title: "Freeze Leaderboard",
    description: "Keep submissions open while limiting leaderboard visibility.",
    lifecycle: "frozen",
    Icon: ShieldCheck,
  },
  {
    stage: "Closure",
    title: "End Contest",
    description: "Stop new contest submissions and prepare for answer key release.",
    lifecycle: "ended",
    Icon: Flag,
  },
  {
    stage: "Review",
    title: "Release Answer Key",
    description: "Show official answers and solutions to participants.",
    action: "release-answer-key",
    Icon: KeyRound,
  },
  {
    stage: "Review",
    title: "Open Claims",
    description: "Let participants submit answer-key or marking claims.",
    action: "open-claims",
    Icon: Gavel,
  },
  {
    stage: "Review",
    title: "Close Claims",
    description: "Stop new claims after the review window ends.",
    action: "close-claims",
    Icon: Gavel,
  },
  {
    stage: "Results",
    title: "Finalize Results",
    description: "Lock ranks and apply ratings for rated contests.",
    action: "finalize-ratings",
    Icon: Award,
    primary: true,
  },
] as const;

export default function AdminContestSection() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<ProblemCandidate[]>([]);
  const [problemSearch, setProblemSearch] = useState("");
  const [adminStandings, setAdminStandings] = useState<AdminStanding[]>([]);
  const [adminClaims, setAdminClaims] = useState<AdminClaim[]>([]);
  const [claimResponses, setClaimResponses] = useState<Record<string, string>>({});
  const [activePanel, setActivePanel] = useState<ManagerPanel>("setup");
  const [adminContestView, setAdminContestView] = useState<"new" | "upcoming" | "live" | "past" | "all">("new");

  const selectedContest = useMemo(
    () => contests.find((contest) => contest._id === selectedContestId) || null,
    [contests, selectedContestId]
  );

  const fetchContests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setContests(data);
        if (!selectedContestId && data.length > 0) {
          setSelectedContestId(data[0]._id);
          setSelectedQuestionIds((data[0].questions || []).map(getProblemId).filter(Boolean));
        }
      }
    } catch {
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, [selectedContestId]);

  const fetchCandidates = useCallback(async () => {
    const params = new URLSearchParams({ limit: "60" });
    if (problemSearch.trim()) params.set("search", problemSearch.trim());
    const res = await fetch(`/api/admin/contests/problem-candidates?${params}`, { credentials: "include" });
    if (res.ok) setCandidates(await res.json());
  }, [problemSearch]);

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
    fetchAdminClaims();
  }, [fetchAdminClaims]);

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
    const isPast = (contest: Contest) =>
      ["ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(contest.lifecycle || "") ||
      new Date(contest.endTime).getTime() < now;
    return {
      new: contests.filter((contest: any) => new Date(contest.createdAt || contest.startTime).getTime() >= recentlyCreatedCutoff && !isPast(contest)),
      upcoming: contests.filter((contest) => ["published", "registration_open"].includes(contest.lifecycle || "") && !isPast(contest)),
      live: contests.filter((contest) => ["live", "frozen"].includes(contest.lifecycle || "")),
      past: contests.filter(isPast),
      all: contests,
    };
  }, [contests]);

  const visibleAdminContests = adminContestGroups[adminContestView];

  const toLocalInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.startTime || !form.endTime) {
      toast.error("Fill all required fields");
      return;
    }

    const payload = {
      ...form,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      registrationStartTime: form.registrationStartTime ? new Date(form.registrationStartTime).toISOString() : undefined,
      registrationEndTime: form.registrationEndTime ? new Date(form.registrationEndTime).toISOString() : undefined,
      status: form.lifecycle === "finalized" || form.lifecycle === "ratings_applied" ? "completed" : "approved",
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
        toast.success(editingId ? "Contest updated" : "Contest created");
        resetForm();
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
    setEditingId(contest._id);
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
    });
  };

  const deleteContest = async (id: string) => {
    if (!confirm("Delete this contest?")) return;
    try {
      const res = await fetch(`/api/admin/contests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Contest deleted");
        fetchContests();
      }
    } catch {
      toast.error("Network error");
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(id) ? current.filter((questionId) => questionId !== id) : [...current, id]
    );
  };

  const saveContestProblems = async () => {
    if (!selectedContestId) return;
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

  const runContestAction = async (action: "release-answer-key" | "open-claims" | "close-claims" | "finalize-ratings") => {
    if (!selectedContestId) return;
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
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "Contest action failed");
    }
  };

  const setContestLifecycle = async (lifecycle: string) => {
    if (!selectedContest) return;
    const res = await fetch(`/api/admin/contests/${selectedContest._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        lifecycle,
        status: lifecycle === "ended" || lifecycle === "finalized" || lifecycle === "ratings_applied" ? "completed" : "approved",
      }),
    });
    if (res.ok) {
      toast.success(`Contest moved to ${lifecycle.replace(/_/g, " ")}`);
      fetchContests();
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

  if (loading) {
    return <p className="py-8 text-sm text-muted-foreground">Loading contests...</p>;
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="font-serif text-lg font-bold text-foreground">Contest Command Center</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Build contests in focused stages, then move them through registration, live, review, and results with dedicated controls.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {managerPanels.map(({ id, label, description, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActivePanel(id)}
            className={`rounded-sm border p-4 text-left transition-colors ${
              activePanel === id ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]" : "border-border bg-card hover:bg-secondary/25"
            }`}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background">
              <Icon size={17} />
            </div>
            <div className="text-sm font-bold">{label}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </button>
        ))}
      </div>

      {selectedContest && (
        <div className="rounded-sm border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected Contest</div>
              <div className="mt-1 truncate text-sm font-semibold text-foreground">{selectedContest.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(selectedContest.startTime).toLocaleString()} / {selectedContest.contestType || "full_mock"} / {selectedContest.lifecycle || selectedContest.status}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <select
                value={selectedContestId || ""}
                onChange={(event) => setSelectedContestId(event.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none md:w-80"
              >
                {contests.map((contest) => (
                  <option key={contest._id} value={contest._id}>{contest.title}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  startEdit(selectedContest);
                  setActivePanel("setup");
                }}
                className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("lifecycle")}
                className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
              >
                <Radio size={13} />
                Manage Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanel === "setup" && (
      <form onSubmit={handleSubmit} className="academic-card space-y-4 p-4 sm:p-6">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold">Start Date & Time</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">End Date & Time</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold">Registration Opens</label>
            <input
              type="datetime-local"
              value={form.registrationStartTime}
              onChange={(e) => setForm({ ...form, registrationStartTime: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Leave blank to auto-open before the contest.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Registration Closes</label>
            <input
              type="datetime-local"
              value={form.registrationEndTime}
              onChange={(e) => setForm({ ...form, registrationEndTime: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Usually this should match the contest start time.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
          {[
            ["showOnHome", "Show on home"],
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

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-sm border border-border px-4 py-2 text-xs">
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary flex items-center justify-center gap-1 px-6 py-2 text-xs">
            <Plus size={14} />
            {editingId ? "Update Contest" : "Save Contest"}
          </button>
        </div>
      </form>
      )}

      {activePanel === "problems" && (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]">
        <div className="academic-card overflow-hidden">
          <div className="border-b border-border bg-secondary/30 p-4">
            <h3 className="text-sm font-bold">Contest Library</h3>
            <p className="mt-1 text-xs text-muted-foreground">Separate new, upcoming, live, and past contests before attaching problems.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                ["new", "New", adminContestGroups.new.length],
                ["upcoming", "Upcoming", adminContestGroups.upcoming.length],
                ["live", "Live", adminContestGroups.live.length],
                ["past", "Past", adminContestGroups.past.length],
                ["all", "All", adminContestGroups.all.length],
              ].map(([value, label, count]) => (
                <button
                  key={value as string}
                  type="button"
                  onClick={() => setAdminContestView(value as typeof adminContestView)}
                  className={`rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                    adminContestView === value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="font-semibold">{label as string}</span>
                  <span className="ml-2 font-mono">{String(count)}</span>
                </button>
              ))}
            </div>
          </div>
          {visibleAdminContests.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">
              No contests in this group.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {visibleAdminContests.map((contest) => (
                <button
                  key={contest._id}
                  type="button"
                  onClick={() => setSelectedContestId(contest._id)}
                  className={`flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-secondary/20 ${
                    selectedContestId === contest._id ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{contest.title}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {new Date(contest.startTime).toLocaleString()} / {contest.contestType || "full_mock"} /{" "}
                      {contest.scoringMode || "gate"}
                    </span>
                    <span className="mt-2 inline-flex flex-wrap gap-2">
                      <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        {contest.lifecycle || contest.status}
                      </span>
                      <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        {(contest.questions || []).length} problems
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEdit(contest);
                        setActivePanel("setup");
                      }}
                      className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[11px]"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteContest(contest._id);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-sm border border-destructive/30 px-3 py-1.5 text-[11px] text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AdminLifecycleRail current={selectedContest?.lifecycle || form.lifecycle} />
          <div className="academic-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Selected Problems</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  These problems are currently attached to the selected contest.
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
                      <div className="line-clamp-2 text-xs font-semibold text-foreground">{problem.title}</div>
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
            <div className="mb-4">
              <h3 className="text-sm font-bold">Add Approved Problems</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Search and add approved problems. Selected items appear in the panel above.
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
              disabled={!selectedContestId}
              onClick={saveContestProblems}
              className="btn-primary mt-4 w-full px-4 py-2 text-xs disabled:opacity-50"
            >
              Save {selectedQuestionIds.length} Problems
            </button>
          </div>
        </div>
      </div>
      )}

      {activePanel === "lifecycle" && (
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
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
          <div className="border-b border-border bg-secondary/30 p-4">
            <h3 className="font-serif text-base font-bold text-foreground">Stage Operations</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Use these controls for contest operations. Setup fields stay separate from live-stage decisions.
            </p>
          </div>
          <div className="border-b border-border bg-background p-4">
            <div className="grid gap-3 lg:grid-cols-3">
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
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {lifecycleActions.map(({ stage, title, description, lifecycle, action, Icon, primary }) => {
              const isCurrent = lifecycle && selectedContest?.lifecycle === lifecycle;
              return (
                <button
                  key={title}
                  type="button"
                  disabled={!selectedContestId || Boolean(isCurrent)}
                  onClick={() => lifecycle ? setContestLifecycle(lifecycle) : runContestAction(action!)}
                  className={`rounded-sm border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    isCurrent
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : primary
                        ? "border-primary/35 bg-primary text-primary-foreground hover:opacity-90"
                        : "border-border bg-background hover:bg-secondary/25"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border ${
                      primary && !isCurrent ? "border-primary-foreground/30 bg-primary-foreground/10" : "border-border bg-card"
                    }`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide opacity-75">{stage}</span>
                      <span className="mt-1 block text-sm font-bold">{isCurrent ? `${title} active` : title}</span>
                      <span className={`mt-1 block text-xs leading-relaxed ${primary && !isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {description}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {activePanel === "monitor" && (
      <div className="academic-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold">Live Monitor</h3>
            <p className="mt-1 text-xs text-muted-foreground">Admin view of registrations, saved responses, locks, and computed standings for the selected contest.</p>
          </div>
          <button type="button" onClick={fetchAdminStandings} className="btn-outline px-3 py-1.5 text-xs">
            Refresh Standings
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Rank</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Responses</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Visible</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Solved</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Wrong</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adminStandings.map((row) => (
                <tr key={row._id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono text-muted-foreground">#{row.rank || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{row.user.fullName}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{row.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{row.finishedAt ? "locked" : row.registrationStatus || "standing"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {row.lastSubmittedAt ? new Date(row.lastSubmittedAt).toLocaleString() : row.startedAt ? new Date(row.startedAt).toLocaleString() : row.registeredAt ? new Date(row.registeredAt).toLocaleString() : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {row.attemptedQuestions ?? 0} q / {row.submissionCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{row.score}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.visibleScore}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.solvedCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.wrongAttempts}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.penaltyMinutes}</td>
                </tr>
              ))}
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
            <h3 className="text-sm font-bold">Claims Review</h3>
            <p className="mt-1 text-xs text-muted-foreground">Resolve participant appeals after claims are opened from Lifecycle.</p>
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
        <div className="divide-y divide-border">
          {adminClaims.map((claim) => (
            <div key={claim._id} className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {claim.status}
                    </span>
                    <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {claim.type}
                    </span>
                  </div>
                  <div className="mt-2 font-semibold text-foreground">{claim.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {claim.userId?.fullName || claim.userId?.email || "User"} / {claim.questionId?.contentId || claim.questionId?.problemId || "Contest"}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{claim.description}</p>
                </div>
                <div className="w-full shrink-0 xl:w-80">
                  <textarea
                    value={claimResponses[claim._id] ?? claim.adminResponse ?? ""}
                    onChange={(event) => setClaimResponses({ ...claimResponses, [claim._id]: event.target.value })}
                    rows={3}
                    placeholder="Admin response"
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
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
            </div>
          ))}
          {adminClaims.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No claims submitted for this contest.</div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
