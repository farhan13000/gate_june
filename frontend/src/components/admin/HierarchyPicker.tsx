import { useEffect, useState } from "react";
import HierarchySidebar from "@/components/hierarchy/HierarchySidebar";
import type { HierarchySelection, SubjectNode } from "@/types/taxonomy";

export interface HierarchyPickerValue {
  subjectId: string;
  chapterId: string;
  topicId: string;
  subtopicId: string;
}

interface HierarchyPickerProps {
  value: HierarchyPickerValue;
  onChange: (v: HierarchyPickerValue) => void;
  onLabelsChange?: (labels: {
    subject?: string;
    chapter?: string;
    topic?: string;
    subtopic?: string;
  }) => void;
}

export default function HierarchyPicker({ value, onChange, onLabelsChange }: HierarchyPickerProps) {
  const [tree, setTree] = useState<SubjectNode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTree = () => {
    setLoading(true);
    fetch("/api/taxonomy/tree")
      .then((r) => r.json())
      .then((d) => setTree(Array.isArray(d) ? d : []))
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTree();
  }, []);

  const subject = tree.find((s) => s.subjectId === value.subjectId);
  const chapter = subject?.chapters.find((c) => c.chapterId === value.chapterId);
  const topic = chapter?.topics.find((t) => t.topicId === value.topicId);
  const subtopic = topic?.subtopics.find((st) => st.subtopicId === value.subtopicId);

  useEffect(() => {
    onLabelsChange?.({
      subject: subject?.name,
      chapter: chapter?.name,
      topic: topic?.name,
      subtopic: subtopic?.name,
    });
  }, [value, subject, chapter, topic, subtopic, onLabelsChange]);

  const selection: HierarchySelection = {
    subjectId: value.subjectId,
    chapterId: value.chapterId,
    topicId: value.topicId,
    subtopicId: value.subtopicId,
  };

  const handleTreeSelect = (s: HierarchySelection) => {
    onChange({
      subjectId: s.subjectId || "",
      chapterId: s.chapterId || "",
      topicId: s.topicId || "",
      subtopicId: s.subtopicId || "",
    });
  };

  return (
    <div className="border border-border rounded-sm overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_1fr] min-h-[280px]">
        <div className="panel-sidebar border-b lg:border-b-0 lg:border-r border-border p-0 min-h-[240px] lg:max-h-[360px]">
          <HierarchySidebar
            tree={tree}
            selection={selection}
            onSelect={handleTreeSelect}
            loading={loading}
            onRefresh={loadTree}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Or select via dropdowns
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-1">
                Subject ({tree.length})
              </label>
              <select
                value={value.subjectId}
                onChange={(e) =>
                  onChange({ subjectId: e.target.value, chapterId: "", topicId: "", subtopicId: "" })
                }
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm"
              >
                <option value="">Select subject</option>
                {tree.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-1">
                Chapter
              </label>
              <select
                value={value.chapterId}
                disabled={!value.subjectId}
                onChange={(e) =>
                  onChange({ ...value, chapterId: e.target.value, topicId: "", subtopicId: "" })
                }
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm disabled:opacity-50"
              >
                <option value="">Select chapter</option>
                {subject?.chapters.map((c) => (
                  <option key={c.chapterId} value={c.chapterId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-1">
                Topic
              </label>
              <select
                value={value.topicId}
                disabled={!value.chapterId}
                onChange={(e) => onChange({ ...value, topicId: e.target.value, subtopicId: "" })}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm disabled:opacity-50"
              >
                <option value="">Select topic</option>
                {chapter?.topics.map((t) => (
                  <option key={t.topicId} value={t.topicId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-1">
                Subtopic
              </label>
              <select
                value={value.subtopicId}
                disabled={!value.topicId}
                onChange={(e) => onChange({ ...value, subtopicId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm disabled:opacity-50"
              >
                <option value="">Select subtopic</option>
                {topic?.subtopics.map((st) => (
                  <option key={st.subtopicId} value={st.subtopicId}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(value.subtopicId || value.topicId) && (
            <div className="text-xs text-muted-foreground border-t border-border pt-3 font-mono">
              Selected: {[subject?.name, chapter?.name, topic?.name, subtopic?.name]
                .filter(Boolean)
                .join(" → ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
