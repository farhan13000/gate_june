import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Hash, Layers } from "lucide-react";
import type { HierarchySelection, SubjectNode } from "@/types/taxonomy";

interface HierarchyTreeProps {
  tree: SubjectNode[];
  selection: HierarchySelection;
  onSelect: (selection: HierarchySelection) => void;
  loading?: boolean;
  defaultExpanded?: boolean;
  expandAllKey?: string;
}

function buildExpandedMap(tree: SubjectNode[], expanded: boolean): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const subject of tree) {
    map[subject.subjectId] = expanded;
    for (const chapter of subject.chapters) {
      map[chapter.chapterId] = expanded;
      for (const topic of chapter.topics) {
        map[topic.topicId] = expanded;
      }
    }
  }
  return map;
}

function ProgressPill() {
  return (
    <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      0%
    </span>
  );
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

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  const isExpanded = (key: string) => expanded[key] !== false;

  if (loading) {
    return <div className="py-8 text-center text-xs text-muted-foreground font-mono">Loading hierarchy...</div>;
  }

  if (tree.length === 0) return null;

  return (
    <nav className="text-sm" aria-label="Content hierarchy">
      {tree.map((subject) => {
        const subjectActive = selection.subjectId === subject.subjectId && !selection.chapterId;
        const chapterCount = subject.chapters.length;

        return (
          <div key={subject.subjectId} className="hierarchy-subject">
            <button
              type="button"
              onClick={() => {
                toggle(subject.subjectId);
                onSelect({ subjectId: subject.subjectId });
              }}
              className={`w-full grid grid-cols-[1rem_2rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                subjectActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"
              }`}
              title={subject.name}
            >
              <span className="text-foreground">
                {isExpanded(subject.subjectId) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="h-8 w-8 rounded-sm border border-border bg-secondary/40 text-muted-foreground flex items-center justify-center">
                <BookOpen size={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold leading-tight text-foreground">
                  {subject.name}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                  {subject.code} - {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
                </span>
              </span>
              <ProgressPill />
            </button>

            {isExpanded(subject.subjectId) &&
              subject.chapters.map((chapter) => {
                const chapterActive = selection.chapterId === chapter.chapterId && !selection.topicId;

                return (
                  <div key={chapter.chapterId} className="ml-5 border-l border-border pl-2">
                    <button
                      type="button"
                      onClick={() => {
                        toggle(chapter.chapterId);
                        onSelect({ subjectId: subject.subjectId, chapterId: chapter.chapterId });
                      }}
                      className={`w-full grid grid-cols-[1rem_1.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                        chapterActive
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "text-foreground hover:bg-secondary/50"
                      }`}
                      title={chapter.name}
                    >
                      <span>
                        {isExpanded(chapter.chapterId) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </span>
                      <Layers size={16} className="text-primary" />
                      <span className="min-w-0 truncate text-xs font-semibold sm:text-sm">{chapter.name}</span>
                      <ProgressPill />
                    </button>

                    {isExpanded(chapter.chapterId) &&
                      chapter.topics.map((topic) => {
                        const topicActive = selection.topicId === topic.topicId && !selection.subtopicId;

                        return (
                          <div key={topic.topicId} className="ml-4 border-l border-dashed border-border pl-2">
                            <button
                              type="button"
                              onClick={() => {
                                toggle(topic.topicId);
                                onSelect({
                                  subjectId: subject.subjectId,
                                  chapterId: chapter.chapterId,
                                  topicId: topic.topicId,
                                });
                              }}
                              className={`w-full grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                                topicActive
                                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                  : "text-foreground hover:bg-secondary/50"
                              }`}
                              title={topic.name}
                            >
                              <span>
                                {topic.subtopics.length > 0 ? (
                                  isExpanded(topic.topicId) ? (
                                    <ChevronDown size={12} />
                                  ) : (
                                    <ChevronRight size={12} />
                                  )
                                ) : (
                                  <span className="inline-block w-[12px]" />
                                )}
                              </span>
                              <span className="min-w-0 truncate text-xs">{topic.name}</span>
                              <ProgressPill />
                            </button>

                            {isExpanded(topic.topicId) &&
                              topic.subtopics.map((subtopic) => {
                                const subtopicActive = selection.subtopicId === subtopic.subtopicId;

                                return (
                                  <button
                                    key={subtopic.subtopicId}
                                    type="button"
                                    onClick={() =>
                                      onSelect({
                                        subjectId: subject.subjectId,
                                        chapterId: chapter.chapterId,
                                        topicId: topic.topicId,
                                        subtopicId: subtopic.subtopicId,
                                      })
                                    }
                                    className={`ml-5 w-[calc(100%-1.25rem)] grid grid-cols-[0.875rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                                      subtopicActive
                                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                        : "text-foreground hover:bg-secondary/50"
                                    }`}
                                    title={subtopic.name}
                                  >
                                    <Hash size={11} className="text-primary" />
                                    <span className="min-w-0 truncate text-xs">{subtopic.name}</span>
                                    <ProgressPill />
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
