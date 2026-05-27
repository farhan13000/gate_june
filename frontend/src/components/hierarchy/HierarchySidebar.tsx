import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

export default function HierarchySidebar({
  tree,
  selection,
  onSelect,
  loading,
  error,
}: HierarchySidebarProps) {
  const [query, setQuery] = useState("");
  const filteredTree = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tree;

    return tree
      .map((subject) => {
        const subjectMatch = [subject.name, subject.subjectId, subject.code].filter(Boolean).join(" ").toLowerCase().includes(needle);
        const chapters = subject.chapters
          .map((chapter) => {
            const chapterMatch = [chapter.name, chapter.chapterId].filter(Boolean).join(" ").toLowerCase().includes(needle);
            const topics = chapter.topics
              .map((topic) => {
                const topicMatch = [topic.name, topic.topicId].filter(Boolean).join(" ").toLowerCase().includes(needle);
                const subtopics = topic.subtopics.filter((subtopic) =>
                  [subtopic.name, subtopic.subtopicId].filter(Boolean).join(" ").toLowerCase().includes(needle)
                );
                return topicMatch || subtopics.length > 0 ? { ...topic, subtopics: topicMatch ? topic.subtopics : subtopics } : null;
              })
              .filter(Boolean) as typeof chapter.topics;
            return chapterMatch || topics.length > 0 ? { ...chapter, topics: chapterMatch ? chapter.topics : topics } : null;
          })
          .filter(Boolean) as typeof subject.chapters;
        return subjectMatch || chapters.length > 0 ? { ...subject, chapters: subjectMatch ? subject.chapters : chapters } : null;
      })
      .filter(Boolean) as SubjectNode[];
  }, [query, tree]);

  return (
    <div className="hierarchy-sidebar flex h-full min-h-0 flex-col">
      <div className="border-b border-border bg-card p-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find chapter, topic, subtopic..."
            className="w-full rounded-sm border border-border bg-background py-2 pl-8 pr-2 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden taxonomy-tree-scroll">
        {error && (
          <div className="m-3 rounded-sm border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {error}
          </div>
        )}
          <HierarchyTree
          tree={filteredTree}
          selection={selection}
          onSelect={onSelect}
          loading={loading}
          defaultExpanded={Boolean(query.trim())}
          expandAllKey={query}
        />
        {!loading && tree.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No taxonomy loaded. Ask an admin to seed syllabus data.
          </p>
        )}
        {!loading && tree.length > 0 && filteredTree.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No matching taxonomy items.
          </p>
        )}
      </div>
    </div>
  );
}
