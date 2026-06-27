import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  ThumbsUp,
  BookOpen,
  FileText,
  History,
  Award,
  Target,
  Zap,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Hash,
  TrendingUp,
  Timer,
  AlertCircle,
} from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";
import EditorialRenderer from "@/components/EditorialRenderer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmbeddedMediaContent from "@/components/EmbeddedMediaContent";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

type Tab = "statement" | "editorial" | "submissions";

type ProblemNavigation = {
  total: number;
  position: number;
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
};

const isProofProblem = (problem: any): boolean => {
  if (!problem) return false;
  if (problem.questionType === "PROOF") return true;
  const tags = Array.isArray(problem.tags) ? problem.tags.join(" ") : "";
  const title = String(problem.title || "");
  const statement = String(problem.statement || "").trim();
  return /\b(proof|prove)\b/i.test(tags) || /\bprove\s+that\b/i.test(title) || /^(prove|show that)\b/i.test(statement);
};

export default function ProblemDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navigation, setNavigation] = useState<ProblemNavigation | null>(null);
  const [showRelatedTags, setShowRelatedTags] = useState(false);

  const [tab, setTab] = useState<Tab>("statement");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; marksAwarded: number; duplicateCorrect?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerUsed, setTimerUsed] = useState(false);
  const timerStartedAtRef = useRef<number | null>(null);
  const timerAccumulatedRef = useRef(0);
  const detailScrollerRef = useRef<HTMLDivElement>(null);

  // Answer state per type
  const [natAnswer, setNatAnswer] = useState("");
  const [mcqSelected, setMcqSelected] = useState<string | null>(null);
  const [msqSelected, setMsqSelected] = useState<string[]>([]);

  // Submissions list
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Upvote state
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/problems/${id}/submissions`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch {
      setSubmissions([]);
    }
  };

  const currentElapsedSeconds = () => {
    if (timerRunning && timerStartedAtRef.current !== null) {
      return timerAccumulatedRef.current + Math.floor((Date.now() - timerStartedAtRef.current) / 1000);
    }

    return timerAccumulatedRef.current;
  };

  const formatDuration = (seconds?: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  const pauseTimer = () => {
    const nextElapsed = currentElapsedSeconds();
    timerAccumulatedRef.current = nextElapsed;
    timerStartedAtRef.current = null;
    setElapsedSeconds(nextElapsed);
    setTimerRunning(false);
  };

  const resumeTimer = () => {
    if (submitted) return;
    timerStartedAtRef.current = Date.now();
    setTimerUsed(true);
    setTimerRunning(true);
  };

  const resetTimer = (run = true) => {
    timerAccumulatedRef.current = 0;
    timerStartedAtRef.current = run ? Date.now() : null;
    setElapsedSeconds(0);
    setTimerUsed(run);
    setTimerRunning(run);
  };

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setProblem(null);
    setNavigation(null);
    setShowRelatedTags(false);
    setUpvotes(0);
    setHasUpvoted(false);
    resetTimer(false);
    setTab("statement");
    setSubmitted(false);
    setResult(null);
    setNatAnswer("");
    setMcqSelected(null);
    setMsqSelected([]);
    detailScrollerRef.current?.scrollTo({ top: 0, behavior: "auto" });

    fetch(`/api/problems/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Problem not found");
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setProblem(data);
        setUpvotes(data.upvotes || 0);
        setHasUpvoted(Boolean(user && data.upvotedBy?.includes(user.id)));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    fetch(`/api/problems/${id}/navigation${location.search}`, { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setNavigation(data);
      })
      .catch(() => {
        if (!cancelled) setNavigation(null);
      });

    if (isAuthenticated) {
      fetchSubmissions();
    } else {
      setSubmissions([]);
    }

    return () => {
      cancelled = true;
    };
  }, [id, user, isAuthenticated, location.search]);

  useEffect(() => {
    if (!problem || submitted || !timerRunning) return;
    if (timerStartedAtRef.current === null) timerStartedAtRef.current = Date.now();

    const interval = window.setInterval(() => {
      setElapsedSeconds(currentElapsedSeconds());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [problem, submitted, timerRunning]);

  useEffect(() => {
    const handleKeyboardNavigation = (event: KeyboardEvent) => {
      if (event.key !== "[" && event.key !== "]") return;

      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        Boolean(activeElement?.getAttribute("contenteditable"));
      if (isTyping) return;

      const direction = event.key === "[" ? "previous" : "next";
      const destination = navigation?.[direction];
      if (!destination) return;

      event.preventDefault();
      setNavigation(null);
      navigate(`/problems/${destination.id}${location.search}`);
    };

    window.addEventListener("keydown", handleKeyboardNavigation);
    return () => window.removeEventListener("keydown", handleKeyboardNavigation);
  }, [location.search, navigate, navigation]);

  const toggleMsq = (optId: string) =>
    setMsqSelected(prev => prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]);

  const canSubmit = () => {
    if (!problem) return false;
    if (isProofProblem(problem)) return true;
    if (problem.questionType === "NAT") return natAnswer.trim().length > 0;
    if (problem.questionType === "MCQ") return mcqSelected !== null;
    return msqSelected.length > 0;
  };

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to upvote");
      return;
    }
    
    // Optimistic UI update
    setHasUpvoted(!hasUpvoted);
    setUpvotes(prev => hasUpvoted ? prev - 1 : prev + 1);

    try {
      const res = await fetch(`/api/problems/${id}/upvote`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to upvote");
      const data = await res.json();
      setUpvotes(data.upvotes);
      setHasUpvoted(data.hasUpvoted);
    } catch (err) {
      toast.error("Failed to update upvote");
      setHasUpvoted(hasUpvoted); // Revert
      setUpvotes(prev => hasUpvoted ? prev + 1 : prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !problem) return;
    setSubmitting(true);
    const timeTaken = timerUsed ? Math.max(1, currentElapsedSeconds()) : 0;
    
    try {
      const res = await fetch(`/api/problems/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mcqSelected,
          msqSelected,
          natAnswer,
          proofDone: isProofProblem(problem),
          timeTaken
        }),
        credentials: "include"
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit answer");
      }

      const data = await res.json();
      setResult({
        isCorrect: data.submission.isCorrect,
        marksAwarded: data.submission.marksAwarded,
        duplicateCorrect: Boolean(data.duplicateCorrect)
      });
      setSubmitted(true);
      timerAccumulatedRef.current = data.submission.timeTaken ?? timeTaken;
      timerStartedAtRef.current = null;
      setElapsedSeconds(data.submission.timeTaken ?? timeTaken);
      setTimerRunning(false);
      if (data.duplicateCorrect) {
        toast.info("Already solved. This correct submission was not counted again.");
      } else if (isProofProblem(problem)) {
        toast.success("Marked as done.");
      } else if (data.submission.isCorrect) {
        toast.success("Correct answer!");
      } else {
        toast.error("Incorrect answer.");
      }
      
      // Refresh submissions history
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setNatAnswer(""); setMcqSelected(null); setMsqSelected([]);
    setSubmitted(false); setResult(null);
    resetTimer(false);
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center gap-3 animate-in fade-in duration-300">
        <div className="problem-loading-spinner" />
        <span className="text-sm text-muted-foreground">Loading problem...</span>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="w-full py-20 flex flex-col items-center gap-3 animate-in fade-in duration-200">
        <AlertCircle size={32} className="text-destructive" />
        <span className="text-sm text-destructive font-medium">Problem not found.</span>
        <Link to="/problems" className="text-xs text-primary hover:underline mt-2">← Back to Problems</Link>
      </div>
    );
  }

  const qTypeLabel: Record<string, string> = {
    MCQ: "Multiple Choice (1 correct)",
    MSQ: "Multiple Select (1 or more correct)",
    NAT: "Numerical Answer Type",
    PROOF: "Proof / Derivation",
  };

  const qTypeShort: Record<string, string> = {
    MCQ: "MCQ",
    MSQ: "MSQ",
    NAT: "NAT",
    PROOF: "PROOF",
  };

  const difficultyConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    Easy: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-900/50",
      icon: <Zap size={11} />,
    },
    Medium: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-900/50",
      icon: <Target size={11} />,
    },
    Hard: {
      bg: "bg-red-50 dark:bg-red-950/20",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-900/50",
      icon: <Award size={11} />,
    },
  };

  const dc = difficultyConfig[problem.difficulty] || difficultyConfig.Medium;
  const proofProblem = isProofProblem(problem);
  const displayQuestionType = proofProblem ? "PROOF" : problem.questionType;

  const tabConfig: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "statement", label: "Statement", icon: <FileText size={14} /> },
    { key: "editorial", label: "Editorial", icon: <BookOpen size={14} /> },
    { key: "submissions", label: "Submissions", icon: <History size={14} /> },
  ];

  const rawCorrectSubmissions = submissions.filter(s => s.isCorrect).length;
  const correctSubmissions = rawCorrectSubmissions > 0 ? 1 : 0;
  const incorrectSubmissions = submissions.filter(s => !s.isCorrect).length;
  const totalSubmissions = submissions.length;
  const averageTimeTaken = totalSubmissions
    ? Math.round(submissions.reduce((sum, sub) => sum + (sub.timeTaken || 0), 0) / totalSubmissions)
    : 0;
  const optionLabelById = new Map(
    (problem.options || []).map((opt: any, idx: number) => [
      String(opt._id),
      String.fromCharCode(65 + idx),
    ])
  );

  const formatSubmittedAnswer = (sub: any) => {
    if (isProofProblem(problem)) return "Marked done";
    if (sub.natAnswer) return `Value: ${sub.natAnswer}`;
    if (sub.submittedOptionIds?.length) {
      const labels = sub.submittedOptionIds
        .map((optionId: string) => optionLabelById.get(String(optionId)))
        .filter(Boolean);

      return labels.length ? `Selected: ${labels.join(", ")}` : "Selected option";
    }

    return "N/A";
  };

  const navigationParams = new URLSearchParams(location.search);
  const isPyqPracticeSet = navigationParams.get("pyq") === "true";
  const subjectId = navigationParams.get("subjectId");
  const returnPath = isPyqPracticeSet ? `/pyq/${encodeURIComponent(subjectId || "all")}` : "/problems";
  const questionsHref = `${returnPath}${location.search}`;
  const moveToQuestion = (direction: "previous" | "next") => {
    const destination = navigation?.[direction];
    if (destination) {
      setNavigation(null);
      navigate(`/problems/${destination.id}${location.search}`);
    }
  };

  const positiveMarks = problem.markingScheme?.positive ?? 1;
  const negativeMarks = problem.markingScheme?.negative ?? 0;

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <Link to={questionsHref} className="hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft size={12} /> {isPyqPracticeSet ? "PYQ Questions" : "Problems"}
          </Link>
          <ChevronRight size={10} className="text-muted-foreground/50" />
          <span className="text-muted-foreground/70">{problem.topic || "Problem"}</span>
        </div>
        {navigation && (
          <nav className="question-navigation" aria-label="Question navigation">
            <span className="question-navigation-progress">
              Question <strong>{navigation.position}</strong> of {navigation.total}
            </span>
            <div className="question-navigation-actions">
              <button
                type="button"
                onClick={() => moveToQuestion("previous")}
                disabled={!navigation.previous}
                className="question-navigation-button"
                aria-label="Previous question"
                title={navigation.previous ? `Previous: ${navigation.previous.title} ([)` : "No previous question"}
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                type="button"
                onClick={() => moveToQuestion("next")}
                disabled={!navigation.next}
                className="question-navigation-button question-navigation-button-primary"
                aria-label="Next question"
                title={navigation.next ? `Next: ${navigation.next.title} (])` : "No next question"}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="problem-detail-split"
        className="problem-detail-layout"
      >
        {/* ═══ LEFT PANEL ═══ */}
        <ResizablePanel
          defaultSize={68}
          minSize={52}
          maxSize={78}
          order={1}
          className="problem-detail-panel"
        >
        <div ref={detailScrollerRef} className="problem-detail-left">

          {/* ── Problem Header Card ─────────────────────────────── */}
          <div className="problem-header-card">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                {problem.topic && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-muted-foreground font-medium">{problem.topic}</span>
                  </div>
                )}
                {/* Title */}
                <h1 className="font-serif text-lg sm:text-xl font-bold text-foreground mb-2 leading-snug">
                  <LatexRenderer latex={problem.title} />
                </h1>
                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {problem.topic ? problem.topic.split(/\s*[+,]\s*/).map((subTopic: string, idx: number) => (
                    <span
                      key={idx}
                      className="problem-tag-chip"
                    >
                      {subTopic}
                    </span>
                  )) : null}
                  <span className={`problem-difficulty-chip ${dc.bg} ${dc.text} ${dc.border}`}>
                    {dc.icon}
                    {problem.difficulty}
                  </span>
                  <span className="problem-type-chip">
                    {qTypeShort[displayQuestionType] || displayQuestionType}
                  </span>
                  <span
                    className="problem-scoring-chip"
                    aria-label={`Scoring: plus ${positiveMarks} for a correct answer and minus ${negativeMarks} for a wrong answer`}
                    title="Scoring"
                  >
                    <Award size={11} />
                    <span className="text-green-600 dark:text-green-400">+{positiveMarks}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">-{negativeMarks}</span>
                  </span>
                </div>
              </div>

              {/* Upvote button */}
              <button
                onClick={handleUpvote}
                className={`problem-upvote-btn ${hasUpvoted ? 'problem-upvote-btn-active' : ''}`}
              >
                <ThumbsUp size={18} className={hasUpvoted ? "fill-primary/30" : ""} />
                <span className="text-xs font-bold">{upvotes}</span>
              </button>
            </div>

            {/* ── Meta info strip ── */}
            <div className="problem-meta-strip">
              <div className="problem-meta-item">
                <span className="problem-meta-label">Type</span>
                <span className="problem-meta-value">{qTypeLabel[displayQuestionType] || displayQuestionType}</span>
              </div>
              {totalSubmissions > 0 && (
                <>
                  <div className="problem-meta-divider" />
                  <div className="problem-meta-item">
                    <span className="problem-meta-label">Your Attempts</span>
                    <span className="problem-meta-value">
                      <span className="text-green-600 dark:text-green-400">{correctSubmissions}</span>
                      <span className="mx-0.5 text-muted-foreground">/</span>
                      <span>{totalSubmissions}</span>
                    </span>
                  </div>
                </>
              )}
              <div className="problem-meta-divider" />
              <div className="problem-meta-item">
                <span className="problem-meta-label">Upvotes</span>
                <span className="problem-meta-value">{upvotes.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ── Tab Bar ───────────────────────────────────────────── */}
          <div className="problem-tab-bar">
            {tabConfig.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`problem-tab ${tab === t.key ? 'problem-tab-active' : ''}`}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.key === "submissions" && totalSubmissions > 0 && (
                  <span className="problem-tab-badge">{totalSubmissions}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab Content ───────────────────────────────────────── */}
          <div className="problem-tab-content">
            {tab === "statement" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Problem Statement */}
                <section className="problem-statement-section" aria-label="Problem statement">
                  <div className="problem-statement-reading">
                    <div className="problem-statement-body">
                      <EmbeddedMediaContent
                        content={problem.statement}
                        media={problem.images}
                        imageUrl={problem.imageUrl}
                        label="Problem visual"
                        textClassName="problem-statement-text"
                      />
                    </div>
                  </div>
                </section>

                {/* Tags section */}
                {problem.tags && problem.tags.length > 0 && (
                  <section className="problem-related-concepts border-t border-border/60 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRelatedTags((visible) => !visible)}
                      aria-expanded={showRelatedTags}
                      className="flex w-full items-center justify-between gap-3 rounded-sm px-1 py-1.5 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <Hash size={14} className="text-primary" />
                        {showRelatedTags ? "Hide related concepts" : "Show related concepts"}
                        <span className="rounded-full border border-border bg-secondary/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {problem.tags.length}
                        </span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-muted-foreground transition-transform ${showRelatedTags ? "rotate-180" : ""}`}
                      />
                    </button>
                    {showRelatedTags && (
                      <div className="mt-3 flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        {problem.tags.map((tag: string, i: number) => (
                          <span key={i} className="text-[11px] px-2.5 py-1 bg-secondary/60 border border-border rounded-sm text-muted-foreground font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {tab === "editorial" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="rounded-md border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/20 bg-background text-primary">
                      <BookOpen size={17} />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-foreground">Editorial Solution</div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        A guided solution path with strategy, reasoning, key equations, and the final answer.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-foreground/85 leading-[1.8]">
                  <EditorialRenderer solution={problem.solution} />
                </div>
              </div>
            )}

            {tab === "submissions" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="problem-section-header">
                  <History size={14} className="text-primary" />
                  <span>Submission History</span>
                  {totalSubmissions > 0 && (
                    <span className="ml-auto text-xs font-mono text-muted-foreground">
                      {correctSubmissions} correct / {totalSubmissions} total
                    </span>
                  )}
                </div>

                {/* Submission stats summary */}
                {totalSubmissions > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="problem-stat-card">
                      <div className="problem-stat-value">{totalSubmissions}</div>
                      <div className="problem-stat-label">Total Attempts</div>
                    </div>
                    <div className="problem-stat-card">
                      <div className="problem-stat-value text-green-600 dark:text-green-400">{correctSubmissions}</div>
                      <div className="problem-stat-label">Correct</div>
                    </div>
                    <div className="problem-stat-card">
                      <div className="problem-stat-value text-destructive">{incorrectSubmissions}</div>
                      <div className="problem-stat-label">Incorrect</div>
                    </div>
                    <div className="problem-stat-card">
                      <div className="problem-stat-value">{formatDuration(averageTimeTaken)}</div>
                      <div className="problem-stat-label">Avg Time</div>
                    </div>
                  </div>
                )}

                {submissions.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-center bg-card border border-border rounded-sm">
                    <History size={28} className="text-muted-foreground/40" />
                    <div className="text-sm text-muted-foreground">No submissions yet.</div>
                    <div className="text-xs text-muted-foreground/60">Solve the problem to see your history.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-sm bg-card">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20">
                          <th className="text-left py-2.5 px-4 text-muted-foreground font-mono font-medium text-[10px] uppercase">#</th>
                          <th className="text-left py-2.5 px-4 text-muted-foreground font-mono font-medium text-[10px] uppercase">Submitted At</th>
                          <th className="text-left py-2.5 px-4 text-muted-foreground font-mono font-medium text-[10px] uppercase">Status</th>
                          <th className="text-left py-2.5 px-4 text-muted-foreground font-mono font-medium text-[10px] uppercase">Answer Details</th>
                          <th className="text-left py-2.5 px-4 text-muted-foreground font-mono font-medium text-[10px] uppercase">Time</th>
                          <th className="text-left py-2.5 px-4 text-muted-foreground font-mono font-medium text-[10px] uppercase">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub: any, idx: number) => {
                          const date = new Date(sub.createdAt).toLocaleString();
                          return (
                            <tr key={sub._id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                              <td className="py-3 px-4 font-mono text-muted-foreground">{idx + 1}</td>
                              <td className="py-3 px-4 text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={11} className="text-muted-foreground/50" />
                                  {date}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-sm text-[10px] ${
                                  sub.isCorrect 
                                    ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" 
                                    : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                                }`}>
                                  {sub.isCorrect ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                  {sub.isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-muted-foreground">
                                {formatSubmittedAnswer(sub)}
                              </td>
                              <td className="py-3 px-4 font-mono text-muted-foreground">
                                {formatDuration(sub.timeTaken)}
                              </td>
                              <td className={`py-3 px-4 font-mono font-bold ${sub.isCorrect ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                {sub.marksAwarded > 0 ? `+${sub.marksAwarded}` : sub.marksAwarded}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="problem-detail-resize-handle" />

        {/* ═══ RIGHT PANEL — Answer Box ═══ */}
        <ResizablePanel
          defaultSize={32}
          minSize={22}
          maxSize={48}
          order={2}
          className="problem-answer-panel-shell"
        >
        <div className="problem-detail-right">
          <div className="problem-answer-panel">
            {/* Panel Header */}
            <div className="problem-answer-header">
              <div className="flex items-center gap-2">
                <Send size={14} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Your Answer</span>
              </div>
              <span className={`problem-type-chip-sm ${dc.bg} ${dc.text} ${dc.border}`}>
                {displayQuestionType}
              </span>
            </div>

            <div className="border-b border-border bg-secondary/20 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-sm border ${timerRunning && !submitted ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
                    title="Recommended: start the timer while solving so your learning dashboard can track real pacing and time efficiency."
                  >
                    <Timer size={15} />
                  </div>
                  <div>
                    <div className="font-mono text-lg font-bold leading-none text-foreground">
                      {formatDuration(elapsedSeconds)}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {submitted ? "Submitted time" : timerRunning ? "Timer running" : timerUsed ? "Timer stopped" : "Timer idle"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={timerRunning ? pauseTimer : resumeTimer}
                    disabled={submitted}
                    title="Recommended: use the timer so your learning dashboard can track pacing, hesitation, and time efficiency."
                    className="rounded-sm border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {timerRunning ? "Stop" : "Start"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetTimer(false)}
                    className="rounded-sm border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Answer Body */}
            <div className="problem-answer-body">
              {proofProblem && (
                <div className="space-y-3">
                  <div className="rounded-sm border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BookOpen size={14} className="text-primary" />
                      Proof-based problem
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Work through the proof or derivation on paper. When you are satisfied, mark it as done to save your progress and time.
                    </p>
                  </div>
                </div>
              )}

              {!proofProblem && problem.questionType === "NAT" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed flex items-center gap-1.5">
                    <Timer size={12} />
                    Enter a numerical value.
                  </p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={natAnswer}
                    onChange={e => setNatAnswer(e.target.value)}
                    disabled={submitted}
                    placeholder="Type your answer..."
                    className={`w-full px-4 py-3 border rounded-sm bg-background font-mono text-sm focus:outline-none focus:ring-1 text-foreground disabled:opacity-100 transition-all ${
                      submitted 
                        ? (result?.isCorrect ? "border-green-500 bg-green-500/5 text-green-700 font-bold ring-1 ring-green-500/30" : "border-red-500 bg-red-500/5 text-red-600 ring-1 ring-red-500/30") 
                        : "border-border focus:ring-primary focus:border-primary hover:border-muted-foreground/50"
                    }`}
                  />
                  {submitted && !result?.isCorrect && (
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-500/5 border border-red-200 dark:border-red-900/30 p-2.5 rounded-sm animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>Incorrect answer. Check the <strong>Editorial</strong> tab for the step-by-step solution.</span>
                    </div>
                  )}
                </div>
              )}

              {!proofProblem && problem.questionType === "MCQ" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Target size={12} />
                    Select exactly one option:
                  </p>
                  {(problem.options || []).map((opt: any, optIdx: number) => {
                    const selected = mcqSelected === opt._id;
                    let optionStyle = "border-border bg-card hover:bg-secondary/30 hover:border-primary/35";
                    if (submitted) {
                      if (opt.isCorrect) {
                        optionStyle = "border-green-500 bg-green-500/5 text-green-700 font-medium ring-1 ring-green-500/20";
                      } else if (selected) {
                        optionStyle = "border-red-500 bg-red-500/5 text-red-600 ring-1 ring-red-500/20";
                      } else {
                        optionStyle = "border-border bg-background/50 opacity-50";
                      }
                    } else if (selected) {
                      optionStyle = "border-primary bg-primary/5 ring-1 ring-primary/20";
                    }

                    let dotStyle = "border-primary/40 bg-primary/5 text-primary";
                    if (selected) {
                      dotStyle = "bg-primary border-primary text-primary-foreground";
                    }
                    if (submitted && opt.isCorrect) {
                      dotStyle = "bg-green-500 border-green-500 text-white";
                    } else if (submitted && selected && !opt.isCorrect) {
                      dotStyle = "bg-red-500 border-red-500 text-white";
                    }

                    const optionLetter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt._id}
                        onClick={() => !submitted && setMcqSelected(opt._id)}
                        disabled={submitted}
                        className={`problem-option-btn ${optionStyle}`}
                      >
                        <span className={`problem-option-letter ${dotStyle}`}>
                          {submitted && opt.isCorrect ? <CheckCircle2 size={10} className="text-white" /> :
                           submitted && selected && !opt.isCorrect ? <XCircle size={10} className="text-white" /> :
                           <span className="text-[10px] font-mono font-bold text-white">{selected ? '✓' : optionLetter}</span>}
                        </span>
                        <span className="text-sm flex-1"><LatexRenderer latex={opt.text} /></span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!proofProblem && problem.questionType === "MSQ" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Target size={12} />
                    Select all correct options:
                  </p>
                  {(problem.options || []).map((opt: any, optIdx: number) => {
                    const selected = msqSelected.includes(opt._id);
                    let optionStyle = "border-border bg-card hover:bg-secondary/30 hover:border-primary/35";
                    if (submitted) {
                      if (opt.isCorrect) {
                        optionStyle = "border-green-500 bg-green-500/5 text-green-700 font-medium ring-1 ring-green-500/20";
                      } else if (selected) {
                        optionStyle = "border-red-500 bg-red-500/5 text-red-600 ring-1 ring-red-500/20";
                      } else {
                        optionStyle = "border-border bg-background/50 opacity-50";
                      }
                    } else if (selected) {
                      optionStyle = "border-primary bg-primary/5 ring-1 ring-primary/20";
                    }

                    let checkStyle = "border-primary/40 bg-primary/5 text-primary";
                    if (selected) {
                      checkStyle = "bg-primary border-primary text-white";
                    }
                    if (submitted && opt.isCorrect) {
                      checkStyle = "bg-green-500 border-green-500 text-white";
                    } else if (submitted && selected && !opt.isCorrect) {
                      checkStyle = "bg-red-500 border-red-500 text-white";
                    }

                    const optionLetter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt._id}
                        onClick={() => !submitted && toggleMsq(opt._id)}
                        disabled={submitted}
                        className={`problem-option-btn ${optionStyle}`}
                      >
                        <span className={`problem-option-letter problem-option-checkbox ${checkStyle}`}>
                          {selected && !submitted && <CheckCircle2 size={10} />}
                          {submitted && opt.isCorrect && <CheckCircle2 size={10} />}
                          {submitted && selected && !opt.isCorrect && <XCircle size={10} />}
                          {!selected && !submitted && <span className="text-[9px] font-mono text-muted-foreground">{optionLetter}</span>}
                        </span>
                        <span className="text-sm flex-1"><LatexRenderer latex={opt.text} /></span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Result Banner */}
            {submitted && result && (
              <div className={`problem-result-banner ${result.isCorrect ? 'problem-result-correct' : 'problem-result-incorrect'}`}>
                {proofProblem ? (
                  <div className="flex items-center gap-3">
                    <div className="problem-result-icon-correct">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-700 dark:text-green-400">Marked as Done</div>
                      <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">Completed in {formatDuration(elapsedSeconds)}</div>
                    </div>
                  </div>
                ) : result.isCorrect && result.duplicateCorrect ? (
                  <div className="flex items-center gap-3">
                    <div className="problem-result-icon-correct">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-700 dark:text-green-400">Already Solved</div>
                      <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">Correct again, but not counted a second time.</div>
                    </div>
                  </div>
                ) : result.isCorrect ? (
                  <div className="flex items-center gap-3">
                    <div className="problem-result-icon-correct">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-700 dark:text-green-400">Correct Answer!</div>
                      <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">+{result.marksAwarded} marks awarded in {formatDuration(elapsedSeconds)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="problem-result-icon-incorrect">
                      <XCircle size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-destructive">Incorrect Answer</div>
                      <div className="text-xs text-destructive/70 mt-0.5">{result.marksAwarded} marks in {formatDuration(elapsedSeconds)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Footer */}
            <div className="problem-answer-footer">
              <button onClick={handleClear} className="problem-clear-btn">
                <RotateCcw size={12} />
                <span>Clear</span>
              </button>
              {submitted && navigation?.next ? (
                <button onClick={() => moveToQuestion("next")} className="problem-submit-btn">
                  <span>Next Question</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || submitted || submitting}
                  className="problem-submit-btn"
                >
                  {submitting ? (
                    <>
                      <div className="problem-submit-spinner" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>{proofProblem ? "Mark as Done" : "Submit"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
