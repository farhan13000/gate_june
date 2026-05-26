import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContentExplorerLayout from "@/components/hierarchy/ContentExplorerLayout";
import LatexRenderer from "@/components/LatexRenderer";
import { resolveHierarchyLabels, useTaxonomy, useTaxonomyStats } from "@/hooks/useTaxonomy";
import type { HierarchySelection, ProblemsListResponse } from "@/types/taxonomy";

const difficulties = ["", "Easy", "Medium", "Hard"];
const questionTypes = ["", "MCQ", "MSQ", "NAT"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "title", label: "Title" },
  { value: "difficulty", label: "Difficulty" },
];

function diffClass(difficulty: string) {
  if (difficulty === "Easy") {
    return "bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
  }
  if (difficulty === "Medium") {
    return "bg-blue-50 text-blue-600 border border-blue-100 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
  }
  return "bg-red-50 text-red-600 border border-red-100 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
}

function typeBadge(type: string) {
  const base = "inline-block text-[12px] px-2 py-0.5 rounded-md font-medium";
  if (type === "MSQ") return `${base} bg-violet-50 text-violet-700 border border-violet-100`;
  if (type === "NAT") return `${base} bg-amber-50 text-amber-700 border border-amber-100`;
  return `${base} bg-sky-50 text-sky-700 border border-sky-100`;
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
        const response = data as ProblemsListResponse;
        setProblems(response.questions as any[]);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } else if (Array.isArray(data)) {
        setProblems(data);
        setTotal(data.length);
        setTotalPages(1);
      }
    } catch {
      setProblems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [selection, difficulty, questionType, sort, search, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selection, difficulty, questionType, sort, search, pageSize]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleBreadcrumb = (level: "subject" | "chapter" | "topic" | "subtopic" | "root") => {
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

  const extendedStats = stats as any;
  const solved = extendedStats?.solved ?? extendedStats?.solvedCount ?? 0;
  const attempts = extendedStats?.attempts ?? 0;
  const difficultyCounts = extendedStats?.difficulty ?? {
    easy: stats?.difficultyDistribution?.Easy ?? 0,
    medium: stats?.difficultyDistribution?.Medium ?? 0,
    hard: stats?.difficultyDistribution?.Hard ?? 0,
  };
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  const filters = (
    <div className="mb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <input
          type="text"
          placeholder="Search problems by title, ID or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-sm border border-border bg-card px-3 py-2 text-xs"
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
            className="w-full rounded-sm border border-border bg-card px-3 py-2 text-xs"
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
            className="w-full rounded-sm border border-border bg-card px-3 py-2 text-xs"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
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
      hideStats={true}
      onBreadcrumbNavigate={handleBreadcrumb}
      stats={stats}
      statsLoading={statsLoading}
      filters={filters}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card border border-border border-l-4 border-l-foreground/30 rounded-sm p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Questions</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground">{total}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Available in current view</p>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-primary rounded-sm p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Solved</div>
          <div className="mt-1 font-mono text-2xl font-bold text-primary">{solved}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Completed problems</p>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-muted-foreground rounded-sm p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Attempts</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground">{attempts}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Submitted tries</p>
        </div>
        <div className="bg-card border border-border rounded-sm p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Difficulty</div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Easy</span>
              <span className="font-mono font-semibold text-foreground">{difficultyCounts.easy ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Medium</span>
              <span className="font-mono font-semibold text-foreground">{difficultyCounts.medium ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Hard</span>
              <span className="font-mono font-semibold text-foreground">{difficultyCounts.hard ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="academic-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading problems...</div>
        ) : problems.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            No problems in this selection. Try a broader level or add content via admin.
          </div>
        ) : (
          <>
            <div className="problems-card-list divide-y divide-border">
              {problems.map((problem, idx) => (
                <Link
                  key={problem._id}
                  to={`/problems/${problem._id}`}
                  className="block p-4 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 font-mono text-[11px] text-muted-foreground">
                        #{(page - 1) * pageSize + idx + 1} -{" "}
                        {problem.contentId || problem.problemId || String(problem._id).slice(-6)}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        <LatexRenderer latex={problem.title} />
                      </div>
                    </div>
                    <span className={diffClass(problem.difficulty)}>{problem.difficulty}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={typeBadge(problem.questionType)}>{problem.questionType}</span>
                    <span className="font-mono text-xs text-muted-foreground">Not Solved</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="problems-table-view overflow-x-auto">
              <table className="min-w-[680px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">#</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">ID</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Title</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Type</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Difficulty</th>
                    <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem, idx) => (
                    <tr key={problem._id} className="problem-row border-b border-border-faint last:border-0">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {problem.contentId || problem.problemId || String(problem._id).slice(-6)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/problems/${problem._id}`}
                          className="font-medium text-foreground transition-colors hover:text-primary"
                        >
                          <LatexRenderer latex={problem.title} />
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        <span className={typeBadge(problem.questionType)}>{problem.questionType}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={diffClass(problem.difficulty)}>{problem.difficulty}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                        Not Solved
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!loading && (
        <div className="mt-4">
          <div className="mb-3 flex flex-col items-start justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <span>
              Showing {showingFrom}-{showingTo} of {total} problems
            </span>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label className="text-xs text-muted-foreground">Per page:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-sm border border-border bg-card px-2 py-1 text-xs"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <nav aria-label="Pagination" className="overflow-x-auto">
                <ul className="flex items-center gap-1">
                  <li>
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-sm border border-border px-3 py-1.5 hover:bg-secondary disabled:opacity-40"
                    >
                      Prev
                    </button>
                  </li>
                  {(() => {
                    const pages: (number | string)[] = [];
                    const totalP = totalPages || 1;
                    const windowSize = 5;
                    let start = Math.max(1, page - Math.floor(windowSize / 2));
                    const end = Math.min(totalP, start + windowSize - 1);
                    if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
                    if (start > 1) {
                      pages.push(1);
                      if (start > 2) pages.push("...");
                    }
                    for (let i = start; i <= end; i += 1) pages.push(i);
                    if (end < totalP) {
                      if (end < totalP - 1) pages.push("...");
                      pages.push(totalP);
                    }
                    return pages.map((pageNumber, idx) => (
                      <li key={`${pageNumber}-${idx}`}>
                        {typeof pageNumber === "number" ? (
                          <button
                            type="button"
                            onClick={() => setPage(pageNumber)}
                            className={`rounded-sm border px-3 py-1.5 ${
                              pageNumber === page
                                ? "bg-primary text-white border-primary"
                                : "border-border hover:bg-secondary"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ) : (
                          <span className="px-2 text-muted-foreground">{pageNumber}</span>
                        )}
                      </li>
                    ));
                  })()}
                  <li>
                    <button
                      type="button"
                      disabled={page >= (totalPages || 1)}
                      onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                      className="rounded-sm border border-border px-3 py-1.5 hover:bg-secondary disabled:opacity-40"
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {labelList.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-border bg-background px-3 py-1 text-[12px] text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground">{problems.length} Problems</span>
              <button
                type="button"
                onClick={() => {
                  setDifficulty("");
                  setQuestionType("");
                  setSort("newest");
                  setSearch("");
                }}
                className="rounded-sm border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </ContentExplorerLayout>
  );
}
