import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, ScrollText, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

type PlatformLog = {
  _id: string;
  category: string;
  action: string;
  status: "success" | "warning" | "error";
  message: string;
  targetType?: string;
  targetId?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  performedBy?: { fullName?: string; email?: string };
  createdAt: string;
};

const statusIcon = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const statusClass = {
  success: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  error: "border-destructive/25 bg-destructive/10 text-destructive",
};

function titleCase(value?: string) {
  if (!value) return "Item";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLogTitle(log: PlatformLog) {
  const target = titleCase(log.targetType || log.category);
  const action = log.action.toLowerCase();
  if (action.includes("create")) return `${target} created`;
  if (action.includes("update")) return `${target} updated`;
  if (action.includes("delete")) return `${target} deleted`;
  if (action.includes("skip")) return `${target} skipped`;
  if (action.includes("import")) return `${target} import`;
  if (action.includes("valid")) return `${target} validation`;
  return titleCase(log.action || log.message || "Platform log");
}

function getLogSubtitle(log: PlatformLog) {
  const admin = log.performedBy?.fullName || log.performedBy?.email || "System";
  return `${titleCase(log.category)} / ${admin}`;
}

export default function AdminPlatformLogs() {
  const [logs, setLogs] = useState<PlatformLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "150" });
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      setLogs(await res.json());
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [
      log.category,
      log.action,
      log.status,
      log.message,
      log.targetType,
      log.targetId,
      log.requestId,
      log.performedBy?.fullName,
      log.performedBy?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  }), [logs, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-sm border border-border bg-secondary/30 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
              <ScrollText size={13} />
              Audit Trail
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Platform Logs</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Detailed admin activity, taxonomy imports, validations, updates, skipped rows, and failures.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[18rem]">
            <div className="rounded-sm border border-border bg-background px-3 py-2">
              <div className="font-mono text-lg font-bold text-foreground">{logs.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Loaded</div>
            </div>
            <div className="rounded-sm border border-border bg-background px-3 py-2">
              <div className="font-mono text-lg font-bold text-primary">{filteredLogs.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Visible</div>
            </div>
            <div className="rounded-sm border border-border bg-background px-3 py-2">
              <div className="font-mono text-lg font-bold text-destructive">
                {logs.filter((log) => log.status === "error").length}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Errors</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card p-3">
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_10rem_10rem_auto]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search action, target, admin, request ID"
            className="w-full rounded-sm border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
        >
          <option value="">All categories</option>
          <option value="taxonomy">Taxonomy</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex w-full items-center justify-center gap-1 rounded-sm border border-border bg-background px-3 py-2.5 text-xs hover:bg-secondary"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      </div>

      <div className="academic-card overflow-hidden">
        <div className="grid gap-3 p-3">
          {filteredLogs.map((log) => {
            const Icon = statusIcon[log.status];
            const expanded = expandedId === log._id;
            const ToggleIcon = expanded ? ChevronUp : ChevronDown;
            return (
              <div key={log._id} className="rounded-sm border border-border bg-background shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : log._id)}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-secondary/25"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold ${statusClass[log.status]}`}>
                      <Icon size={11} />
                      {log.status}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {getLogTitle(log)}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {getLogSubtitle(log)}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <ToggleIcon size={14} className="text-muted-foreground" />
                  </span>
                </button>

                {expanded && (
                  <div className="border-t border-border p-3">
                    <div className="grid gap-2 text-[11px] md:grid-cols-2 xl:grid-cols-4">
                      <div className="min-w-0 rounded-sm border border-border bg-card px-2 py-1.5">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Action</div>
                        <div className="break-all font-mono text-foreground">{log.action || "-"}</div>
                      </div>
                      <div className="min-w-0 rounded-sm border border-border bg-card px-2 py-1.5">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Target</div>
                        <div className="break-all font-mono text-foreground">{log.targetType || "-"}</div>
                        <div className="break-all font-mono text-muted-foreground">{log.targetId || "-"}</div>
                      </div>
                      <div className="min-w-0 rounded-sm border border-border bg-card px-2 py-1.5">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Request</div>
                        <div className="break-all font-mono text-foreground">{log.requestId || "-"}</div>
                      </div>
                      <div className="min-w-0 rounded-sm border border-border bg-card px-2 py-1.5">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Time</div>
                        <div className="font-mono text-foreground">{new Date(log.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-2 rounded-sm border border-border bg-card p-2 text-xs leading-relaxed text-foreground">
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Message</div>
                      <div className="break-words">{log.message}</div>
                    </div>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-border bg-card p-2 text-[10px] text-muted-foreground">
                      {JSON.stringify(log.details || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {loading ? "Loading logs..." : "No logs match the current filters."}
          </div>
        )}
      </div>
    </div>
  );
}
