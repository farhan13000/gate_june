import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  FileJson,
  FolderOpen,
  Play,
  RefreshCw,
  Square,
  ScrollText,
  ShieldCheck,
  TerminalSquare,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Suite = {
  id: string;
  label: string;
  command: string;
  accent?: string;
};

type TestRun = {
  id: string;
  suite: string;
  label: string;
  status: "queued" | "running" | "passed" | "failed" | "error" | "stopped";
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  exitCode?: number | null;
  command: string;
  requestedBy?: string;
  reportDir?: string;
  logPath?: string;
  resultPath?: string;
  summary?: {
    testFiles?: string;
    tests?: string;
    passed?: number;
    failed?: number;
    skipped?: number;
  };
  logCount?: number;
  logs?: string[];
};

const suiteStyles: Record<string, string> = {
  all: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-200",
  admin: "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  user: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  scoring: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  standings: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  security: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  performance: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  e2e: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

function statusClass(status?: string) {
  if (status === "passed") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "failed" || status === "error") return "border-destructive/25 bg-destructive/10 text-destructive";
  if (status === "stopped") return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "running") return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  return "border-border bg-background text-muted-foreground";
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatDuration(value?: number) {
  if (!value) return "-";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function statusIcon(status?: string) {
  if (status === "passed") return CheckCircle2;
  if (status === "failed" || status === "error") return XCircle;
  if (status === "stopped") return Square;
  return Activity;
}

export default function AdminContestTestRunner() {
  const [suites, setSuites] = useState<Suite[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedSuite, setSelectedSuite] = useState("all");
  const [mongoTestUri, setMongoTestUri] = useState("mongodb://127.0.0.1:27017/gate-da-contest-test");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const selectedSuiteMeta = suites.find((suite) => suite.id === selectedSuite);
  const activeRun = useMemo(() => runs.find((run) => run.id === selectedRunId) || selectedRun, [runs, selectedRun, selectedRunId]);

  const groupedRuns = useMemo(() => {
    return suites.map((suite) => ({
      suite,
      runs: runs.filter((run) => run.suite === suite.id),
    }));
  }, [runs, suites]);

  const aggregate = useMemo(() => {
    const latestBySuite = suites.map((suite) => runs.find((run) => run.suite === suite.id)).filter(Boolean) as TestRun[];
    return {
      total: latestBySuite.length,
      passed: latestBySuite.filter((run) => run.status === "passed").length,
      failed: latestBySuite.filter((run) => run.status === "failed" || run.status === "error").length,
      running: latestBySuite.filter((run) => run.status === "running").length,
    };
  }, [runs, suites]);

  const fetchSuites = useCallback(async () => {
    const res = await fetch("/api/admin/contest-tests/suites", { credentials: "include" });
    if (res.ok) setSuites(await res.json());
  }, []);

  const fetchRuns = useCallback(async () => {
    const res = await fetch("/api/admin/contest-tests/runs", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setRuns(data);
      setSelectedRunId((current) => current || data[0]?.id || "");
    }
  }, []);

  const fetchRun = useCallback(async (runId: string) => {
    if (!runId) return;
    const res = await fetch(`/api/admin/contest-tests/runs/${runId}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setSelectedRun(data);
      setLogs(data.logs || []);
    }
  }, []);

  useEffect(() => {
    fetchSuites();
    fetchRuns();
  }, [fetchSuites, fetchRuns]);

  useEffect(() => {
    fetchRun(selectedRunId);
  }, [fetchRun, selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) return undefined;
    const es = new EventSource(`/api/admin/contest-tests/runs/${selectedRunId}/stream`, { withCredentials: true });
    es.addEventListener("contest-test-snapshot", (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setSelectedRun(data.run);
      setLogs(data.logs || []);
    });
    es.addEventListener("contest-test-log", (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setLogs((current) => [...current, ...(data.lines || [])].slice(-2000));
    });
    es.addEventListener("contest-test-finished", (event: MessageEvent) => {
      setSelectedRun(JSON.parse(event.data));
      fetchRuns();
    });
    es.onerror = () => es.close();
    return () => es.close();
  }, [fetchRuns, selectedRunId]);

  const canStopRun = activeRun?.status === "running" && Boolean(selectedRunId);

  const stopRun = async () => {
    if (!selectedRunId || !canStopRun) return;
    setStopping(true);
    try {
      const res = await fetch(`/api/admin/contest-tests/runs/${selectedRunId}/stop`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to stop test run");
      toast.success("Test run stopped");
      await fetchRuns();
      await fetchRun(selectedRunId);
    } catch (error: any) {
      toast.error(error.message || "Failed to stop test run");
    } finally {
      setStopping(false);
    }
  };

  const startRun = async () => {
    if (!mongoTestUri.trim()) {
      toast.error("Add MONGO_TEST_URI for an isolated test database");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/admin/contest-tests/runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suite: selectedSuite, mongoTestUri }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to start test run");
      toast.success(`${data.label} started`);
      setSelectedRunId(data.id);
      await fetchRuns();
    } catch (error: any) {
      toast.error(error.message || "Failed to start test run");
    } finally {
      setStarting(false);
    }
  };

  const runStatusIcon = statusIcon(activeRun?.status);

  return (
    <div className="w-full space-y-6">
      <section className="overflow-hidden rounded-sm border border-border bg-card">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted-foreground">
              <ShieldCheck size={14} />
              Contest QA
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Contest Test Console</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Run admin, user, scoring, standings, security, performance, and E2E suites from one controlled QA surface.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {suites.map((suite) => (
                <button
                  key={suite.id}
                  type="button"
                  onClick={() => setSelectedSuite(suite.id)}
                  className={`rounded-sm border px-3 py-2 text-xs font-semibold transition-colors ${
                    selectedSuite === suite.id ? suiteStyles[suite.id] || statusClass("running") : "border-border bg-background hover:bg-secondary/40"
                  }`}
                >
                  {suite.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border bg-secondary/20 p-5 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Tracked", aggregate.total, BarChart3],
                ["Passed", aggregate.passed, CheckCircle2],
                ["Failed", aggregate.failed, XCircle],
                ["Running", aggregate.running, Activity],
              ].map(([label, value, Icon]) => {
                const MetricIcon = Icon as typeof Activity;
                return (
                  <div key={label as string} className="rounded-sm border border-border bg-background p-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <MetricIcon size={13} />
                      {label as string}
                    </div>
                    <div className="mt-1 font-mono text-xl font-bold text-foreground">{String(value)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <div className="academic-card overflow-hidden">
            <div className="border-b border-border bg-secondary/30 p-4">
              <h3 className="text-sm font-bold text-foreground">Run Setup</h3>
              <p className="mt-1 text-xs text-muted-foreground">{selectedSuiteMeta?.command || "Choose a suite"}</p>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Database size={12} />
                  Isolated Test Database
                </label>
                <input
                  value={mongoTestUri}
                  onChange={(event) => setMongoTestUri(event.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                />
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  Use a local or clearly marked test database. Production-looking URIs are rejected.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={starting}
                  onClick={startRun}
                  className="btn-primary inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-60"
                >
                  <Play size={13} />
                  {starting ? "Starting..." : `Run ${selectedSuiteMeta?.label || "Suite"}`}
                </button>
                <button
                  type="button"
                  disabled={!canStopRun || stopping}
                  onClick={stopRun}
                  title={canStopRun ? "Stop the selected running test" : "Select a running test to stop"}
                  className="btn-outline inline-flex shrink-0 items-center justify-center gap-2 border-destructive/40 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  <Square size={13} />
                  {stopping ? "Stopping..." : "Stop"}
                </button>
              </div>
            </div>
          </div>

          <div className="academic-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/30 p-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Stored Runs</h3>
                <p className="mt-1 text-xs text-muted-foreground">Grouped by test type.</p>
              </div>
              <button type="button" onClick={fetchRuns} className="btn-outline inline-flex items-center gap-2 px-3 py-1.5 text-[10px]">
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
            <div className="max-h-[34rem] overflow-y-auto p-3">
              {groupedRuns.map(({ suite, runs: suiteRuns }) => (
                <div key={suite.id} className="mb-3 last:mb-0">
                  <div className={`mb-2 rounded-sm border px-2.5 py-1.5 text-[10px] font-bold uppercase ${suiteStyles[suite.id] || statusClass()}`}>
                    {suite.label} ({suiteRuns.length})
                  </div>
                  <div className="space-y-2">
                    {suiteRuns.slice(0, 5).map((run) => {
                      const Icon = statusIcon(run.status);
                      return (
                        <button
                          key={run.id}
                          type="button"
                          onClick={() => setSelectedRunId(run.id)}
                          className={`w-full rounded-sm border p-3 text-left transition-colors ${
                            selectedRunId === run.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/25"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2 text-xs font-bold">
                              <Icon size={13} className="shrink-0" />
                              <span className="truncate">{run.label}</span>
                            </span>
                            <span className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase ${statusClass(run.status)}`}>{run.status}</span>
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground">{formatDateTime(run.startedAt)}</div>
                        </button>
                      );
                    })}
                    {suiteRuns.length === 0 && <div className="rounded-sm border border-dashed border-border p-3 text-xs text-muted-foreground">No runs yet.</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Status", activeRun?.status || "-", runStatusIcon],
              ["Duration", formatDuration(activeRun?.durationMs), Clock3],
              ["Exit", activeRun?.exitCode ?? "-", TerminalSquare],
              ["Logs", logs.length, ScrollText],
            ].map(([label, value, Icon]) => {
              const MetricIcon = Icon as typeof Activity;
              return (
                <div key={label as string} className="rounded-sm border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <MetricIcon size={13} />
                    {label as string}
                  </div>
                  <div className="mt-1 truncate font-mono text-lg font-bold text-foreground">{String(value)}</div>
                </div>
              );
            })}
          </div>

          {activeRun && (
            <section className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-sm border border-border bg-card p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Test Files</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{activeRun.summary?.testFiles || "-"}</div>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tests</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{activeRun.summary?.tests || "-"}</div>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Requested By</div>
                <div className="mt-1 truncate text-sm font-semibold text-foreground">{activeRun.requestedBy || "-"}</div>
              </div>
            </section>
          )}

          {activeRun && (
            <section className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-sm border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <FileJson size={13} />
                  Result File
                </div>
                <div className="break-all font-mono text-[11px] text-foreground">{activeRun.resultPath || "-"}</div>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <FolderOpen size={13} />
                  Log File
                </div>
                <div className="break-all font-mono text-[11px] text-foreground">{activeRun.logPath || "-"}</div>
              </div>
            </section>
          )}

          <section className="academic-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border bg-secondary/30 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-foreground">{activeRun?.label || "No run selected"}</h3>
                <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{activeRun?.command || "Start a suite to see live logs."}</p>
              </div>
              {activeRun && <span className={`rounded-sm border px-2 py-1 text-[10px] uppercase ${statusClass(activeRun.status)}`}>{activeRun.status}</span>}
            </div>
            <pre className="min-h-[32rem] max-h-[42rem] overflow-auto bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              {logs.length > 0 ? logs.join("\n") : "No logs yet."}
            </pre>
          </section>
        </main>
      </section>
    </div>
  );
}
