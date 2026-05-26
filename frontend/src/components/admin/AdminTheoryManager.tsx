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

export default function AdminTheoryManager() {
  const [hierarchy, setHierarchy] = useState<HierarchyPickerValue>(emptyHierarchy);
  const [labels, setLabels] = useState<Record<string, string | undefined>>({});
  const [form, setForm] = useState({
    title: "",
    content: "",
    formulas: "",
    examples: "",
    highlights: "",
  });

  const buildPrompt = () => `Create GATE DA theory notes for:

Subject: ${labels.subject || hierarchy.subjectId}
Chapter: ${labels.chapter || hierarchy.chapterId}
Topic: ${labels.topic || hierarchy.topicId}
Subtopic: ${labels.subtopic || hierarchy.subtopicId}

Requirements:
- Textbook-quality explanations with double-escaped LaTeX
- Include key formulas and worked examples
- Use Theorem:, Example:, GATE Example: block prefixes where appropriate
- Markdown structure with clear headings`;

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
      chapterTitle: labels.chapter || "",
      sectionId: hierarchy.subtopicId,
      title: form.title,
      content: form.content,
      formulas: form.formulas.split("\n").filter(Boolean),
      examples: form.examples.split("\n").filter(Boolean),
      highlights: form.highlights.split("\n").filter(Boolean),
    };
    const res = await fetch("/api/admin/theories", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Theory submitted for review");
      setForm({ title: "", content: "", formulas: "", examples: "", highlights: "" });
    } else {
      const d = await res.json();
      toast.error(d.message || "Failed to create");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground mb-2">
        Add theory content mapped to the same hierarchy as problems.
      </p>

      <div className="academic-card p-4 space-y-4">
        <div className="text-xs font-medium text-foreground">1. Taxonomy placement</div>
        <HierarchyPicker value={hierarchy} onChange={setHierarchy} onLabelsChange={setLabels} />
      </div>

      <div className="academic-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
        <div className="text-xs font-medium text-foreground">2. Theory content</div>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm"
        />
        <textarea
          placeholder="Main content (Markdown + LaTeX)"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={8}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm font-mono"
        />
        <textarea
          placeholder="Formulas (one per line)"
          value={form.formulas}
          onChange={(e) => setForm({ ...form, formulas: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm font-mono"
        />
        <textarea
          placeholder="Examples (one per line)"
          value={form.examples}
          onChange={(e) => setForm({ ...form, examples: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm font-mono"
        />
        <textarea
          placeholder="Highlighted points (one per line)"
          value={form.highlights}
          onChange={(e) => setForm({ ...form, highlights: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-xs border border-border rounded-sm"
        />
        {form.title && (
          <div className="border-t border-border pt-3">
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
