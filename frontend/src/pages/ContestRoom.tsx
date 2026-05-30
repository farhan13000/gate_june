import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock3, Eye, Flag, Gavel, Send } from "lucide-react";
import { toast } from "sonner";
import LatexRenderer from "@/components/LatexRenderer";
import EditorialRenderer from "@/components/EditorialRenderer";
import { useAuth } from "@/contexts/AuthContext";

type ContestQuestion = {
  _id: string;
  title: string;
  contentId?: string;
  topic?: string;
  difficulty: string;
  statement: string;
  questionType: "MCQ" | "MSQ" | "NAT";
  imageUrl?: string;
  markingScheme?: { positive: number; negative: number };
  options?: Array<{ _id: string; text: string; isCorrect?: boolean }>;
  solution?: any;
};

type RoomData = {
  contest: {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    lifecycle?: string;
    contestState: string;
    instantFeedback: boolean;
    questions: ContestQuestion[];
  };
  submissions: any[];
  standing?: {
    score?: number;
    solvedCount?: number;
    penaltyMinutes?: number;
    attemptedCount?: number;
    problemStats?: Array<{ questionId: string; attempts: number; isCorrect?: boolean; marksAwarded?: number }>;
  } | null;
  claims?: Array<any>;
  registration?: { finishedAt?: string | null } | null;
  ratingChange?: {
    oldRating: number;
    newRating: number;
    delta: number;
    rank: number;
    participants: number;
    performanceRating?: number;
  } | null;
  canSubmit: boolean;
  canReveal: boolean;
  claimsOpen: boolean;
};

type StandingRow = {
  _id: string;
  rank: number;
  user: { _id: string; fullName: string; rating: number };
  score: number;
  solvedCount: number;
  penaltyMinutes: number;
  isCurrentUser?: boolean;
};

function formatRemaining(endTime: string) {
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelize(value?: string) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCorrectAnswer(question: ContestQuestion) {
  if (question.questionType === "NAT") {
    const solution = question.solution;
    if (solution && typeof solution === "object") {
      return solution.finalAnswer || solution.final_answer || solution.answer || "";
    }
    return "";
  }
  return (question.options || [])
    .filter((option) => option.isCorrect)
    .map((option) => option.text);
}

function claimStatusClass(status?: string) {
  if (status === "accepted") return "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300";
  if (status === "rejected") return "border-destructive/25 bg-destructive/10 text-destructive";
  if (status === "under_review") return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "open") return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  return "border-border bg-background text-muted-foreground";
}

export default function ContestRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState<string | null>(null);
  const [msqSelected, setMsqSelected] = useState<string[]>([]);
  const [natAnswer, setNatAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [standingMeta, setStandingMeta] = useState({ frozen: false, final: false });
  const [claimForm, setClaimForm] = useState({ type: "answer_key", title: "", description: "" });
  const [claimQuestionId, setClaimQuestionId] = useState("");

  const loadRoom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contests/${id}/room`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load contest room");
      setRoom(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load contest room");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadStandings = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${id}/standings`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setStandings(data.standings || []);
      setStandingMeta({ frozen: Boolean(data.frozen), final: Boolean(data.final) });
    } catch {
      // Standings are auxiliary; keep the room usable if polling fails.
    }
  }, [id]);

  useEffect(() => {
    loadRoom();
    loadStandings();
  }, [loadRoom, loadStandings]);

  useEffect(() => {
    if (room?.canReveal || !room?.canSubmit) return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [room?.canReveal, room?.canSubmit]);

  useEffect(() => {
    const timer = window.setInterval(loadStandings, 5000);
    return () => window.clearInterval(timer);
  }, [loadStandings]);

  useEffect(() => {
    if (!id) return undefined;
    const esUrl = `${import.meta.env.VITE_API_BASE || ""}/api/contests/${id}/standings/stream`;
    const es = new EventSource(esUrl, { withCredentials: true });
    es.addEventListener("standings-update", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setStandings(data.standings || []);
        setStandingMeta({ frozen: Boolean(data.frozen), final: Boolean(data.final) });
        if (data.contestState && data.contestState !== room?.contest.contestState) {
          loadRoom();
        }
      } catch {
        // Keep the last standings snapshot; polling/manual refresh remains available.
      }
    });
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [id, loadRoom, room?.contest.contestState]);

  const questions = room?.contest.questions || [];
  const activeQuestion = questions[activeIndex];
  const submittedByQuestion = useMemo(() => {
    const map = new Map<string, any>();
    (room?.submissions || []).forEach((submission: any) => {
      const key = String(submission.questionId);
      if (!map.has(key)) map.set(key, submission);
    });
    return map;
  }, [room?.submissions]);
  const statsByQuestion = useMemo(() => {
    const map = new Map<string, any>();
    room?.standing?.problemStats?.forEach((stat: any) => map.set(String(stat.questionId), stat));
    return map;
  }, [room?.standing?.problemStats]);
  const claimsByQuestion = useMemo(() => {
    const map = new Map<string, any[]>();
    (room?.claims || []).forEach((claim: any) => {
      const key = String(claim.questionId?._id || claim.questionId || "");
      if (!key) return;
      const list = map.get(key) || [];
      list.push(claim);
      map.set(key, list);
    });
    return map;
  }, [room?.claims]);

  useEffect(() => {
    const submitted = activeQuestion?._id ? submittedByQuestion.get(String(activeQuestion._id)) : null;
    setMcqSelected(submitted?.answer?.mcqSelected || null);
    setMsqSelected(Array.isArray(submitted?.answer?.msqSelected) ? submitted.answer.msqSelected.map(String) : []);
    setNatAnswer(submitted?.answer?.natAnswer || "");
  }, [activeQuestion?._id, submittedByQuestion]);

  const activeSubmission = activeQuestion?._id ? submittedByQuestion.get(String(activeQuestion._id)) : null;
  const activeLocked = Boolean(room?.registration?.finishedAt);
  const attemptedCount = room?.standing?.attemptedCount ?? submittedByQuestion.size;
  const totalQuestions = questions.length;
  const resultsVisible = Boolean(room?.canReveal);
  const timeCard = useMemo(() => {
    if (!room) return { label: "Time", value: "--" };
    if (room.canReveal || ["ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(room.contest.contestState)) {
      return { label: "Ended", value: formatDateTime(room.contest.endTime) };
    }
    if (!room.canSubmit) return { label: "Status", value: "Closed" };
    return { label: "Time Left", value: formatRemaining(room.contest.endTime) };
  }, [room, tick]);
  const claimStats = useMemo(() => {
    const claims = room?.claims || [];
    return {
      total: claims.length,
      open: claims.filter((claim) => claim.status === "open").length,
      review: claims.filter((claim) => claim.status === "under_review").length,
      accepted: claims.filter((claim) => claim.status === "accepted").length,
      rejected: claims.filter((claim) => claim.status === "rejected").length,
    };
  }, [room?.claims]);

  useEffect(() => {
    if (!claimQuestionId && activeQuestion?._id) setClaimQuestionId(activeQuestion._id);
  }, [activeQuestion?._id, claimQuestionId]);

  useEffect(() => {
    if (room?.ratingChange) refreshUser();
  }, [refreshUser, room?.ratingChange]);

  const canSubmitAnswer = () => {
    if (!room?.canSubmit || !activeQuestion || activeLocked) return false;
    if (activeQuestion.questionType === "MCQ") return Boolean(mcqSelected);
    if (activeQuestion.questionType === "MSQ") return msqSelected.length > 0;
    return natAnswer.trim().length > 0;
  };

  const submitAnswer = async () => {
    if (!activeQuestion || !canSubmitAnswer()) return;
    const ok = window.confirm("Save this response? You can update it again until final submit or contest closure.");
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contests/${id}/questions/${activeQuestion._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mcqSelected, msqSelected, natAnswer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit answer");
      toast.success("Response saved. The latest saved response is used for scoring.");
      await loadRoom();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const finishExam = async () => {
    if (!room?.canSubmit) return;
    const unanswered = Math.max(0, totalQuestions - attemptedCount);
    const message =
      unanswered > 0
        ? `Lock this contest attempt now? ${unanswered} question${unanswered === 1 ? "" : "s"} are unanswered. You cannot submit more responses after this.`
        : "Lock this contest attempt now? You cannot change or add responses after this.";
    if (!window.confirm(message)) return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/contests/${id}/finish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to finish contest");
      toast.success("Contest attempt locked. Results will be shown after answer key release.");
      navigate("/contests");
    } catch (error: any) {
      toast.error(error.message || "Failed to finish contest");
    } finally {
      setFinishing(false);
    }
  };

  const submitClaim = async () => {
    if (!claimForm.title.trim() || !claimForm.description.trim()) {
      toast.error("Add claim title and description");
      return;
    }
    try {
      const res = await fetch(`/api/contests/${id}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...claimForm, questionId: claimQuestionId || activeQuestion?._id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to submit claim");
      toast.success("Claim submitted for review");
      setClaimForm({ type: "answer_key", title: "", description: "" });
      loadRoom();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit claim");
    }
  };

  const openClaimForQuestion = (question: ContestQuestion) => {
    setClaimQuestionId(question._id);
    setClaimForm({
      type: "answer_key",
      title: claimForm.title || `Review Q${activeIndex + 1}: ${question.contentId || question.title}`,
      description: claimForm.description,
    });
    window.setTimeout(() => {
      document.getElementById("contest-claims-center")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading contest room...</div>;
  }

  if (!room || !activeQuestion) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Contest room is not available.</p>
        <Link to="/contests" className="mt-4 inline-flex btn-outline px-4 py-2 text-xs">Back to contests</Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/contests" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} />
            Contest Hub
          </Link>
          <h1 className="font-serif text-2xl font-bold text-foreground">{room.contest.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {labelize(room.contest.lifecycle || room.contest.contestState)}
            </span>
            <span className="text-sm text-muted-foreground">{room.contest.description}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:min-w-[28rem] lg:items-end">
          <button
            type="button"
            disabled={!room.canSubmit || finishing || Boolean(room.registration?.finishedAt)}
            onClick={finishExam}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-red-700/50 bg-red-600/10 px-5 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-600/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary/50 disabled:text-muted-foreground w-full lg:w-auto"
          >
            <Flag size={14} />
            {room.registration?.finishedAt ? "Attempt Locked" : "Final Submit Contest"}
          </button>
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-sm border border-border bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{timeCard.label}</div>
              <div className="mt-0.5 font-mono text-base font-bold text-foreground">{timeCard.value}</div>
            </div>
            <div className="rounded-sm border border-border bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{resultsVisible ? "Score" : "Attempted"}</div>
              <div className="mt-0.5 font-mono text-base font-bold text-foreground">
                {resultsVisible ? room.standing?.score ?? 0 : room.standing?.attemptedCount ?? 0}
              </div>
            </div>
            <div className="rounded-sm border border-border bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{resultsVisible ? "Solved" : "Status"}</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {resultsVisible ? room.standing?.solvedCount ?? 0 : room.registration?.finishedAt ? "Submitted" : "Running"}
              </div>
            </div>
            <div className="rounded-sm border border-border bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{resultsVisible ? "Penalty" : "Remaining"}</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {resultsVisible ? room.standing?.penaltyMinutes ?? 0 : Math.max(0, totalQuestions - attemptedCount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {resultsVisible && room.ratingChange && (
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Rating Change</div>
            <div className={`mt-1 font-mono text-2xl font-bold ${room.ratingChange.delta >= 0 ? "text-green-600" : "text-destructive"}`}>
              {room.ratingChange.delta >= 0 ? "+" : ""}{room.ratingChange.delta}
            </div>
          </div>
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">New Rating</div>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">{room.ratingChange.newRating}</div>
          </div>
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Rank</div>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">#{room.ratingChange.rank}</div>
          </div>
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Participants</div>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">{room.ratingChange.participants}</div>
          </div>
        </div>
      )}

      {resultsVisible && !room.ratingChange && (
        <div className="mb-5 rounded-sm border border-border bg-card p-4 text-sm text-muted-foreground">
          Answer key is released. Rating change will appear here after the admin finalizes ratings.
        </div>
      )}

      {/* ── HORIZONTAL QUESTION NAVIGATOR ── */}
      <div className="mb-5 academic-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Navigator</div>
          <div className="group relative">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Show contest response policy"
            >
              <Eye size={13} />
            </button>
            <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-64 rounded-sm border border-border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg group-hover:block">
              Saved responses can be updated until final submit or contest closure. Correctness, score, and solutions are shown only after answer key/result release.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/50">
          {questions.map((question, index) => {
            const stat = statsByQuestion.get(String(question._id));
            const submitted = submittedByQuestion.has(String(question._id));
            return (
              <button
                key={question._id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`flex-shrink-0 flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-xs transition-all ${
                  activeIndex === index ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-background hover:bg-secondary/40"
                }`}
                style={{ minWidth: "120px" }}
              >
                <span className="font-mono font-bold text-[10px] opacity-70">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{question.contentId || question._id.slice(-6)}</span>
                {resultsVisible && stat?.isCorrect && <CheckCircle2 size={12} className="text-green-600 shrink-0" />}
                {!resultsVisible && submitted && <span className="h-2 w-2 rounded-full bg-primary shrink-0 shadow-[0_0_6px_hsla(var(--primary)/0.6)]" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,24rem)]">
        <main className="academic-card min-w-0 p-5 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-border bg-secondary/40 px-2.5 py-1 font-mono text-xs font-bold">
              Q{activeIndex + 1}
            </span>
            <span className="rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {activeQuestion.questionType}
            </span>
            <span className="rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {activeQuestion.difficulty}
            </span>
            <span className="rounded-sm border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold text-primary">
              +{activeQuestion.markingScheme?.positive ?? 1} / -{activeQuestion.markingScheme?.negative ?? 0}
            </span>
            {activeLocked && (
              <span className="rounded-sm border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                Attempt locked
              </span>
            )}
          </div>
          <h2 className="mb-5 font-serif text-xl sm:text-2xl font-bold text-foreground leading-tight">
            <LatexRenderer latex={activeQuestion.title} />
          </h2>
          {activeQuestion.imageUrl && (
            <img src={activeQuestion.imageUrl} alt={activeQuestion.title} className="mb-5 max-h-80 w-full rounded-sm border border-border object-contain bg-secondary/10 p-2" />
          )}
          <div className="prose prose-sm sm:prose-base max-w-none text-foreground/90 leading-relaxed font-serif">
            <LatexRenderer latex={activeQuestion.statement} />
          </div>

          {resultsVisible && (
            <div className="mt-8 border-t border-border pt-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-serif text-lg font-bold">Answer Key</h3>
                {room.claimsOpen && (
                  <button
                    type="button"
                    onClick={() => openClaimForQuestion(activeQuestion)}
                    className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold"
                  >
                    <Gavel size={13} />
                    Claim this question
                  </button>
                )}
              </div>
              <div className="rounded-sm border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
                {Array.isArray(getCorrectAnswer(activeQuestion)) ? (
                  <div className="space-y-2">
                    {(getCorrectAnswer(activeQuestion) as string[]).map((answer, index) => (
                      <div key={`${answer}-${index}`} className="flex gap-2">
                        <span className="font-mono text-primary font-bold">{index + 1}.</span>
                        <LatexRenderer latex={answer} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <LatexRenderer latex={String(getCorrectAnswer(activeQuestion) || "See editorial")} />
                )}
              </div>
              {(claimsByQuestion.get(String(activeQuestion._id)) || []).length > 0 && (
                <div className="mt-5 rounded-sm border border-border bg-background p-4">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Your claims for this question</div>
                  <div className="space-y-3">
                    {(claimsByQuestion.get(String(activeQuestion._id)) || []).map((claim) => (
                      <div key={claim._id} className="rounded-sm border border-border bg-card p-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase ${claimStatusClass(claim.status)}`}>
                            {labelize(claim.status)}
                          </span>
                          <span className="font-semibold text-foreground text-sm">{claim.title}</span>
                        </div>
                        {claim.adminResponse && (
                          <div className="mt-2 rounded-sm border border-primary/20 bg-primary/5 p-3 text-foreground leading-relaxed">
                            <span className="block font-bold text-primary mb-1">Admin response: </span>
                            {claim.adminResponse}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeQuestion.solution && (
                <div className="mt-8">
                  <h3 className="mb-4 font-serif text-lg font-bold border-b border-border pb-2">Editorial Solution</h3>
                  <EditorialRenderer solution={activeQuestion.solution} />
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="academic-card flex flex-col overflow-hidden lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
          <div className="border-b border-border bg-secondary/25 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-foreground">Your Answer</div>
                <div className="mt-1 text-xs text-muted-foreground font-medium">
                  {activeSubmission
                    ? "Latest response saved"
                    : room.registration?.finishedAt
                        ? "Contest attempt locked"
                      : !room.canSubmit
                        ? "Submissions are closed"
                        : "Review carefully before submitting"}
                </div>
              </div>
              {activeSubmission && (
                <span className="rounded-sm border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                  Saved
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-4 p-5 overflow-y-auto custom-scrollbar">
            {activeQuestion.questionType === "NAT" && (
              <input
                value={natAnswer}
                onChange={(event) => setNatAnswer(event.target.value)}
                disabled={activeLocked}
                placeholder="Enter numerical answer"
                className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70 font-mono shadow-sm"
              />
            )}

            {activeQuestion.questionType === "MCQ" && (
              <div className="space-y-2.5">
                {(activeQuestion.options || []).map((option) => (
                  <button
                    key={option._id}
                    type="button"
                    disabled={activeLocked}
                    onClick={() => setMcqSelected(option._id)}
                    className={`w-full rounded-sm border p-4 text-left text-sm disabled:cursor-not-allowed disabled:opacity-75 transition-all ${
                      mcqSelected === option._id ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsla(var(--primary)/1)]" : "border-border bg-background hover:bg-secondary/30 hover:border-muted-foreground/30"
                    }`}
                  >
                    <LatexRenderer latex={option.text} />
                  </button>
                ))}
              </div>
            )}

            {activeQuestion.questionType === "MSQ" && (
              <div className="space-y-2.5">
                {(activeQuestion.options || []).map((option) => {
                  const selected = msqSelected.includes(option._id);
                  return (
                    <button
                      key={option._id}
                      type="button"
                      disabled={activeLocked}
                      onClick={() =>
                        setMsqSelected((current) =>
                          selected ? current.filter((id) => id !== option._id) : [...current, option._id]
                        )
                      }
                      className={`w-full rounded-sm border p-4 text-left text-sm disabled:cursor-not-allowed disabled:opacity-75 transition-all flex items-start gap-3 ${
                        selected ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsla(var(--primary)/1)]" : "border-border bg-background hover:bg-secondary/30 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-colors ${selected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/50 bg-background'}`}>
                        {selected && <CheckCircle2 size={12} />}
                      </div>
                      <div className="flex-1">
                        <LatexRenderer latex={option.text} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-3 border-t border-border p-5 bg-card">
            {!activeLocked && room.canSubmit && (
              <div className="rounded-sm border border-amber-500/25 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200 font-medium">
                Saving again updates your latest response for this question.
              </div>
            )}
            <button
              type="button"
              disabled={!canSubmitAnswer() || submitting}
              onClick={submitAnswer}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
            >
              <Send size={14} />
              {activeSubmission ? "Update Saved Answer" : "Save Answer"}
            </button>
          </div>
        </aside>
      </div>

      <div id="contest-claims-center" className="mt-5 academic-card overflow-hidden scroll-mt-6">
        <div className="flex flex-col gap-2 border-b border-border bg-secondary/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-foreground">{resultsVisible ? "Final Standings" : "Live Standings"}</h2>
            <p className="text-xs text-muted-foreground">
              {standingMeta.final || resultsVisible ? "Final leaderboard and result summary" : standingMeta.frozen ? "Scoreboard is frozen" : "Auto-refreshes every few seconds. Attempts are counted until the answer key is released."}
            </p>
          </div>
          <button type="button" onClick={loadStandings} className="btn-outline px-3 py-1.5 text-xs">
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Rank</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{resultsVisible ? "Solved" : "Attempted"}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {standings.map((row) => (
                <tr key={row._id} className={row.isCurrentUser ? "bg-primary/5" : ""}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{row.rank || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{row.user.fullName}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">Rating {row.user.rating}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{row.score}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.solvedCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.penaltyMinutes}</td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No standings yet. Submissions will appear here once contestants start solving.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 academic-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border bg-secondary/25 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-foreground">Claims Center</h2>
            <p className="text-xs text-muted-foreground">Submit answer-key or marking concerns and track the admin decision for each claim.</p>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
            {[
              ["All", claimStats.total],
              ["Open", claimStats.open],
              ["Review", claimStats.review],
              ["Accepted", claimStats.accepted],
              ["Rejected", claimStats.rejected],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-sm border border-border bg-background px-2 py-1">
                <div className="font-mono font-bold text-foreground">{String(value)}</div>
                <div className="text-muted-foreground">{label as string}</div>
              </div>
            ))}
          </div>
        </div>

        {room.claimsOpen ? (
          <div className="grid gap-4 border-b border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Gavel size={16} />
                New Claim
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={claimForm.type}
                  onChange={(event) => setClaimForm({ ...claimForm, type: event.target.value })}
                  className="rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none"
                >
                  <option value="answer_key">Answer key issue</option>
                  <option value="ambiguous_question">Ambiguous question</option>
                  <option value="marking">Marking issue</option>
                  <option value="technical">Technical issue</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={claimQuestionId}
                  onChange={(event) => setClaimQuestionId(event.target.value)}
                  className="rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none"
                >
                  {questions.map((question, index) => (
                    <option key={question._id} value={question._id}>
                      Q{index + 1}: {question.contentId || question.title}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={claimForm.title}
                onChange={(event) => setClaimForm({ ...claimForm, title: event.target.value })}
                placeholder="Short claim title"
                className="mt-3 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <textarea
                value={claimForm.description}
                onChange={(event) => setClaimForm({ ...claimForm, description: event.target.value })}
                placeholder="Explain the issue clearly with expected correction."
                rows={5}
                className="mt-3 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button type="button" onClick={submitClaim} className="btn-primary mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs">
                <Send size={13} />
                Submit Claim
              </button>
            </div>
            <div className="rounded-sm border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Clock3 size={16} />
                Review Window
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Claims are open for this contest. Submit one focused issue per claim so the admin can review and respond cleanly.
              </p>
            </div>
          </div>
        ) : (
          <div className="border-b border-border bg-background p-4 text-sm text-muted-foreground">
            Claims are not open right now. Existing claims and admin responses remain visible below.
          </div>
        )}

        <div className="divide-y divide-border">
          {(room.claims || []).map((claim) => (
            <div key={claim._id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase ${claimStatusClass(claim.status)}`}>
                      {labelize(claim.status)}
                    </span>
                    <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {labelize(claim.type)}
                    </span>
                    {claim.questionId && (
                      <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        {claim.questionId.contentId || claim.questionId.problemId || claim.questionId.title || "Question"}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-semibold text-foreground">{claim.title}</div>
                  <div className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{claim.description}</div>
                  {claim.adminResponse && (
                    <div className="mt-3 rounded-sm border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                      <span className="mb-1 block font-bold text-primary">Admin response</span>
                      {claim.adminResponse}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(room.claims || []).length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No claims submitted for this contest.</div>
          )}
        </div>
      </div>
    </div>
  );
}
