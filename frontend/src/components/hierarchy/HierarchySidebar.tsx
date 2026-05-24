import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, Search } from "lucide-react";
import HierarchyTree from "./HierarchyTree";
import type { HierarchySelection, SubjectNode } from "@/types/taxonomy";

interface HierarchySidebarProps {
  tree: SubjectNode[];
  selection: HierarchySelection;
  onSelect: (s: HierarchySelection) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

function countNodes(tree: SubjectNode[]) {
  let chapters = 0;
  let topics = 0;
  let subtopics = 0;
  for (const s of tree) {
    chapters += s.chapters.length;
    for (const c of s.chapters) {
      topics += c.topics.length;
      for (const t of c.topics) {
        subtopics += t.subtopics.length;
      }
    }
  }
  return { subjects: tree.length, chapters, topics, subtopics };
}

export default function HierarchySidebar({
  tree,
  selection,
  onSelect,
  loading,
  error,
  onRefresh,
}: HierarchySidebarProps) {
  const [search, setSearch] = useState("");
  const [expandAll, setExpandAll] = useState(true);

  const counts = useMemo(() => countNodes(tree), [tree]);

  const filteredTree = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tree;

    return tree
      .map((subject) => {
        const subjectMatch =
          subject.name.toLowerCase().includes(q) ||
          subject.code.toLowerCase().includes(q) ||
          subject.subjectId.toLowerCase().includes(q);

        const chapters = subject.chapters
          .map((chapter) => {
            const chapterMatch =
              chapter.name.toLowerCase().includes(q) ||
              chapter.chapterId.toLowerCase().includes(q);

            const topics = chapter.topics
              .map((topic) => {
                const topicMatch =
                  topic.name.toLowerCase().includes(q) || topic.topicId.toLowerCase().includes(q);

                const subtopics = topic.subtopics.filter(
                  (st) =>
                    st.name.toLowerCase().includes(q) || st.subtopicId.toLowerCase().includes(q)
                );

                if (topicMatch || subtopics.length > 0) {
                  return { ...topic, subtopics: topicMatch ? topic.subtopics : subtopics };
                }
                return null;
              })
              .filter(Boolean) as typeof chapter.topics;

            if (chapterMatch || topics.length > 0) {
              return { ...chapter, topics: chapterMatch ? chapter.topics : topics };
            }
            return null;
          })
          .filter(Boolean) as typeof subject.chapters;

        if (subjectMatch || chapters.length > 0) {
          return { ...subject, chapters: subjectMatch ? subject.chapters : chapters };
        }
        return null;
      })
      .filter(Boolean) as SubjectNode[];
  }, [tree, search]);

  return (
    <div className="hierarchy-sidebar flex flex-col h-full min-h-0">
      <div className="shrink-0 space-y-2 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
            Full syllabus
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1 rounded-sm border border-border hover:bg-secondary text-muted-foreground"
              title="Refresh taxonomy"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
        {!loading && tree.length > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
            {counts.subjects} subjects · {counts.chapters} chapters · {counts.topics} topics ·{" "}
            {counts.subtopics} subtopics
          </p>
        )}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Filter syllabus…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-border bg-background rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setExpandAll(true)}
            className="flex-1 text-[10px] py-1 border border-border rounded-sm hover:bg-secondary"
          >
            <ChevronDown size={10} className="inline mr-0.5" />
            Expand all
          </button>
          <button
            type="button"
            onClick={() => setExpandAll(false)}
            className="flex-1 text-[10px] py-1 border border-border rounded-sm hover:bg-secondary"
          >
            <ChevronRight size={10} className="inline mr-0.5" />
            Collapse
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 taxonomy-tree-scroll">
        {error && (
          <div className="mb-3 p-2 text-xs text-destructive border border-destructive/30 rounded-sm bg-destructive/5">
            {error}
            {onRefresh && (
              <button type="button" onClick={onRefresh} className="block mt-1 underline">
                Retry
              </button>
            )}
          </div>
        )}
        <HierarchyTree
          tree={filteredTree}
          selection={selection}
          onSelect={onSelect}
          loading={loading}
          defaultExpanded={expandAll}
          expandAllKey={expandAll ? "1" : "0"}
        />
        {!loading && filteredTree.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 px-2">
            {search ? "No matches for your filter." : "No taxonomy loaded. Ask an admin to seed syllabus data."}
          </p>
        )}
      </div>
    </div>
  );
}
