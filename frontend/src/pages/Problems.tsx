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
  const labelList = Object.values(labels).filter(Boolean) as string[];

  const [problems, setProblems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(25);

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
    params.set("limit", String(pageSize));

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
    // when pageSize changes, reset to page 1
    setPage(1);
  }, [pageSize]);

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
    <div className="mb-4">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search problems by title, ID or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-3 text-sm border border-border bg-card rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <div className="flex gap-2">
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
      </div>
    </div>
  );

  function typeBadge(t: string) {
    const base = "inline-block text-[12px] px-2 py-0.5 rounded-md font-medium";
    if (t === "MSQ") return base + " bg-violet-50 text-violet-700 border border-violet-100";
    if (t === "NAT") return base + " bg-amber-50 text-amber-700 border border-amber-100";
    return base + " bg-sky-50 text-sky-700 border border-sky-100";
  }

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
      hideStats={true}
      onBreadcrumbNavigate={handleBreadcrumb}
      stats={stats}
      statsLoading={statsLoading}
      filters={filters}
    >
      {/* Top summary cards similar to the mock (QUESTIONS, SOLVED, ATTEMPTS, ACCURACY, DIFFICULTY) */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-sm p-4 text-center">
          <div className="text-xs text-muted-foreground">QUESTIONS</div>
          <div className="font-mono text-2xl font-bold text-foreground">{total}</div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 text-center">
          <div className="text-xs text-muted-foreground">SOLVED</div>
          <div className="font-mono text-2xl font-bold text-foreground">{stats?.solved ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 text-center">
          <div className="text-xs text-muted-foreground">ATTEMPTS</div>
          <div className="font-mono text-2xl font-bold text-foreground">{stats?.attempts ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 text-center">
          <div className="text-xs text-muted-foreground">ACCURACY</div>
          <div className="font-mono text-2xl font-bold text-foreground">{stats?.accuracy ? `${stats.accuracy}%` : "—"}</div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 text-center">
          <div className="text-xs text-muted-foreground">DIFFICULTY</div>
          <div className="text-[12px] mt-1">
            <span className="text-emerald-600">E: {stats?.difficulty?.easy ?? 0}</span>
            <span className="mx-2 text-blue-600">M: {stats?.difficulty?.medium ?? 0}</span>
            <span className="text-red-600">H: {stats?.difficulty?.hard ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="academic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">#</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">ID</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Title</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal hidden md:table-cell">Type</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Difficulty</th>
              <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal">Your Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">Loading problems…</td>
              </tr>
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">No problems in this selection. Try a broader level or add content via admin.</td>
              </tr>
            ) : (
              problems.map((p, idx) => (
                <tr key={p._id} className="problem-row border-b border-border-faint last:border-0">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.contentId || p.problemId || String(p._id).slice(-6)}</td>
                  <td className="py-3 px-4">
                    <Link to={`/problems/${p._id}`} className="text-foreground hover:text-primary transition-colors font-medium">
                      <LatexRenderer latex={p.title} />
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell font-mono text-xs text-muted-foreground">
                    <span className={typeBadge(p.questionType)}>{p.questionType}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={diffClass(p.difficulty)}>{p.difficulty}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                    <div className="flex items-center justify-end gap-3">
                      <label className="text-[13px]">Not Solved</label>
                      <button className="p-1 rounded-sm hover:bg-secondary" aria-label="bookmark">🔖</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {!loading && (
        <div className="mt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-muted-foreground mb-3 gap-3">
                <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} problems</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground mr-1">Per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 text-xs border border-border bg-card rounded-sm"
                  >
                    {[10, 25, 50, 100].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <nav aria-label="Pagination" className="ml-2">
                    <ul className="flex items-center gap-1">
                      <li>
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary disabled:opacity-40"
                        >
                          ←
                        </button>
                      </li>
                      {/** numeric page buttons: show first, ... window, last **/}
                      {(() => {
                        const pages: (number | string)[] = [];
                        const totalP = totalPages || 1;
                        const windowSize = 5;
                        let start = Math.max(1, page - Math.floor(windowSize / 2));
                        let end = Math.min(totalP, start + windowSize - 1);
                        if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
                        if (start > 1) {
                          pages.push(1);
                          if (start > 2) pages.push("...");
                        }
                        for (let i = start; i <= end; i++) pages.push(i);
                        if (end < totalP) {
                          if (end < totalP - 1) pages.push("...");
                          pages.push(totalP);
                        }
                        return pages.map((pnum, idx) => (
                          <li key={String(pnum) + idx}>
                            {typeof pnum === "number" ? (
                              <button
                                type="button"
                                onClick={() => setPage(pnum)}
                                className={`px-3 py-1.5 border rounded-sm ${pnum === page ? "bg-primary text-white border-primary" : "border-border hover:bg-secondary"}`}
                              >
                                {pnum}
                              </button>
                            ) : (
                              <span className="px-2 text-muted-foreground">{pnum}</span>
                            )}
                          </li>
                        ));
                      })()}
                      <li>
                        <button
                          type="button"
                          disabled={page >= (totalPages || 1)}
                          onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                          className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary disabled:opacity-40"
                        >
                          →
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {labelList.map((l) => (
                <span key={l} className="text-[12px] px-3 py-1 border border-border rounded-full bg-background text-muted-foreground">{l}</span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{problems.length} Problems</span>
              <button className="px-3 py-1.5 border border-border rounded-sm text-xs">Clear Filters</button>
            </div>
          </div>
        </div>
      )}
    </ContentExplorerLayout>
  );
}
