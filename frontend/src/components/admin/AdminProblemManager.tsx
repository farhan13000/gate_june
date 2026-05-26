import { useState } from "react";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import HierarchyPicker, { type HierarchyPickerValue } from "./HierarchyPicker";
import LatexRenderer from "@/components/LatexRenderer";

const emptyHierarchy: HierarchyPickerValue = {
  subjectId: "",
  chapterId: "",
  topicId: "",
  subtopicId: "",
};

export default function AdminProblemManager() {
  const [hierarchy, setHierarchy] = useState<HierarchyPickerValue>(emptyHierarchy);
  const [labels, setLabels] = useState<Record<string, string | undefined>>({});
  const [form, setForm] = useState({
    title: "",
    statement: "",
    solution: "",
    difficulty: "Medium",
    questionType: "MCQ",
    positiveMarks: 2,
    negativeMarks: 0.66,
    estimatedTime: 180,
    tags: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  });

  const buildPrompt = () => {
    return `You are an elite mathematical problem designer for GATE DA, IIT, IISc, TIFR, and Olympiad-inspired computational mathematics.

TARGET PARAMETERS:
- Subject: ${labels.subject || hierarchy.subjectId}
- Topic: ${labels.topic || hierarchy.topicId}
- Subtopic: ${labels.subtopic || hierarchy.subtopicId}
- Difficulty Level: ${form.difficulty}
- Question Type: ${form.questionType}
- Exam Style: GATE DA + IISc Analytical

CORE PHILOSOPHY:
Generate ORIGINAL, mathematically deep, algorithmically rigorous problems that:
- Test deep understanding (not formula recall)
- Require multi-step analytical reasoning
- Involve hidden mathematical observations or elegant structure
- Fuse multiple concepts naturally
- Reward mathematical maturity
- Encourage abstraction and modeling

DEPTH REQUIREMENTS (${form.difficulty} level):
${form.difficulty === "Hard" ? `
ELITE HARD: Asymptotic reasoning, hidden invariants, optimization insights, Bayesian interpretation, spectral intuition, recursive structure, adversarial edge cases, proof-like reasoning.
` : form.difficulty === "Medium" ? `
ADVANCED MEDIUM: Multi-step reasoning, probabilistic insight, algebraic transformation, graph interpretation, recursive decomposition, constraint propagation.
` : `
FOUNDATIONAL: Conceptual clarity with computational practice, single-step to dual-step reasoning, direct concept application.
`}

MATHEMATICAL RIGOR RULES:
1. Use ONLY this JSON output format (no markdown, no explanations outside JSON):
{
  "title": "Problem Title",
  "topic": "${labels.topic || hierarchy.topicId}",
  "subtopic": "${labels.subtopic || hierarchy.subtopicId}",
  "difficulty": "${form.difficulty}",
  "questionType": "${form.questionType}",
  "statement": "Problem statement with LaTeX formulas using double backslashes: \\\\frac{a}{b}, \\\\sigma, \\\\lambda, etc.",
  "solution": {
    "overview": "Brief solution strategy",
    "steps": ["Step 1 with LaTeX", "Step 2 with LaTeX", "..."],
    "keyObservation": "Hidden insight or elegant observation",
    "finalAnswer": "Answer with precision specification"
  },
  "options": {
    "A": "Option A text with \\\\LaTeX",
    "B": "Option B text with \\\\LaTeX",
    "C": "Option C text with \\\\LaTeX",
    "D": "Option D text with \\\\LaTeX"
  },
  "correctAnswer": "A"
}

2. STRICT LATEX RULES:
- Use ONLY escaped backslashes: \\\\frac, \\\\sigma, \\\\lambda, \\\\mathbf, \\\\text
- NO dollar signs ($)
- NO single backslash (always double: \\\\)
- NO unsupported LaTeX commands
- NO markdown in output
- Compact notation: \\\\mu_{MAP}, \\\\sigma^2, \\\\nabla J

3. DO NOT GENERATE:
- Direct theorem recall
- Standard PYQ clones
- Simple one-step computation
- Trivial matrix calculations
- Coaching-style memory questions

4. DO GENERATE:
- Concept fusion (e.g., Linear Algebra + Probability + Optimization)
- Hidden mathematical observations
- Elegant symmetric structures
- Multi-step analytical decomposition
- Problems with high cognitive depth

VALIDATION BEFORE OUTPUT:
✓ JSON is 100% parsable
✓ All backslashes are double-escaped (\\\\)
✓ All quotes are properly escaped
✓ No markdown pollution
✓ No explanations outside JSON
✓ LaTeX syntax is valid
✓ Problem has exactly one correct answer
✓ Distractors are high-quality (not trivial)

Return ONLY the JSON object. No preamble, no explanation, no markdown.`;
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(buildPrompt());
    toast.success("Prompt copied");
  };

  const handleSubmit = async () => {
    if (!hierarchy.subtopicId) {
      toast.error("Select full hierarchy down to subtopic");
      return;
    }
    const body = {
      subjectId: hierarchy.subjectId,
      chapterId: hierarchy.chapterId,
      topicId: hierarchy.topicId,
      subtopicId: hierarchy.subtopicId,
      topic: labels.topic || hierarchy.topicId,
      title: form.title,
      statement: form.statement,
      solution: form.solution,
      difficulty: form.difficulty,
      questionType: form.questionType,
      options: form.questionType === "NAT" ? [] : form.options,
      markingScheme: { positive: form.positiveMarks, negative: form.negativeMarks },
      estimatedTime: form.estimatedTime,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Problem submitted for review");
      setForm((f) => ({ ...f, title: "", statement: "", solution: "" }));
    } else {
      const d = await res.json();
      toast.error(d.message || "Failed to create");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground mb-2">
        Add problems mapped to subject → chapter → topic → subtopic.
      </p>

      <div className="academic-card p-4 space-y-4">
        <div className="text-xs font-medium text-foreground">1. Taxonomy placement</div>
        <HierarchyPicker value={hierarchy} onChange={setHierarchy} onLabelsChange={setLabels} />
      </div>

      <div className="academic-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-foreground">Structured creation prompt</div>
          <button
            type="button"
            onClick={copyPrompt}
            className="text-xs flex items-center gap-1 px-2 py-1 border border-border rounded-sm hover:bg-secondary"
          >
            <Copy size={12} /> Copy prompt
          </button>
        </div>
        <pre className="text-[11px] font-mono text-muted-foreground bg-secondary/30 p-3 rounded-sm whitespace-pre-wrap border border-border max-h-80 overflow-auto">
          {buildPrompt()}
        </pre>
      </div>

      <div className="academic-card p-4 space-y-4">
        <div className="text-xs font-medium text-foreground">2. Problem details</div>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="px-3 py-2 text-xs border border-border rounded-sm"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            value={form.questionType}
            onChange={(e) => setForm({ ...form, questionType: e.target.value })}
            className="px-3 py-2 text-xs border border-border rounded-sm"
          >
            <option>MCQ</option>
            <option>MSQ</option>
            <option>NAT</option>
          </select>
          <input
            type="number"
            placeholder="Est. time (s)"
            value={form.estimatedTime}
            onChange={(e) => setForm({ ...form, estimatedTime: +e.target.value })}
            className="px-3 py-2 text-xs border border-border rounded-sm"
          />
          <input
            placeholder="Tags (comma)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="px-3 py-2 text-xs border border-border rounded-sm"
          />
        </div>
        <textarea
          placeholder="Statement (LaTeX supported)"
          value={form.statement}
          onChange={(e) => setForm({ ...form, statement: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm font-mono"
        />
        {form.questionType !== "NAT" &&
          form.options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center min-w-0">
              <input
                type="checkbox"
                checked={opt.isCorrect}
                onChange={(e) => {
                  const opts = [...form.options];
                  opts[i] = { ...opts[i], isCorrect: e.target.checked };
                  setForm({ ...form, options: opts });
                }}
              />
              <input
                placeholder={`Option ${i + 1}`}
                value={opt.text}
                onChange={(e) => {
                  const opts = [...form.options];
                  opts[i] = { ...opts[i], text: e.target.value };
                  setForm({ ...form, options: opts });
                }}
                className="flex-1 min-w-0 px-3 py-2 text-xs border border-border rounded-sm"
              />
            </div>
          ))}
        <textarea
          placeholder="Solution (LaTeX or JSON editorial)"
          value={form.solution}
          onChange={(e) => setForm({ ...form, solution: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm font-mono"
        />
        {form.title && (
          <div className="border-t border-border pt-3 text-xs">
            <span className="text-muted-foreground font-mono">Preview: </span>
            <LatexRenderer latex={form.title} />
          </div>
        )}
        <button type="button" onClick={handleSubmit} className="btn-primary px-4 py-2 text-xs flex items-center justify-center gap-1 w-full sm:w-auto">
          <Plus size={14} /> Submit for review
        </button>
      </div>
    </div>
  );
}
