import { useEffect, useState, useCallback } from "react";
import { BookOpen, Loader2, ChevronRight } from "lucide-react";
import ContentExplorerLayout from "@/components/hierarchy/ContentExplorerLayout";
import LatexRenderer from "@/components/LatexRenderer";
import { useTaxonomy, useTaxonomyStats, resolveHierarchyLabels } from "@/hooks/useTaxonomy";
import type { HierarchySelection } from "@/types/taxonomy";

export default function Theory() {
  const { tree, loading: treeLoading, error: treeError, refresh: refreshTaxonomy } = useTaxonomy();
  const [selection, setSelection] = useState<HierarchySelection>({});
  const { stats, loading: statsLoading } = useTaxonomyStats(selection);
  const labels = resolveHierarchyLabels(tree, selection);

  const [theories, setTheories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTheory, setActiveTheory] = useState<any | null>(null);

  const fetchTheories = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selection.subjectId) params.set("subjectId", selection.subjectId);
    if (selection.chapterId) params.set("chapterId", selection.chapterId);
    if (selection.topicId) params.set("topicId", selection.topicId);
    if (selection.subtopicId) params.set("subtopicId", selection.subtopicId);

    try {
      const res = await fetch(`/api/problems/theories/all?${params}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTheories(list);
      if (list.length === 1) setActiveTheory(list[0]);
      else if (!list.find((t: any) => t._id === activeTheory?._id)) setActiveTheory(null);
    } catch {
      setTheories([]);
    } finally {
      setLoading(false);
    }
  }, [selection]);

  useEffect(() => {
    fetchTheories();
  }, [fetchTheories]);

  const handleBreadcrumb = (level: "subject" | "chapter" | "topic" | "subtopic" | "root") => {
    setActiveTheory(null);
    if (level === "root") setSelection({});
    else if (level === "subject") setSelection({ subjectId: selection.subjectId });
    else if (level === "chapter")
      setSelection({ subjectId: selection.subjectId, chapterId: selection.chapterId });
    else if (level === "topic")
      setSelection({
        subjectId: selection.subjectId,
        chapterId: selection.chapterId,
        topicId: selection.topicId,
      });
  };

  if (activeTheory) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => setActiveTheory(null)}
          className="text-xs text-muted-foreground hover:text-primary mb-6 flex items-center gap-1"
        >
          ← Back to library
        </button>
        <article className="academic-card p-8">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-4">
            <LatexRenderer latex={activeTheory.title} />
          </h1>
          <div className="prose prose-sm max-w-none text-foreground/90">
            <LatexRenderer latex={activeTheory.content} />
          </div>
          {activeTheory.formulas?.length > 0 && (
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-3">
                Formulas
              </h3>
              {activeTheory.formulas.map((f: string, i: number) => (
                <div key={i} className="mb-2">
                  <LatexRenderer latex={f} />
                </div>
              ))}
            </div>
          )}
          {activeTheory.examples?.length > 0 && (
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-xs uppercase tracking-wider font-mono text-muted-foreground mb-3">
                Examples
              </h3>
              {activeTheory.examples.map((ex: string, i: number) => (
                <div key={i} className="mb-3 text-sm">
                  <LatexRenderer latex={ex} />
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <ContentExplorerLayout
      title="Theory Library"
      subtitle="Structured academic notes following the same syllabus hierarchy as problems."
      tree={tree}
      treeLoading={treeLoading}
      treeError={treeError}
      onTreeRefresh={refreshTaxonomy}
      selection={selection}
      onSelect={(s) => {
        setActiveTheory(null);
        setSelection(s);
      }}
      labels={labels}
      onBreadcrumbNavigate={handleBreadcrumb}
      stats={stats}
      statsLoading={statsLoading}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Loader2 className="animate-spin mr-2" size={16} />
          Loading theory…
        </div>
      ) : theories.length === 0 ? (
        <div className="academic-card p-12 text-center">
          <BookOpen className="mx-auto mb-4 text-muted-foreground opacity-40" size={32} />
          <p className="text-sm text-muted-foreground">
            No theory articles in this selection yet. Select another node or add content via admin.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {theories.map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => setActiveTheory(t)}
              className="academic-card w-full p-4 text-left flex items-center justify-between hover:border-primary/30 transition-colors group"
            >
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  <LatexRenderer latex={t.title} />
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {t.theoryId || t.contentId}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
        </div>
      )}
    </ContentExplorerLayout>
  );
}
