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
      <header className="page-header">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>PYQ</h1>
            <p>Choose a subject and practice previous-year questions in the same problem-solving workspace.</p>
          </div>
          <Link
            to="/pyq/all"
            className="inline-flex items-center justify-center gap-2 self-start rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <FileQuestion size={14} />
            All PYQ
          </Link>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-card border border-border border-l-4 border-l-primary rounded-sm p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">PYQ Problems</div>
          <div className="mt-1 font-mono text-2xl font-bold text-primary">
            {countsLoading ? "..." : totalPyq}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Tagged previous-year questions</p>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-foreground/30 rounded-sm p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Subjects</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground">{tree.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Available syllabus sections</p>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-muted-foreground rounded-sm p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Chapters</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground">{totalChapters}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Mapped for focused practice</p>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                className="group academic-card block p-4 transition-colors hover:border-primary/35 hover:bg-secondary/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {subject.code || subject.subjectId}
                    </div>
                    <h2 className="mt-1 line-clamp-2 text-lg font-bold text-foreground">{subject.name}</h2>
                  </div>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/20 bg-primary/10 text-primary">
                    <BookOpenCheck size={18} />
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-sm border border-border bg-card px-2 py-2">
                    <div className="font-mono text-base font-bold text-foreground">
                      {countsLoading ? "..." : pyqCount}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">PYQ</div>
                  </div>
                  <div className="rounded-sm border border-border bg-card px-2 py-2">
                    <div className="font-mono text-base font-bold text-foreground">{subject.chapters.length}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Chapters</div>
                  </div>
                  <div className="rounded-sm border border-border bg-card px-2 py-2">
                    <div className="font-mono text-base font-bold text-foreground">{topicCount}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Topics</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Layers size={13} />
                    {subtopicCount} subtopics
                  </span>
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
