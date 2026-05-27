import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, Flag, Send } from "lucide-react";
import { toast } from "sonner";
import LatexRenderer from "@/components/LatexRenderer";
import EditorialRenderer from "@/components/EditorialRenderer";

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

export default function ContestRoom() {
  const { id } = useParams();
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
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(loadStandings, 5000);
    return () => window.clearInterval(timer);
  }, [loadStandings]);

  const questions = room?.contest.questions || [];
  const activeQuestion = questions[activeIndex];
  const submittedByQuestion = useMemo(() => {
    const map = new Map<string, any>();
    (room?.submissions || []).forEach((submission: any) => {
      map.set(String(submission.questionId), submission);
    });
    return map;
  }, [room?.submissions]);
  const statsByQuestion = useMemo(() => {
    const map = new Map<string, any>();
    room?.standing?.problemStats?.forEach((stat: any) => map.set(String(stat.questionId), stat));
    return map;
  }, [room?.standing?.problemStats]);

  useEffect(() => {
    const submitted = activeQuestion?._id ? submittedByQuestion.get(String(activeQuestion._id)) : null;
    setMcqSelected(submitted?.answer?.mcqSelected || null);
    setMsqSelected(Array.isArray(submitted?.answer?.msqSelected) ? submitted.answer.msqSelected.map(String) : []);
    setNatAnswer(submitted?.answer?.natAnswer || "");
  }, [activeQuestion?._id, submittedByQuestion]);

  const activeSubmission = activeQuestion?._id ? submittedByQuestion.get(String(activeQuestion._id)) : null;
  const activeLocked = Boolean(activeSubmission || room?.registration?.finishedAt);
  const attemptedCount = room?.standing?.attemptedCount ?? submittedByQuestion.size;
  const totalQuestions = questions.length;

  const canSubmitAnswer = () => {
    if (!room?.canSubmit || !activeQuestion || activeLocked) return false;
    if (activeQuestion.questionType === "MCQ") return Boolean(mcqSelected);
    if (activeQuestion.questionType === "MSQ") return msqSelected.length > 0;
    return natAnswer.trim().length > 0;
  };

  const submitAnswer = async () => {
    if (!activeQuestion || !canSubmitAnswer()) return;
    const ok = window.confirm("Submit this response? You cannot change this question after submission.");
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
      toast.success("Answer submitted. Result will be shown after answer key release.");
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
        ? `Final submit now? ${unanswered} question${unanswered === 1 ? "" : "s"} are unanswered. You cannot submit more responses after this.`
        : "Final submit now? You cannot change or add responses after this.";
    if (!window.confirm(message)) return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/contests/${id}/finish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to finish contest");
      toast.success("Final submission recorded. Results will be shown after answer key release.");
      await loadRoom();
    } catch (error: any) {
      toast.error(error.message || "Failed to finish contest");
    } finally {
      setFinishing(false);
    }
  };

  const submitClaim = async () => {
    if (!activeQuestion || !claimForm.title.trim() || !claimForm.description.trim()) {
      toast.error("Add claim title and description");
      return;
    }
    try {
      const res = await fetch(`/api/contests/${id}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...claimForm, questionId: activeQuestion._id }),
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[28rem]">
          <div className="rounded-sm border border-border bg-card px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Time</div>
            <div className="mt-0.5 font-mono text-base font-bold text-foreground" key={tick}>{formatRemaining(room.contest.endTime)}</div>
          </div>
          <div className="rounded-sm border border-border bg-card px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{room.canReveal ? "Score" : "Attempted"}</div>
            <div className="mt-0.5 font-mono text-base font-bold text-foreground">
              {room.canReveal ? room.standing?.score ?? 0 : room.standing?.attemptedCount ?? 0}
            </div>
          </div>
          <div className="rounded-sm border border-border bg-card px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{room.canReveal ? "Solved" : "Status"}</div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {room.canReveal ? room.standing?.solvedCount ?? 0 : room.registration?.finishedAt ? "Submitted" : "Running"}
            </div>
          </div>
          <div className="rounded-sm border border-border bg-card px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{room.canReveal ? "Penalty" : "Remaining"}</div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {room.canReveal ? room.standing?.penaltyMinutes ?? 0 : Math.max(0, totalQuestions - attemptedCount)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[clamp(13rem,17vw,18rem)_minmax(0,1fr)_minmax(20rem,24rem)]">
        <aside className="academic-card p-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-7rem)] xl:overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Questions</div>
            <div className="group relative">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground hover:text-foreground"
                aria-label="Show contest response policy"
              >
                <Eye size={13} />
              </button>
              <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-64 rounded-sm border border-border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg group-hover:block">
                Each submitted response is locked. Correctness, score, and solutions are shown only after answer key/result release.
              </div>
            </div>
          </div>
          <div className="grid max-h-72 grid-cols-[repeat(auto-fit,minmax(4.8rem,1fr))] gap-2 overflow-y-auto pr-1 xl:max-h-[calc(100vh-17rem)] xl:grid-cols-1">
            {questions.map((question, index) => {
              const stat = statsByQuestion.get(String(question._id));
              const submitted = submittedByQuestion.has(String(question._id));
              return (
                <button
                  key={question._id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex items-center justify-center gap-2 rounded-sm border px-2 py-2 text-xs xl:justify-start ${
                    activeIndex === index ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/30"
                  }`}
                >
                  <span className="font-mono">{String(index + 1).padStart(2, "0")}</span>
                  <span className="hidden min-w-0 flex-1 truncate xl:inline">{question.contentId || question._id.slice(-6)}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    +{question.markingScheme?.positive ?? 1}
                  </span>
                  {room.canReveal && stat?.isCorrect && <CheckCircle2 size={12} className="text-green-600" />}
                  {!room.canReveal && submitted && <span className="h-2 w-2 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-sm border border-border bg-background p-2">
              <div className="text-[10px] text-muted-foreground">Attempted</div>
              <div className="font-mono font-bold text-foreground">{attemptedCount}/{totalQuestions}</div>
            </div>
            <div className="rounded-sm border border-border bg-background p-2">
              <div className="text-[10px] text-muted-foreground">Locked</div>
              <div className="font-mono font-bold text-foreground">{room.registration?.finishedAt ? "Yes" : "No"}</div>
            </div>
          </div>
          {room.canReveal && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs xl:grid-cols-1">
            <div className="rounded-sm border border-border bg-background p-2">
              <div className="text-[10px] text-muted-foreground">Score</div>
              <div className="font-mono font-bold">{room.standing?.score ?? 0}</div>
            </div>
            <div className="rounded-sm border border-border bg-background p-2">
              <div className="text-[10px] text-muted-foreground">Solved</div>
              <div className="font-mono font-bold">{room.standing?.solvedCount ?? 0}</div>
            </div>
            <div className="rounded-sm border border-border bg-background p-2">
              <div className="text-[10px] text-muted-foreground">Penalty</div>
              <div className="font-mono font-bold">{room.standing?.penaltyMinutes ?? 0}</div>
            </div>
          </div>
          )}
        </aside>

        <main className="academic-card min-w-0 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-border bg-secondary/40 px-2 py-1 font-mono text-[11px]">
              Q{activeIndex + 1}
            </span>
            <span className="rounded-sm border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
              {activeQuestion.questionType}
            </span>
            <span className="rounded-sm border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
              {activeQuestion.difficulty}
            </span>
            <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-[11px] text-primary">
              +{activeQuestion.markingScheme?.positive ?? 1} / -{activeQuestion.markingScheme?.negative ?? 0}
            </span>
            {activeLocked && (
              <span className="rounded-sm border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                Response locked
              </span>
            )}
          </div>
          <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
            <LatexRenderer latex={activeQuestion.title} />
          </h2>
          {activeQuestion.imageUrl && (
            <img src={activeQuestion.imageUrl} alt={activeQuestion.title} className="mb-4 max-h-72 w-full rounded-sm border border-border object-contain" />
          )}
          <div className="prose prose-sm max-w-none text-foreground">
            <LatexRenderer latex={activeQuestion.statement} />
          </div>

          {room.canReveal && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="mb-3 font-serif text-base font-bold">Answer Key</h3>
              <div className="rounded-sm border border-primary/20 bg-primary/10 p-3 text-sm text-foreground">
                {Array.isArray(getCorrectAnswer(activeQuestion)) ? (
                  <div className="space-y-2">
                    {(getCorrectAnswer(activeQuestion) as string[]).map((answer, index) => (
                      <div key={`${answer}-${index}`} className="flex gap-2">
                        <span className="font-mono text-primary">{index + 1}.</span>
                        <LatexRenderer latex={answer} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <LatexRenderer latex={String(getCorrectAnswer(activeQuestion) || "See editorial")} />
                )}
              </div>
              {activeQuestion.solution && (
                <div className="mt-5">
                  <h3 className="mb-3 font-serif text-base font-bold">Editorial</h3>
                  <EditorialRenderer solution={activeQuestion.solution} />
                </div>
              )}
            </div>
          )}

          {room.claimsOpen && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="mb-3 font-serif text-base font-bold">Submit Claim</h3>
              <div className="grid gap-3">
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
                <input
                  value={claimForm.title}
                  onChange={(event) => setClaimForm({ ...claimForm, title: event.target.value })}
                  placeholder="Short claim title"
                  className="rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={claimForm.description}
                  onChange={(event) => setClaimForm({ ...claimForm, description: event.target.value })}
                  placeholder="Explain the issue clearly with expected correction."
                  rows={4}
                  className="rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button type="button" onClick={submitClaim} className="btn-primary justify-self-start px-4 py-2 text-xs">
                  Submit Claim
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="academic-card flex flex-col overflow-hidden">
          <div className="border-b border-border bg-secondary/25 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">Your Answer</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {activeSubmission
                    ? "Submitted and locked"
                    : room.registration?.finishedAt
                      ? "Exam submitted"
                      : !room.canSubmit
                        ? "Submissions are closed"
                        : "Review carefully before submitting"}
                </div>
              </div>
              {activeSubmission && (
                <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  Locked
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3 p-4">
            {activeQuestion.questionType === "NAT" && (
              <input
                value={natAnswer}
                onChange={(event) => setNatAnswer(event.target.value)}
                disabled={activeLocked}
                placeholder="Enter numerical answer"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
              />
            )}

            {activeQuestion.questionType === "MCQ" && (
              <div className="space-y-2">
                {(activeQuestion.options || []).map((option) => (
                  <button
                    key={option._id}
                    type="button"
                    disabled={activeLocked}
                    onClick={() => setMcqSelected(option._id)}
                    className={`w-full rounded-sm border p-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-75 ${
                      mcqSelected === option._id ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary/25"
                    }`}
                  >
                    <LatexRenderer latex={option.text} />
                  </button>
                ))}
              </div>
            )}

            {activeQuestion.questionType === "MSQ" && (
              <div className="space-y-2">
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
                      className={`w-full rounded-sm border p-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-75 ${
                        selected ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary/25"
                      }`}
                    >
                      <LatexRenderer latex={option.text} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-3 border-t border-border p-4">
            {!activeLocked && room.canSubmit && (
              <div className="rounded-sm border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                Once you submit this response, it cannot be changed.
              </div>
            )}
            <button
              type="button"
              disabled={!canSubmitAnswer() || submitting}
              onClick={submitAnswer}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
            >
              <Send size={13} />
              {activeSubmission ? "Answer Submitted" : "Submit Answer"}
            </button>
            <button
              type="button"
              disabled={!room.canSubmit || finishing || Boolean(room.registration?.finishedAt)}
              onClick={finishExam}
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Flag size={13} />
              {room.registration?.finishedAt ? "Exam Submitted" : "Final Submit Exam"}
            </button>
          </div>
        </aside>
      </div>

      <div className="mt-5 academic-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border bg-secondary/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-foreground">Live Standings</h2>
            <p className="text-xs text-muted-foreground">
              {standingMeta.final ? "Final leaderboard" : standingMeta.frozen ? "Scoreboard is frozen" : "Auto-refreshes every few seconds"}
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
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Solved</th>
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
        <div className="border-b border-border bg-secondary/25 px-4 py-3">
          <h2 className="font-serif text-base font-bold text-foreground">My Claims</h2>
          <p className="text-xs text-muted-foreground">Claims become available when the admin opens the review window.</p>
        </div>
        <div className="divide-y divide-border">
          {(room.claims || []).map((claim) => (
            <div key={claim._id} className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-semibold text-foreground">{claim.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{claim.description}</div>
                  {claim.adminResponse && (
                    <div className="mt-2 rounded-sm border border-border bg-secondary/20 p-2 text-xs text-foreground">
                      {claim.adminResponse}
                    </div>
                  )}
                </div>
                <span className="rounded-sm border border-border bg-background px-2 py-1 text-[10px] uppercase text-muted-foreground">
                  {claim.status}
                </span>
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
