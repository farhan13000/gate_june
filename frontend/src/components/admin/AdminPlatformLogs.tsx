import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ScrollText, Search, XCircle } from "lucide-react";
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
  success: "border-green-500/20 bg-green-500/10 text-green-700",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  error: "border-destructive/25 bg-destructive/10 text-destructive",
};

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

  const filteredLogs = logs.filter((log) => {
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
  });

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-sm border border-border bg-secondary/30 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
              <ScrollText size={13} />
              Audit Trail
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Platform Logs</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Detailed admin activity, taxonomy imports, validations, updates, skipped rows, and failures.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
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

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_auto]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search logs by action, target, admin, or request ID..."
            className="w-full rounded-sm border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-sm border border-border bg-card px-3 py-2 text-xs"
        >
          <option value="">All categories</option>
          <option value="taxonomy">Taxonomy</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-sm border border-border bg-card px-3 py-2 text-xs"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center justify-center gap-1 rounded-sm border border-border bg-card px-3 py-2.5 text-xs hover:bg-secondary"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="academic-card overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[860px] w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-3 py-2 text-left font-normal text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-normal text-muted-foreground">Action</th>
                <th className="px-3 py-2 text-left font-normal text-muted-foreground">Target</th>
                <th className="px-3 py-2 text-left font-normal text-muted-foreground">Message</th>
                <th className="px-3 py-2 text-left font-normal text-muted-foreground">Admin</th>
                <th className="px-3 py-2 text-left font-normal text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const Icon = statusIcon[log.status];
                const expanded = expandedId === log._id;
                return (
                  <tr key={log._id} className="border-b border-border-faint align-top hover:bg-secondary/20">
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold ${statusClass[log.status]}`}>
                        <Icon size={11} />
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{log.action}</td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-[11px] text-foreground">{log.targetType || "-"}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{log.targetId || log.requestId || "-"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : log._id)}
                        className="max-w-[24rem] text-left text-foreground hover:text-primary"
                      >
                        {log.message}
                      </button>
                      {expanded && (
                        <pre className="mt-2 max-h-52 overflow-auto rounded-sm border border-border bg-background p-2 text-[10px] text-muted-foreground">
                          {JSON.stringify(log.details || {}, null, 2)}
                        </pre>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{log.performedBy?.fullName || log.performedBy?.email || "-"}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {filteredLogs.map((log) => {
            const Icon = statusIcon[log.status];
            const expanded = expandedId === log._id;
            return (
              <div key={log._id} className="rounded-sm border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold ${statusClass[log.status]}`}>
                    <Icon size={11} />
                    {log.status}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">{log.action}</div>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : log._id)}
                  className="mt-1 text-left text-sm font-medium text-foreground"
                >
                  {log.message}
                </button>
                <div className="mt-2 font-mono text-[10px] text-muted-foreground">{log.targetType || "-"} / {log.targetId || log.requestId || "-"}</div>
                {expanded && (
                  <pre className="mt-2 max-h-52 overflow-auto rounded-sm border border-border bg-card p-2 text-[10px] text-muted-foreground">
                    {JSON.stringify(log.details || {}, null, 2)}
                  </pre>
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
