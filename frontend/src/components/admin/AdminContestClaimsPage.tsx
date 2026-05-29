import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Gavel, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

type ContestSummary = {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  lifecycle?: string;
  status?: string;
  contestType?: string;
};

type AdminClaim = {
  _id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  adminResponse?: string;
  userId?: { fullName?: string; email?: string };
  questionId?: { title?: string; contentId?: string; problemId?: string };
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: { fullName?: string; email?: string };
};

function labelize(value?: string) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function claimStatusClass(status?: string) {
  if (status === "accepted") return "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300";
  if (status === "rejected") return "border-destructive/25 bg-destructive/10 text-destructive";
  if (status === "under_review") return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-border bg-background text-muted-foreground";
}

export default function AdminContestClaimsPage() {
  const [contests, setContests] = useState<ContestSummary[]>([]);
  const [selectedContestId, setSelectedContestId] = useState("");
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const selectedContest = useMemo(
    () => contests.find((contest) => contest._id === selectedContestId) || null,
    [contests, selectedContestId]
  );

  const fetchContests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contests", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load contests");
      const data = await res.json();
      setContests(data);
      setSelectedContestId((current) => current || data[0]?._id || "");
    } catch (error: any) {
      toast.error(error.message || "Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    if (!selectedContestId) {
      setClaims([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/contests/${selectedContestId}/claims`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load claims");
      setClaims(await res.json());
    } catch (error: any) {
      toast.error(error.message || "Failed to load contest claims");
    }
  }, [selectedContestId]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const filteredClaims = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return claims.filter((claim) => {
      const statusOk = statusFilter === "all" || claim.status === statusFilter;
      if (!statusOk) return false;
      if (!needle) return true;
      return [
        claim.title,
        claim.description,
        claim.type,
        claim.status,
        claim.userId?.fullName,
        claim.userId?.email,
        claim.questionId?.title,
        claim.questionId?.contentId,
        claim.questionId?.problemId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [claims, search, statusFilter]);

  const groupedClaims = useMemo(() => {
    const groups = new Map<string, { label: string; email: string; claims: AdminClaim[] }>();
    for (const claim of filteredClaims) {
      const label = claim.userId?.fullName || claim.userId?.email || "Unknown user";
      const email = claim.userId?.email || "";
      const key = email || label;
      const group = groups.get(key) || { label, email, claims: [] };
      group.claims.push(claim);
      groups.set(key, group);
    }
    return Array.from(groups.values());
  }, [filteredClaims]);

  const summary = useMemo(
    () => ({
      total: claims.length,
      pending: claims.filter((claim) => claim.status === "pending").length,
      review: claims.filter((claim) => claim.status === "under_review").length,
      accepted: claims.filter((claim) => claim.status === "accepted").length,
      rejected: claims.filter((claim) => claim.status === "rejected").length,
    }),
    [claims]
  );

  const updateClaim = async (claimId: string, status: string) => {
    if (!selectedContestId) return;
    const res = await fetch(`/api/admin/contests/${selectedContestId}/claims/${claimId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminResponse: responses[claimId] || "" }),
    });
    if (res.ok) {
      toast.success("Claim updated");
      fetchClaims();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "Failed to update claim");
    }
  };

  if (loading) {
    return <p className="py-8 text-sm text-muted-foreground">Loading contest claims...</p>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground">Contest Claims Review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A dedicated review page for resolving user claims without mixing them into contest setup controls.
          </p>
        </div>
        <button type="button" onClick={fetchClaims} className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-xs">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <aside className="academic-card overflow-hidden xl:sticky xl:top-4 xl:self-start">
          <div className="border-b border-border bg-secondary/30 p-4">
            <h3 className="text-sm font-bold text-foreground">Contest</h3>
            <p className="mt-1 text-xs text-muted-foreground">Select the contest whose claims you want to review.</p>
          </div>
          <div className="max-h-[34rem] overflow-y-auto p-3">
            <div className="space-y-2">
              {contests.map((contest) => {
                const active = selectedContestId === contest._id;
                return (
                  <button
                    key={contest._id}
                    type="button"
                    onClick={() => setSelectedContestId(contest._id)}
                    className={`w-full rounded-sm border p-3 text-left transition-colors ${
                      active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/20"
                    }`}
                  >
                    <div className="truncate text-xs font-bold">{contest.title}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(contest.startTime)}</div>
                    <div className="mt-2 inline-flex rounded-sm border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                      {labelize(contest.lifecycle || contest.status)}
                    </div>
                  </button>
                );
              })}
              {contests.length === 0 && (
                <div className="rounded-sm border border-border bg-background p-4 text-center text-xs text-muted-foreground">
                  No contests found.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="academic-card overflow-hidden">
            <div className="border-b border-border bg-secondary/30 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Review Queue</div>
                  <h3 className="mt-1 truncate font-serif text-lg font-bold text-foreground">
                    {selectedContest?.title || "No contest selected"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedContest ? `${formatDateTime(selectedContest.startTime)} / ${labelize(selectedContest.lifecycle || selectedContest.status)}` : "Choose a contest first."}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem]">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search claims"
                      className="w-full rounded-sm border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under review</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-b border-border bg-background p-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Total", summary.total, BarChart3],
                ["Pending", summary.pending, Clock3],
                ["Review", summary.review, Gavel],
                ["Accepted", summary.accepted, CheckCircle2],
                ["Rejected", summary.rejected, XCircle],
              ].map(([label, value, Icon]) => {
                const MetricIcon = Icon as typeof BarChart3;
                return (
                  <div key={label as string} className="rounded-sm border border-border bg-card p-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <MetricIcon size={12} />
                      {label as string}
                    </div>
                    <div className="mt-1 font-mono text-lg font-bold text-foreground">{String(value)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {groupedClaims.map((group) => (
              <section key={group.email || group.label} className="academic-card overflow-hidden">
                <div className="flex flex-col gap-1 border-b border-border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{group.label}</h4>
                    {group.email && <p className="font-mono text-[10px] text-muted-foreground">{group.email}</p>}
                  </div>
                  <span className="rounded-sm border border-border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    {group.claims.length} claim{group.claims.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {group.claims.map((claim) => (
                    <div key={claim._id} className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase ${claimStatusClass(claim.status)}`}>
                            {labelize(claim.status)}
                          </span>
                          <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                            {labelize(claim.type)}
                          </span>
                          <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                            {formatDateTime(claim.createdAt)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-foreground">{claim.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {claim.questionId?.contentId || claim.questionId?.problemId || "Contest level"} {claim.questionId?.title ? `/ ${claim.questionId.title}` : ""}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{claim.description}</p>
                        {claim.adminResponse && (
                          <div className="mt-3 rounded-sm border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                            <span className="mb-1 block font-bold text-primary">Current admin response</span>
                            {claim.adminResponse}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Decision Note</label>
                        <textarea
                          value={responses[claim._id] ?? claim.adminResponse ?? ""}
                          onChange={(event) => setResponses({ ...responses, [claim._id]: event.target.value })}
                          rows={5}
                          placeholder="Write the response visible to the user"
                          className="w-full rounded-sm border border-border bg-card px-3 py-2 text-xs outline-none focus:border-primary"
                        />
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => updateClaim(claim._id, "under_review")} className="rounded-sm border border-border px-2 py-1.5 text-[10px] hover:bg-secondary">
                            Review
                          </button>
                          <button type="button" onClick={() => updateClaim(claim._id, "accepted")} className="rounded-sm border border-green-500/30 px-2 py-1.5 text-[10px] text-green-700 hover:bg-green-500/10">
                            Accept
                          </button>
                          <button type="button" onClick={() => updateClaim(claim._id, "rejected")} className="rounded-sm border border-destructive/30 px-2 py-1.5 text-[10px] text-destructive hover:bg-destructive/10">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {filteredClaims.length === 0 && (
              <div className="academic-card p-8 text-center text-sm text-muted-foreground">
                No claims match this contest and filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
