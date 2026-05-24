import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ContentExplorerLayout from "@/components/hierarchy/ContentExplorerLayout";
import LatexRenderer from "@/components/LatexRenderer";
import { useTaxonomy, useTaxonomyStats, resolveHierarchyLabels } from "@/hooks/useTaxonomy";
import type { HierarchySelection, ProblemsListResponse } from "@/types/taxonomy";

const difficulties = ["", "Easy", "Medium", "Hard"];
const questionTypes = ["", "MCQ", "MSQ", "NAT"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "title", label: "Title" },
  { value: "difficulty", label: "Difficulty" },
];

function diffClass(d: string) {
  if (d === "Easy")
    return "bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
  if (d === "Medium")
    return "bg-blue-50 text-blue-600 border border-blue-100 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
  return "bg-red-50 text-red-600 border border-red-100 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
}

export default function Problems() {
  const { tree, loading: treeLoading, error: treeError, refresh: refreshTaxonomy } = useTaxonomy();
  const [selection, setSelection] = useState<HierarchySelection>({});
  const { stats, loading: statsLoading } = useTaxonomyStats(selection);
  const labels = resolveHierarchyLabels(tree, selection);

  const [problems, setProblems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selection.subjectId) params.set("subjectId", selection.subjectId);
    if (selection.chapterId) params.set("chapterId", selection.chapterId);
    if (selection.topicId) params.set("topicId", selection.topicId);
    if (selection.subtopicId) params.set("subtopicId", selection.subtopicId);
    if (difficulty) params.set("difficulty", difficulty);
    if (questionType) params.set("questionType", questionType);
    if (search.trim()) params.set("search", search.trim());
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "25");

    try {
      const res = await fetch(`/api/problems?${params}`);
      const data = await res.json();
      if (data.questions) {
        const pr = data as ProblemsListResponse;
        setProblems(pr.questions as any[]);
        setTotal(pr.total);
        setTotalPages(pr.totalPages);
      } else if (Array.isArray(data)) {
        setProblems(data);
        setTotal(data.length);
        setTotalPages(1);
      }
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [selection, difficulty, questionType, sort, search, page]);

  useEffect(() => {
    setPage(1);
  }, [selection, difficulty, questionType, sort, search]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleBreadcrumb = (level: "subject" | "chapter" | "topic" | "subtopic" | "root") => {
    if (level === "root") setSelection({});
    else if (level === "subject")
      setSelection({ subjectId: selection.subjectId });
    else if (level === "chapter")
      setSelection({ subjectId: selection.subjectId, chapterId: selection.chapterId });
    else if (level === "topic")
      setSelection({
        subjectId: selection.subjectId,
        chapterId: selection.chapterId,
        topicId: selection.topicId,
      });
  };

  const filters = (
    <div className="flex flex-wrap gap-3 mb-4 items-end">
      <input
        type="text"
        placeholder="Search problems…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-border bg-card rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        className="px-3 py-2 text-xs border border-border bg-card rounded-sm"
      >
        <option value="">All difficulties</option>
        {difficulties.filter(Boolean).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        value={questionType}
        onChange={(e) => setQuestionType(e.target.value)}
        className="px-3 py-2 text-xs border border-border bg-card rounded-sm"
      >
        <option value="">All types</option>
        {questionTypes.filter(Boolean).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="px-3 py-2 text-xs border border-border bg-card rounded-sm"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ContentExplorerLayout
      title="Problems"
      subtitle="Practice GATE DA questions organized by subject, chapter, topic, and subtopic."
      tree={tree}
      treeLoading={treeLoading}
      treeError={treeError}
      onTreeRefresh={refreshTaxonomy}
      selection={selection}
      onSelect={setSelection}
      labels={labels}
      onBreadcrumbNavigate={handleBreadcrumb}
      stats={stats}
      statsLoading={statsLoading}
      filters={filters}
    >
      <div className="academic-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">ID</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Title</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal hidden md:table-cell">
                Type
              </th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Difficulty</th>
              <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal hidden sm:table-cell">
                Upvotes
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">
                  Loading problems…
                </td>
              </tr>
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">
                  No problems in this selection. Try a broader level or add content via admin.
                </td>
              </tr>
            ) : (
              problems.map((p) => (
                <tr key={p._id} className="problem-row border-b border-border-faint last:border-0">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {p.contentId || p.problemId || String(p._id).slice(-6)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/problems/${p._id}`}
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <LatexRenderer latex={p.title} />
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {p.questionType}
                  </td>
                  <td className="py-3 px-4">
                    <span className={diffClass(p.difficulty)}>{p.difficulty}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                    {p.upvotes || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {problems.length} of {total} problems
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary disabled:opacity-40"
            >
              ←
            </button>
            <span className="px-3 py-1.5 border border-border rounded-sm bg-secondary font-medium">
              {page} / {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}
    </ContentExplorerLayout>
  );
}
