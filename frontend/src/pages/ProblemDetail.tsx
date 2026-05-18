import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, RotateCcw, CheckCircle2, XCircle, ArrowLeft, Clock, Hash, ThumbsUp } from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Tab = "statement" | "editorial" | "submissions";

export default function ProblemDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("statement");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; marksAwarded: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Answer state per type
  const [natAnswer, setNatAnswer] = useState("");
  const [mcqSelected, setMcqSelected] = useState<string | null>(null);
  const [msqSelected, setMsqSelected] = useState<string[]>([]);

  // Upvote state
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then(res => res.json())
      .then(data => {
        setProblem(data);
        setUpvotes(data.upvotes || 0);
        if (user && data.upvotedBy) {
          setHasUpvoted(data.upvotedBy.includes(user.id));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load problem", err);
        setLoading(false);
      });
  }, [id, user]);

  const toggleMsq = (optId: string) =>
    setMsqSelected(prev => prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]);

  const canSubmit = () => {
    if (!problem) return false;
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
    
    // Local evaluation for now
    let isCorrect = false;
    
    if (problem.questionType === "MCQ") {
      const correctOpt = problem.options.find((o: any) => o.isCorrect);
      isCorrect = correctOpt && correctOpt._id === mcqSelected;
    } else if (problem.questionType === "MSQ") {
      const correctOptIds = problem.options.filter((o: any) => o.isCorrect).map((o: any) => o._id);
      isCorrect = msqSelected.length === correctOptIds.length && msqSelected.every(id => correctOptIds.includes(id));
    } else {
      // For NAT, just a rough check (assumes solution contains the exact text, which might not be true in real scenarios, but we do our best)
      // Since NAT isn't fully structured in the new schema yet, we just check if it contains the answer
      isCorrect = problem.solution.includes(natAnswer.trim());
    }

    setResult({ 
      isCorrect, 
      marksAwarded: isCorrect ? problem.markingScheme.positive : -problem.markingScheme.negative 
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  const handleClear = () => {
    setNatAnswer(""); setMcqSelected(null); setMsqSelected([]);
    setSubmitted(false); setResult(null);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading problem...</div>;
  }

  if (!problem) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-destructive">Problem not found.</div>;
  }

  const diffClass = problem.difficulty === "Hard"
    ? "difficulty-hard" : problem.difficulty === "Medium"
    ? "difficulty-medium" : "difficulty-easy";

  const qTypeLabel: Record<string, string> = {
    MCQ: "Multiple Choice (1 correct)",
    MSQ: "Multiple Select (1 or more correct)",
    NAT: "Numerical Answer Type",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/problems" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft size={12} /> Problems
        </Link>
        <span>/</span>
        <span className="font-mono">{problem._id.substring(0, 8)}</span>
      </div>

      <div className="flex gap-6 h-[calc(100vh-148px)]">
        {/* Left panel */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-2">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-1.5">{problem._id.substring(0, 8)} · {problem.topic}</div>
              <h1 className="font-serif text-2xl font-bold text-foreground mb-3">
                <LatexRenderer latex={problem.title} />
              </h1>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="tag-pill">{problem.topic}</span>
                <span className={`${diffClass} text-xs border border-border px-2 py-0.5 rounded-sm ml-1`}>
                  {problem.difficulty}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash size={11} />{upvotes.toLocaleString()} upvotes
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleUpvote}
              className={`flex flex-col items-center justify-center p-2 rounded-sm border transition-colors ${hasUpvoted ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <ThumbsUp size={20} className={hasUpvoted ? "fill-primary/20" : ""} />
              <span className="text-xs font-bold mt-1">{upvotes}</span>
            </button>
          </div>

          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-primary/8 border border-primary/20 text-primary rounded-sm font-medium">
              {problem.questionType} — {qTypeLabel[problem.questionType]}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6 gap-6">
            {(["statement", "editorial", "submissions"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2 text-sm capitalize transition-colors duration-150 border-b-2 -mb-px ${
                  tab === t ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "statement" && (
            <div className="space-y-7 text-sm leading-relaxed">
              <div>
                <h3 className="font-serif font-bold text-base mb-3 text-foreground">Problem Statement</h3>
                {problem.imageUrl && (
                  <div className="mb-4">
                    <img src={problem.imageUrl} alt="Problem Diagram" className="rounded-xl border border-border max-h-64 object-cover" />
                  </div>
                )}
                <div className="text-foreground/85 leading-[1.8]">
                  <LatexRenderer latex={problem.statement} />
                </div>
              </div>

              <div className="theorem-box">
                <div className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Marking Scheme</div>
                <div className="flex gap-6 text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    +{problem.markingScheme?.positive || 1} for correct answer
                  </span>
                  <span className="text-destructive font-medium">
                    -{problem.markingScheme?.negative || 0} for wrong answer
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === "editorial" && (
            <div className="space-y-4 text-sm leading-relaxed">
              {submitted && result?.isCorrect ? (
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Step-by-step Solution</div>
                  <div className="definition-box mb-4 text-sm text-foreground/85 leading-[1.8]">
                    <LatexRenderer latex={problem.solution} />
                  </div>
                </div>
              ) : (
                <div className="definition-box">
                  <p className="text-sm text-muted-foreground">
                    Submit a correct answer to unlock the full step-by-step editorial.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "submissions" && (
            <div className="py-10 text-center text-sm text-muted-foreground">Submissions not tracked yet.</div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-[400px] shrink-0 flex flex-col border border-border rounded-sm bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <span className="text-sm font-medium text-foreground">Your Answer</span>
            <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-sm">
              {problem.questionType}
            </span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            {problem.questionType === "NAT" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter a numerical value.
                </p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={natAnswer}
                  onChange={e => setNatAnswer(e.target.value)}
                  disabled={submitted}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground disabled:opacity-60"
                />
              </div>
            )}

            {problem.questionType === "MCQ" && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground mb-3">Select exactly one option:</p>
                {(problem.options || []).map((opt: any) => {
                  const selected = mcqSelected === opt._id;
                  return (
                    <button
                      key={opt._id}
                      onClick={() => !submitted && setMcqSelected(opt._id)}
                      disabled={submitted}
                      className={`w-full flex items-center p-3.5 border rounded-sm text-left disabled:opacity-60 ${selected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-secondary/20"}`}
                    >
                      <span className={`w-6 h-6 rounded-full mr-3 border ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border"}`} />
                      <span className="text-sm"><LatexRenderer latex={opt.text} /></span>
                    </button>
                  );
                })}
              </div>
            )}

            {problem.questionType === "MSQ" && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground mb-3">Select all correct options:</p>
                {(problem.options || []).map((opt: any) => {
                  const selected = msqSelected.includes(opt._id);
                  return (
                    <button
                      key={opt._id}
                      onClick={() => !submitted && toggleMsq(opt._id)}
                      disabled={submitted}
                      className={`w-full flex items-center p-3.5 border rounded-sm text-left disabled:opacity-60 ${selected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-secondary/20"}`}
                    >
                      <span className={`w-5 h-5 rounded-sm mr-3 border flex items-center justify-center ${selected ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"}`}>
                        {selected && <CheckCircle2 size={11} />}
                      </span>
                      <span className="text-sm"><LatexRenderer latex={opt.text} /></span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {submitted && result && (
            <div className={`border-t px-4 py-3 ${result.isCorrect ? "bg-green-500/8 border-green-500/20" : "bg-destructive/8 border-destructive/20"}`}>
              {result.isCorrect ? (
                <div className="flex gap-2.5">
                  <CheckCircle2 className="text-green-600 dark:text-green-400 mt-0.5" size={16} />
                  <div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-400">Correct Answer</div>
                    <div className="text-xs text-muted-foreground mt-0.5">+{result.marksAwarded} marks awarded</div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <XCircle className="text-destructive mt-0.5" size={16} />
                  <div>
                    <div className="text-sm font-medium text-destructive">Incorrect Answer</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{result.marksAwarded} marks</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-border px-4 py-3 flex gap-2 bg-card">
            <button onClick={handleClear} className="flex items-center gap-1.5 text-xs flex-[0.8] justify-center py-2 text-muted-foreground hover:bg-secondary/50 rounded-sm">
              <RotateCcw size={12} /> Clear
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit() || submitted || submitting} className="btn-primary flex items-center gap-1.5 text-xs flex-[1.2] justify-center py-2 disabled:opacity-50">
              <Send size={12} /> Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
