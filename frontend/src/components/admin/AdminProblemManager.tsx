import { useState } from "react";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import HierarchyPicker, { type HierarchyPickerValue } from "./HierarchyPicker";
import LatexRenderer from "@/components/LatexRenderer";
import { buildSelectedTaxonomyPrompt } from "@/utils/taxonomyPrompt";

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
    isPyq: false,
    yearAsked: "",
    source: "",
    tags: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  });

  const buildPrompt = () => `Create one original GATE DA problem as valid JSON only.

TAXONOMY TARGET
${buildSelectedTaxonomyPrompt({ ...hierarchy, ...labels })}

SETTINGS
difficulty: ${form.difficulty}
questionType: ${form.questionType}
style: analytical, original, syllabus-aligned, non-template

RULES
- Use the exact taxonomy IDs above. Do not invent taxonomy.
- Return only parsable JSON, no markdown wrapper.
- Use double-escaped LaTeX: "\\\\frac{a}{b}", "\\\\sigma", "\\\\lambda".
- Write the solution as polished paragraphs, not a long numbered list.
- Put diagrams in structured JSON only when useful.

OUTPUT SHAPE
{
  "title": "Problem Title",
  "subjectId": "${hierarchy.subjectId}",
  "chapterId": "${hierarchy.chapterId}",
  "topicId": "${hierarchy.topicId}",
  "subtopicId": "${hierarchy.subtopicId}",
  "topic": "${labels.topic || hierarchy.topicId}",
  "subtopic": "${labels.subtopic || hierarchy.subtopicId}",
  "difficulty": "${form.difficulty}",
  "questionType": "${form.questionType}",
  "statement": "Clear statement with double-escaped LaTeX.",
  "solution": {
    "overview": "One short strategy paragraph.",
    "narrative": [
      "Paragraph 1 of reasoning with LaTeX.",
      "Paragraph 2 connecting the calculation to the answer."
    ],
    "equations": ["\\\\[ important equation \\\\]"],
    "keyInsight": "Main idea behind the solution.",
    "finalAnswer": "Final answer with units/precision if needed."
  },
  "options": [
    { "text": "Option A", "isCorrect": true },
    { "text": "Option B", "isCorrect": false },
    { "text": "Option C", "isCorrect": false },
    { "text": "Option D", "isCorrect": false }
  ],
  "isPyq": false,
  "yearAsked": 2025,
  "source": "GATE 2025 Official",
  "tags": ["concept-1", "concept-2"],
  "diagrams": [
    { "type": "mermaid", "title": "Optional diagram", "code": "graph TD\\\\nA-->B" }
  ]
}`;

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
      isPyq: form.isPyq,
      yearAsked: form.yearAsked ? Number(form.yearAsked) : undefined,
      source: form.source,
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
      <p className="mb-2 text-xs text-muted-foreground">
        Add problems mapped to subject - chapter - topic - subtopic.
      </p>

      <div className="academic-card space-y-4 p-4">
        <div className="text-xs font-medium text-foreground">1. Taxonomy placement</div>
        <HierarchyPicker value={hierarchy} onChange={setHierarchy} onLabelsChange={setLabels} />
      </div>

      <div className="academic-card space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium text-foreground">Compact JSON creation prompt</div>
          <button
            type="button"
            onClick={copyPrompt}
            className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs hover:bg-secondary"
          >
            <Copy size={12} /> Copy prompt
          </button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-sm border border-border bg-secondary/30 p-3 whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
          {buildPrompt()}
        </pre>
      </div>

      <div className="academic-card space-y-4 p-4">
        <div className="text-xs font-medium text-foreground">2. Problem details</div>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-sm border border-border px-3 py-2 text-xs"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="rounded-sm border border-border px-3 py-2 text-xs"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            value={form.questionType}
            onChange={(e) => setForm({ ...form, questionType: e.target.value })}
            className="rounded-sm border border-border px-3 py-2 text-xs"
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
            className="rounded-sm border border-border px-3 py-2 text-xs"
          />
          <input
            placeholder="Tags (comma)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="rounded-sm border border-border px-3 py-2 text-xs"
          />
        </div>
        <div className="rounded-sm border border-border bg-secondary/20 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.isPyq}
                onChange={(e) => setForm({ ...form, isPyq: e.target.checked })}
                className="mt-1"
              />
              <span>
                <span className="block text-xs font-semibold text-foreground">Mark as PYQ</span>
                <span className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">
                  Display this approved problem inside the PYQ section as well.
                </span>
              </span>
            </label>
            {form.isPyq && (
              <span className="w-fit rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase text-primary">
                PYQ enabled
              </span>
            )}
          </div>

          {form.isPyq && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="number"
                placeholder="Year asked, e.g. 2025"
                value={form.yearAsked}
                onChange={(e) => setForm({ ...form, yearAsked: e.target.value })}
                className="rounded-sm border border-border bg-card px-3 py-2 text-xs"
              />
              <input
                placeholder='Source, e.g. "GATE 2025 Official"'
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="rounded-sm border border-border bg-card px-3 py-2 text-xs"
              />
            </div>
          )}
        </div>
        <textarea
          placeholder="Statement (LaTeX supported)"
          value={form.statement}
          onChange={(e) => setForm({ ...form, statement: e.target.value })}
          rows={4}
          className="w-full rounded-sm border border-border px-3 py-2 font-mono text-xs"
        />
        {form.questionType !== "NAT" &&
          form.options.map((opt, i) => (
            <div key={i} className="flex min-w-0 items-center gap-2">
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
                className="min-w-0 flex-1 rounded-sm border border-border px-3 py-2 text-xs"
              />
            </div>
          ))}
        <textarea
          placeholder='Solution JSON, e.g. {"overview":"...","narrative":["..."],"equations":["\\\\[...\\\\]"],"finalAnswer":"..."}'
          value={form.solution}
          onChange={(e) => setForm({ ...form, solution: e.target.value })}
          rows={4}
          className="w-full rounded-sm border border-border px-3 py-2 font-mono text-xs"
        />
        {form.title && (
          <div className="border-t border-border pt-3 text-xs">
            <span className="font-mono text-muted-foreground">Preview: </span>
            <LatexRenderer latex={form.title} />
          </div>
        )}
        <button type="button" onClick={handleSubmit} className="btn-primary flex w-full items-center justify-center gap-1 px-4 py-2 text-xs sm:w-auto">
          <Plus size={14} /> Submit for review
        </button>
      </div>
    </div>
  );
}
