import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Library,
  Lightbulb,
  Loader2,
  Search,
  Sigma,
} from "lucide-react";
import ContentExplorerLayout from "@/components/hierarchy/ContentExplorerLayout";
import LatexRenderer from "@/components/LatexRenderer";
import EmbeddedMediaContent from "@/components/EmbeddedMediaContent";
import { resolveHierarchyLabels, useTaxonomy, useTaxonomyStats } from "@/hooks/useTaxonomy";
import type { HierarchySelection } from "@/types/taxonomy";

type TheoryArticle = {
  _id: string;
  theoryId?: string;
  contentId?: string;
  title: string;
  topic?: string;
  chapterTitle?: string;
  sectionId?: string;
  content?: string;
  imageUrl?: string;
  images?: unknown[];
  diagrams?: unknown[];
  formulas?: string[];
  examples?: string[];
  highlights?: string[];
  updatedAt?: string;
  createdAt?: string;
};
type ReaderTab = "theory" | "formulas" | "examples";

function previewText(article: TheoryArticle) {
  const raw = article.content || "";
  return raw
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/[#*_`>{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function ArticleMeta({ article }: { article: TheoryArticle }) {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
      {(article.theoryId || article.contentId) && (
        <span className="rounded-sm border border-border bg-background px-2 py-1 font-mono">
          {article.theoryId || article.contentId}
        </span>
      )}
      {article.topic && (
        <span className="rounded-sm border border-border bg-background px-2 py-1">
          {article.topic}
        </span>
      )}
      {article.sectionId && (
        <span className="rounded-sm border border-border bg-background px-2 py-1 font-mono">
          Section {article.sectionId}
        </span>
      )}
    </div>
  );
}

function extractHeadings(content?: string) {
  const headings = (content || "")
    .split(/\r?\n/)
    .map((line) => line.match(/^#{1,4}\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean) as string[];

  return headings.length ? headings.slice(0, 8) : ["Overview"];
}

export default function Theory() {
  const { tree, loading: treeLoading, error: treeError, refresh: refreshTaxonomy } = useTaxonomy();
  const [selection, setSelection] = useState<HierarchySelection>({});
  const { stats, loading: statsLoading } = useTaxonomyStats(selection);
  const labels = resolveHierarchyLabels(tree, selection);

  const [theories, setTheories] = useState<TheoryArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTheory, setActiveTheory] = useState<TheoryArticle | null>(null);
  const [query, setQuery] = useState("");
  const [readerTab, setReaderTab] = useState<ReaderTab>("theory");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

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
      const list = Array.isArray(data) ? (data as TheoryArticle[]) : [];
      setTheories(list);
      setActiveTheory((current) => {
        if (list.length === 1) return list[0];
        if (current && list.find((article) => article._id === current._id)) return current;
        return null;
      });
    } catch {
      setTheories([]);
    } finally {
      setLoading(false);
    }
  }, [selection]);

  useEffect(() => {
    fetchTheories();
  }, [fetchTheories]);

  useEffect(() => {
    setReaderTab("theory");
  }, [activeTheory?._id]);

  const handleBreadcrumb = (level: "subject" | "chapter" | "topic" | "subtopic" | "root") => {
    setActiveTheory(null);
    if (level === "root") setSelection({});
    else if (level === "subject") setSelection({ subjectId: selection.subjectId });
    else if (level === "chapter") {
      setSelection({ subjectId: selection.subjectId, chapterId: selection.chapterId });
    } else if (level === "topic") {
      setSelection({
        subjectId: selection.subjectId,
        chapterId: selection.chapterId,
        topicId: selection.topicId,
      });
    }
  };

  const filteredTheories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return theories;
    return theories.filter((article) => {
      const haystack = [
        article.title,
        article.topic,
        article.chapterTitle,
        article.sectionId,
        article.theoryId,
        article.contentId,
        article.content,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [theories, query]);

  const activeIndex = activeTheory
    ? filteredTheories.findIndex((article) => article._id === activeTheory._id)
    : -1;
  const articleHeadings = extractHeadings(activeTheory?.content);
  const isBookmarked = activeTheory ? bookmarkedIds.includes(activeTheory._id) : false;

  const formulaCount = theories.reduce((sum, article) => sum + (article.formulas?.length || 0), 0);
  const exampleCount = theories.reduce((sum, article) => sum + (article.examples?.length || 0), 0);
  const highlightCount = theories.reduce((sum, article) => sum + (article.highlights?.length || 0), 0);

  const filters = (
    <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search theory by concept, section, formula, or keyword..."
          className="w-full rounded-sm border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="rounded-sm border border-border px-3 py-2 text-xs hover:bg-secondary"
        >
          Clear search
        </button>
      )}
    </div>
  );

  return (
    <ContentExplorerLayout
      title="Theory Library"
      subtitle="Structured notes, formulas, and examples organized by the GATE DA syllabus."
      tree={tree}
      treeLoading={treeLoading}
      treeError={treeError}
      onTreeRefresh={refreshTaxonomy}
      selection={selection}
      onSelect={(next) => {
        setActiveTheory(null);
        setSelection(next);
      }}
      labels={labels}
      onBreadcrumbNavigate={handleBreadcrumb}
      stats={stats}
      statsLoading={statsLoading}
      hideStats={true}
      resetLabel="All theory"
      filters={!activeTheory ? filters : undefined}
    >
      {activeTheory ? (
        <article className="academic-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setActiveTheory(null)}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={14} />
              Back to theory library
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setBookmarkedIds((current) =>
                    current.includes(activeTheory._id)
                      ? current.filter((id) => id !== activeTheory._id)
                      : [...current, activeTheory._id]
                  )
                }
                className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-medium ${
                  isBookmarked
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                <Bookmark size={14} />
                Bookmark
              </button>
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => setActiveTheory(filteredTheories[activeIndex - 1])}
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                type="button"
                disabled={activeIndex < 0 || activeIndex >= filteredTheories.length - 1}
                onClick={() => setActiveTheory(filteredTheories[activeIndex + 1])}
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <header className="border-b border-border px-5 py-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {activeTheory.topic || activeTheory.chapterTitle || "Theory"}
                </div>
                <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                  <LatexRenderer latex={activeTheory.title} />
                </h1>
                {previewText(activeTheory) && (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {previewText(activeTheory)}
                  </p>
                )}
              </div>
              <div className="space-y-3 rounded-sm border border-border bg-secondary/20 p-4">
                <ArticleMeta article={activeTheory} />
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{activeTheory.formulas?.length || 0} formulas</span>
                  <span>{activeTheory.examples?.length || 0} examples</span>
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-border px-5">
            <div className="flex gap-6 overflow-x-auto">
              {[
                { id: "theory", label: "Theory" },
                { id: "formulas", label: `Formulas (${activeTheory.formulas?.length || 0})` },
                { id: "examples", label: `Examples (${activeTheory.examples?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReaderTab(tab.id as ReaderTab)}
                  className={`border-b-2 px-1 py-3 text-xs font-medium transition-colors ${
                    readerTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-h-[32rem] xl:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="min-w-0 px-5 py-7">
              {readerTab === "theory" && (
                <div className="prose prose-sm max-w-none text-foreground/90">
                  <EmbeddedMediaContent
                    content={activeTheory.content || ""}
                    media={[activeTheory.images, activeTheory.diagrams]}
                    imageUrl={activeTheory.imageUrl}
                    label="Theory visual"
                    className="not-prose mb-5"
                  />
                </div>
              )}

              {readerTab === "formulas" && (
                <div className="space-y-3">
                  {activeTheory.formulas?.length ? (
                    activeTheory.formulas.map((formula, index) => (
                      <div key={index} className="overflow-x-auto rounded-sm border border-border bg-secondary/20 p-4">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Formula {index + 1}
                        </div>
                        <LatexRenderer latex={formula} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No formulas are attached to this theory article.</p>
                  )}
                </div>
              )}

              {readerTab === "examples" && (
                <div className="space-y-3">
                  {activeTheory.examples?.length ? (
                    activeTheory.examples.map((example, index) => (
                      <div key={index} className="rounded-sm border border-border bg-secondary/20 p-4">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Example {index + 1}
                        </div>
                        <LatexRenderer latex={example} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No examples are attached to this theory article.</p>
                  )}
                </div>
              )}
            </div>

            <aside className="hidden border-l border-border bg-secondary/10 px-5 py-7 xl:block">
              <div className="sticky top-24">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  On this page
                </div>
                <nav className="space-y-3 text-xs text-muted-foreground">
                  {articleHeadings.map((heading, index) => (
                    <div key={`${heading}-${index}`} className="leading-relaxed">
                      {index + 1}. {heading}
                    </div>
                  ))}
                  {(activeTheory.formulas?.length || 0) > 0 && <div>Formulas</div>}
                  {(activeTheory.examples?.length || 0) > 0 && <div>Examples</div>}
                </nav>
              </div>
            </aside>
          </div>
        </article>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="academic-card border-l-4 border-l-foreground/30 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Library size={13} />
                Articles
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-foreground">{theories.length}</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Notes in current selection</p>
            </div>
            <div className="academic-card border-l-4 border-l-primary p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Sigma size={13} />
                Formulas
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-primary">{formulaCount}</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Quick revision entries</p>
            </div>
            <div className="academic-card border-l-4 border-l-muted-foreground p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Lightbulb size={13} />
                Examples
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-foreground">{exampleCount + highlightCount}</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Worked examples and highlights</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <Loader2 className="mr-2 animate-spin" size={16} />
              Loading theory...
            </div>
          ) : filteredTheories.length === 0 ? (
            <div className="academic-card p-12 text-center">
              <BookOpen className="mx-auto mb-4 text-muted-foreground opacity-40" size={32} />
              <p className="text-sm text-muted-foreground">
                No theory articles match this view. Try all theory, a broader syllabus node, or a different keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredTheories.map((article) => (
                <button
                  key={article._id}
                  type="button"
                  onClick={() => setActiveTheory(article)}
                  className="academic-card group flex h-full flex-col p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <ArticleMeta article={article} />
                      <h3 className="mt-3 font-serif text-base font-bold text-foreground transition-colors group-hover:text-primary">
                        <LatexRenderer latex={article.title} />
                      </h3>
                    </div>
                    <ChevronRight size={17} className="mt-1 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </div>

                  {previewText(article) && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {previewText(article)}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Sigma size={12} /> {article.formulas?.length || 0} formulas
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Lightbulb size={12} /> {article.examples?.length || 0} examples
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText size={12} /> Read notes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </ContentExplorerLayout>
  );
}
