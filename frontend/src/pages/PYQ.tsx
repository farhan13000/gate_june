import { ArrowRight, BookOpenCheck, FileQuestion, Layers, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTaxonomy } from "@/hooks/useTaxonomy";

type SubjectCounts = Record<string, number>;

export default function PYQ() {
  const { tree, loading, error, refresh } = useTaxonomy();
  const [counts, setCounts] = useState<SubjectCounts>({});
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    if (!tree.length) {
      setCounts({});
      return;
    }

    let cancelled = false;
    setCountsLoading(true);

    Promise.all(
      tree.map(async (subject) => {
        try {
          const params = new URLSearchParams({
            pyq: "true",
            subjectId: subject.subjectId,
            limit: "1",
          });
          const res = await fetch(`/api/problems?${params}`, { credentials: "include" });
          if (!res.ok) return [subject.subjectId, 0] as const;
          const data = await res.json();
          return [subject.subjectId, Number(data.total || 0)] as const;
        } catch {
          return [subject.subjectId, 0] as const;
        }
      })
    )
      .then((rows) => {
        if (!cancelled) setCounts(Object.fromEntries(rows));
      })
      .finally(() => {
        if (!cancelled) setCountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tree]);

  const totalPyq = useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + value, 0),
    [counts]
  );
  const totalChapters = useMemo(
    () => tree.reduce((sum, subject) => sum + subject.chapters.length, 0),
    [tree]
  );

  return (
    <div className="w-full">
      <header className="mb-5 rounded-sm border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Previous Year Questions
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">PYQ Practice</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Pick a subject and start solving exam-style questions with the regular practice workspace.
            </p>
          </div>
          <Link
            to="/pyq/all"
            className="inline-flex items-center justify-center gap-2 self-start rounded-sm border border-primary bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-red-hover"
          >
            <FileQuestion size={14} />
            All PYQ
          </Link>
        </div>
      </header>

      <div className="mb-5 flex flex-col gap-2 rounded-sm border border-border bg-secondary/15 px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-foreground">Choose a subject to begin</div>
        <div className="flex flex-wrap gap-2">
          {[
            ["PYQ", countsLoading ? "..." : totalPyq],
            ["Subjects", tree.length],
            ["Chapters", totalChapters],
          ].map(([label, value]) => (
            <span key={label as string} className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1">
              <span className="text-muted-foreground">{label as string}</span>
              <span className="font-mono text-[11px] font-medium text-foreground">{String(value)}</span>
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="academic-card py-16 text-center text-sm text-muted-foreground">
          Loading subjects...
        </div>
      ) : error ? (
        <div className="academic-card p-5 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Unable to load subjects.</div>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
          >
            <RotateCcw size={13} />
            Retry
          </button>
        </div>
      ) : tree.length === 0 ? (
        <div className="academic-card py-16 text-center text-sm text-muted-foreground">
          No subjects are available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tree.map((subject) => {
            const topicCount = subject.chapters.reduce(
              (sum, chapter) => sum + chapter.topics.length,
              0
            );
            const subtopicCount = subject.chapters.reduce(
              (sum, chapter) =>
                sum + chapter.topics.reduce((topicSum, topic) => topicSum + topic.subtopics.length, 0),
              0
            );
            const pyqCount = counts[subject.subjectId] ?? 0;

            return (
              <Link
                key={subject.subjectId}
                to={`/pyq/${encodeURIComponent(subject.subjectId)}`}
                className="group block rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-secondary/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {subject.code || subject.subjectId}
                    </div>
                    <h2 className="mt-1 line-clamp-2 font-serif text-base font-bold text-foreground">{subject.name}</h2>
                  </div>
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-secondary/25 text-primary">
                    <BookOpenCheck size={16} />
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-semibold text-foreground">
                    {countsLoading ? "..." : pyqCount}
                  </span>
                  <span className="text-xs text-muted-foreground">questions available</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-secondary/20 px-2 py-1">
                    <Layers size={13} />
                    {subject.chapters.length} chapters
                  </span>
                  <span className="rounded-sm border border-border bg-secondary/20 px-2 py-1">
                    {topicCount} topics
                  </span>
                  <span className="rounded-sm border border-border bg-secondary/20 px-2 py-1">
                    {subtopicCount} subtopics
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">Subject practice set</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                    Practice
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
