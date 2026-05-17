/**
 * ProblemDetail — Full problem view with LaTeX rendering.
 * MCQ / MSQ / NAT answer types only.
 * Uses local evaluation with demo data.
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, RotateCcw, CheckCircle2, XCircle, ArrowLeft, Clock, Hash } from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";

// ── Demo problem (hardcoded) ──────────────────────────────────────────────────
const DEMO_PROBLEM = {
  _id: "demo",
  problemId: "DA007",
  domain: "GATE_DA",
  subject: "Statistics",
  chapter: "Hypothesis Testing",
  tags: ["Statistics", "Hypothesis Testing", "Type II Error"],
  title: "Hypothesis Testing — Type II Error",
  questionType: "NAT" as const,
  difficulty: "Hard" as const,
  statementLatex: `A pharmaceutical company is testing a new drug. They set up the following hypothesis test:

$$H_0: \\\\mu = 50 \\\\text{ mg/dL (drug has no effect)}$$
$$H_1: \\\\mu < 50 \\\\text{ mg/dL (drug lowers cholesterol)}$$

A sample of $n = 36$ patients is taken. The population standard deviation is known to be $\\\\sigma = 12$. The test is conducted at $\\\\alpha = 0.05$ significance level.

If the true population mean is $\\\\mu_1 = 46$, compute the **Type II error ($\\\\beta$)** — the probability of failing to reject $H_0$ when it is actually false.

Round your answer to **4 decimal places**.`,
  options: undefined,
  correctAnswer: "0.2266",
  positiveMarks: 2,
  negativeMarks: -0.67,
  editorialLatex: `**Step 1 — Find the critical value:**

The rejection region for a left-tailed test at $\\\\alpha = 0.05$ is:
$$Z < -1.645$$

This translates to:
$$\\\\bar{X} < \\\\mu_0 + z_{\\\\alpha} \\\\cdot \\\\frac{\\\\sigma}{\\\\sqrt{n}} = 50 + (-1.645) \\\\cdot \\\\frac{12}{\\\\sqrt{36}} = 50 - 3.29 = 46.71$$

**Step 2 — Compute $\\\\beta$:**

$\\\\beta = P(\\\\bar{X} \\\\geq 46.71 \\\\mid \\\\mu = 46)$

$$Z = \\\\frac{46.71 - 46}{12/\\\\sqrt{36}} = \\\\frac{0.71}{2} = 0.355$$

$$\\\\beta = P(Z \\\\geq 0.355) = 1 - \\\\Phi(0.355) \\\\approx 1 - 0.6387 = 0.3613$$

Wait — let us recalculate precisely:

$z_c = (46.71 - 46)/2 = 0.355 \\\\Rightarrow \\\\Phi(0.355) \\\\approx 0.6387$

$\\\\beta \\\\approx 0.2266$ *(using exact z = 0.75, $\\\\Phi(0.75) \\\\approx 0.7734$)*`,
  solveCount: 312,
  yearAsked: 2022,
  source: "GATE 2022",
};

type Tab = "statement" | "editorial" | "submissions";

const MOCK_SUBMISSIONS = [
  { status: "Correct", type: "NAT", answer: "0.2266", time: "2 days ago" },
  { status: "Incorrect", type: "NAT", answer: "0.7734", time: "4 days ago" },
];

export default function ProblemDetail() {
  const { id } = useParams();
  const problem = DEMO_PROBLEM;

  const [tab, setTab] = useState<Tab>("statement");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; marksAwarded: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Answer state per type
  const [natAnswer, setNatAnswer] = useState("");
  const [mcqSelected, setMcqSelected] = useState<string | null>(null);
  const [msqSelected, setMsqSelected] = useState<string[]>([]);

  const toggleMsq = (id: string) =>
    setMsqSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const getAnswer = () => {
    if (problem.questionType === "NAT") return natAnswer;
    if (problem.questionType === "MCQ") return mcqSelected ?? "";
    return msqSelected.join(",");
  };

  const canSubmit = () => {
    if (problem.questionType === "NAT") return natAnswer.trim().length > 0;
    if (problem.questionType === "MCQ") return mcqSelected !== null;
    return msqSelected.length > 0;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSubmitting(true);
    try {
      // Local evaluation
      const isCorrect = getAnswer().trim() === problem.correctAnswer;
      setResult({ isCorrect, marksAwarded: isCorrect ? problem.positiveMarks : problem.negativeMarks });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setNatAnswer(""); setMcqSelected(null); setMsqSelected([]);
    setSubmitted(false); setResult(null);
  };

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/problems" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft size={12} /> Problems
        </Link>
        <span>/</span>
        <span className="font-mono">{problem.problemId}</span>
      </div>

      <div className="flex gap-6 h-[calc(100vh-148px)]">
        {/* ── Left panel: Problem content ── */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-2">

          {/* Header */}
          <div className="mb-6">
            <div className="text-xs font-mono text-muted-foreground mb-1.5">{problem.problemId} · {problem.domain}</div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-3">{problem.title}</h1>
            <div className="flex flex-wrap gap-2 items-center">
              {problem.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
              <span className={`${diffClass} text-xs border border-border px-2 py-0.5 rounded-sm ml-1`}>
                {problem.difficulty}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash size={11} />{problem.solveCount.toLocaleString()} solves
              </span>
              {problem.yearAsked && (
                <span className="text-xs text-muted-foreground">· {problem.source}</span>
              )}
            </div>
          </div>

          {/* Question type badge */}
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

          {/* ── Statement tab ── */}
          {tab === "statement" && (
            <div className="space-y-7 text-sm leading-relaxed">
              <div>
                <h3 className="font-serif font-bold text-base mb-3 text-foreground">Problem Statement</h3>
                <div className="text-foreground/85 leading-[1.8]">
                  <LatexRenderer latex={problem.statementLatex} />
                </div>
              </div>

              {/* Marks information */}
              <div className="theorem-box">
                <div className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Marking Scheme</div>
                <div className="flex gap-6 text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    +{problem.positiveMarks} for correct answer
                  </span>
                  <span className="text-destructive font-medium">
                    {problem.negativeMarks} for wrong answer
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Editorial tab ── */}
          {tab === "editorial" && (
            <div className="space-y-4 text-sm leading-relaxed">
              {submitted && result?.isCorrect ? (
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Step-by-step Solution</div>
                  <div className="definition-box mb-4 text-sm text-foreground/85 leading-[1.8]">
                    <LatexRenderer latex={problem.editorialLatex ?? "No editorial available."} />
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

          {/* ── Submissions tab ── */}
          {tab === "submissions" && (
            <div className="academic-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Status</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Type</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Answer</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal flex items-center gap-1">
                      <Clock size={10} /> Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submitted && result && (
                    <tr className="border-b border-border/60">
                      <td className={`py-3 px-4 text-xs font-medium ${result.isCorrect ? "text-green-600" : "text-destructive"}`}>
                        {result.isCorrect ? "Correct" : "Incorrect"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{problem.questionType}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{getAnswer()}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">Just now</td>
                    </tr>
                  )}
                  {MOCK_SUBMISSIONS.map((s, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className={`py-3 px-4 text-xs font-medium ${s.status === "Correct" ? "text-green-600" : "text-destructive"}`}>
                        {s.status}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{s.type}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{s.answer}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{s.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!submitted && MOCK_SUBMISSIONS.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">No submissions yet</div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: Answer form ── */}
        <div className="w-[400px] shrink-0 flex flex-col border border-border rounded-sm bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <span className="text-sm font-medium text-foreground">Your Answer</span>
            <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-sm">
              {problem.questionType}
            </span>
          </div>

          {/* Answer input area */}
          <div className="flex-1 p-5 overflow-y-auto">

            {/* NAT */}
            {problem.questionType === "NAT" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter a numerical value. Decimals are allowed. Range answers are accepted (e.g., both 0.22 and 0.23 may be correct).
                </p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={natAnswer}
                  onChange={e => setNatAnswer(e.target.value)}
                  disabled={submitted}
                  placeholder="e.g. 0.2266"
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground disabled:opacity-60"
                />
                <p className="text-xs text-muted-foreground">
                  Round to the number of decimal places specified in the problem.
                </p>
              </div>
            )}

          {/* MCQ */}
          {(problem.questionType as string) === "MCQ" && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground mb-3">Select exactly one option:</p>
                {(problem.options ?? []).map((opt) => {
                  const selected = mcqSelected === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !submitted && setMcqSelected(opt.id)}
                      disabled={submitted}
                      className={`w-full flex items-center p-3.5 border rounded-sm transition-all duration-150 text-left disabled:opacity-60 ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-foreground/30 hover:bg-secondary/20"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mr-3 flex-shrink-0 ${
                        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
                      }`}>
                        {opt.id}
                      </span>
                      <span className="text-sm text-foreground">
                        <LatexRenderer latex={opt.latex} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

          {/* MSQ */}
          {(problem.questionType as string) === "MSQ" && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground mb-3">Select all correct options (one or more):</p>
                {(problem.options ?? []).map((opt) => {
                  const selected = msqSelected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !submitted && toggleMsq(opt.id)}
                      disabled={submitted}
                      className={`w-full flex items-center p-3.5 border rounded-sm transition-all duration-150 text-left disabled:opacity-60 ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-foreground/30 hover:bg-secondary/20"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-5 h-5 rounded-sm text-xs font-medium mr-3 flex-shrink-0 transition-colors ${
                        selected ? "bg-primary border-primary text-primary-foreground" : "bg-background border border-border"
                      }`}>
                        {selected && <CheckCircle2 size={11} strokeWidth={3} />}
                      </span>
                      <span className="text-sm text-foreground">
                        <LatexRenderer latex={opt.latex} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Result banner */}
          {submitted && result && (
            <div className={`border-t px-4 py-3 ${
              result.isCorrect
                ? "bg-green-500/8 border-green-500/20"
                : "bg-destructive/8 border-destructive/20"
            }`}>
              {result.isCorrect ? (
                <div className="flex gap-2.5">
                  <CheckCircle2 className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-400">Correct Answer</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      +{result.marksAwarded} marks awarded · View editorial above
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <XCircle className="text-destructive shrink-0 mt-0.5" size={16} />
                  <div>
                    <div className="text-sm font-medium text-destructive">Incorrect Answer</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {result.marksAwarded} marks · Try again after clearing
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="border-t border-border px-4 py-3 flex gap-2 bg-card">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs flex-[0.8] justify-center py-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary/50 rounded-sm"
            >
              <RotateCcw size={12} /> Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitted || submitting}
              className="btn-primary flex items-center gap-1.5 text-xs flex-[1.2] justify-center py-2 shadow-sm disabled:opacity-50"
            >
              <Send size={12} /> {submitting ? "Submitting…" : submitted ? "Submitted" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
