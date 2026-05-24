import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Layers, FileText, Hash } from "lucide-react";
import type { HierarchySelection, SubjectNode } from "@/types/taxonomy";

interface HierarchyTreeProps {
  tree: SubjectNode[];
  selection: HierarchySelection;
  onSelect: (selection: HierarchySelection) => void;
  loading?: boolean;
  /** When true, all nodes start expanded */
  defaultExpanded?: boolean;
  /** Toggle key to force expand/collapse all */
  expandAllKey?: string;
}

function buildExpandedMap(tree: SubjectNode[], expanded: boolean): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const s of tree) {
    map[s.subjectId] = expanded;
    for (const c of s.chapters) {
      map[c.chapterId] = expanded;
      for (const t of c.topics) {
        map[t.topicId] = expanded;
      }
    }
  }
  return map;
}

export default function HierarchyTree({
  tree,
  selection,
  onSelect,
  loading,
  defaultExpanded = true,
  expandAllKey,
}: HierarchyTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpanded(buildExpandedMap(tree, defaultExpanded));
  }, [tree, defaultExpanded, expandAllKey]);

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));
  const isExp = (key: string) => expanded[key] !== false;

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground font-mono">Loading hierarchy…</div>
    );
  }

  if (tree.length === 0) {
    return null;
  }

  return (
    <nav className="text-xs space-y-0.5 pr-1" aria-label="Content hierarchy">
      {tree.map((subject) => {
        const sKey = subject.subjectId;
        const sActive = selection.subjectId === subject.subjectId && !selection.chapterId;
        const chapterCount = subject.chapters.length;
        return (
          <div key={sKey} className="mb-1">
            <button
              type="button"
              onClick={() => {
                toggle(sKey);
                onSelect({ subjectId: subject.subjectId });
              }}
              className={`w-full flex items-start gap-1.5 py-1.5 px-2 rounded-sm transition-colors text-left ${
                sActive ? "bg-primary/20 ring-1 ring-primary/30 text-primary font-semibold" : "text-foreground hover:bg-secondary"
              }`}
              title={subject.name}
            >
              <span className="shrink-0 mt-0.5">
                {isExp(sKey) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <BookOpen size={12} className="shrink-0 opacity-60 mt-0.5" />
              <span className="flex-1 min-w-0">
                <span className="block leading-snug break-words">{subject.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {subject.code} · {chapterCount} ch
                </span>
              </span>
            </button>

            {isExp(sKey) &&
              subject.chapters.map((chapter) => {
                const cKey = chapter.chapterId;
                const cActive =
                  selection.chapterId === chapter.chapterId && !selection.topicId;
                return (
                  <div key={cKey} className="ml-2 border-l border-border pl-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        toggle(cKey);
                        onSelect({
                          subjectId: subject.subjectId,
                          chapterId: chapter.chapterId,
                        });
                      }}
                      className={`w-full flex items-start gap-1.5 py-1 px-2 rounded-sm transition-colors text-left ${
                        cActive
                          ? "bg-primary/20 ring-1 ring-primary/30 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                      title={chapter.name}
                    >
                      <span className="shrink-0 mt-0.5">
                        {isExp(cKey) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </span>
                      <Layers size={11} className="shrink-0 opacity-50 mt-0.5" />
                      <span className="flex-1 min-w-0 leading-snug break-words">{chapter.name}</span>
                    </button>

                    {isExp(cKey) &&
                      chapter.topics.map((topic) => {
                        const tKey = topic.topicId;
                        const tActive =
                          selection.topicId === topic.topicId && !selection.subtopicId;
                        return (
                          <div key={tKey} className="ml-2 border-l border-border-faint pl-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                toggle(tKey);
                                onSelect({
                                  subjectId: subject.subjectId,
                                  chapterId: chapter.chapterId,
                                  topicId: topic.topicId,
                                });
                              }}
                              className={`w-full flex items-start gap-1.5 py-1 px-2 rounded-sm transition-colors text-left ${
                                tActive
                                  ? "bg-primary/20 ring-1 ring-primary/30 text-primary font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                              }`}
                              title={topic.name}
                            >
                              <span className="shrink-0 mt-0.5">
                                {topic.subtopics.length > 0 ? (
                                  isExp(tKey) ? (
                                    <ChevronDown size={10} />
                                  ) : (
                                    <ChevronRight size={10} />
                                  )
                                ) : (
                                  <span className="w-[10px] inline-block" />
                                )}
                              </span>
                              <FileText size={10} className="shrink-0 opacity-50 mt-0.5" />
                              <span className="flex-1 min-w-0 leading-snug break-words">
                                {topic.name}
                              </span>
                            </button>

                            {isExp(tKey) &&
                              topic.subtopics.map((st) => {
                                const stActive = selection.subtopicId === st.subtopicId;
                                return (
                                  <button
                                    key={st.subtopicId}
                                    type="button"
                                    onClick={() =>
                                      onSelect({
                                        subjectId: subject.subjectId,
                                        chapterId: chapter.chapterId,
                                        topicId: topic.topicId,
                                        subtopicId: st.subtopicId,
                                      })
                                    }
                                    className={`w-full flex items-start gap-1.5 py-1 px-2 ml-2 rounded-sm transition-colors text-left ${
                                      stActive
                                        ? "bg-primary/20 ring-1 ring-primary/30 text-primary font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    }`}
                                    title={st.name}
                                  >
                                    <Hash size={9} className="shrink-0 opacity-40 mt-0.5" />
                                    <span className="flex-1 min-w-0 leading-snug break-words">
                                      {st.name}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </nav>
  );
}
