import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, Eye, Lock, LogIn, ShieldCheck, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type ContestQuestion = {
  _id: string;
  title: string;
  contentId?: string;
  problemId?: string;
  difficulty: string;
  questionType: string;
  topic?: string;
};

type Contest = {
  _id: string;
  title: string;
  description: string;
  meta?: string;
  contestType: string;
  scoringMode: string;
  lifecycle: string;
  contestState: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  wrongPenaltyMinutes: number;
  ratingEnabled: boolean;
  instantFeedback: boolean;
  registrationCount: number;
  maxParticipants?: number;
  rules?: string[];
  questions?: ContestQuestion[];
  userRegistration?: { status: string; registeredAt: string } | null;
};

const postContestStates = ["ended", "answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"];

function labelize(value?: string) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resultActionLabel(state: string) {
  if (state === "claims_open") return "Answer Key / Claim";
  if (state === "answer_key_released" || state === "claims_closed") return "Answer Key";
  if (state === "finalized" || state === "ratings_applied") return "View Results";
  return "View Summary";
}

export default function ContestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchContest = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contests/${id}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load contest");
      setContest(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load contest");
      setContest(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContest();
  }, [fetchContest]);

  useEffect(() => {
    if (!id) return undefined;
    const esUrl = `${import.meta.env.VITE_API_BASE || ""}/api/contests/stream`;
    const es = new EventSource(esUrl, { withCredentials: true });
    es.addEventListener("contests-update", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const updated = Array.isArray(data.contests)
          ? data.contests.find((item: Contest) => String(item._id) === String(id))
          : null;
        if (updated) {
          setContest(updated);
          setLoading(false);
        }
      } catch {
        // Keep the current detail; normal fetch and manual actions still refresh it.
      }
    });
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [id]);

  const updateRegistration = async (action: "register" | "withdraw" | "check-in") => {
    if (!contest) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/contests/${contest._id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Contest action failed");
      if (action === "check-in") {
        navigate(`/contests/${contest._id}`);
        return;
      }
      toast.success(action === "withdraw" ? "Registration withdrawn" : "Registered for contest");
      fetchContest();
    } catch (error: any) {
      toast.error(error.message || "Contest action failed");
    } finally {
      setBusy(false);
    }
  };

  const renderPrimaryAction = () => {
    if (!contest) return null;
    const registered = contest.userRegistration && contest.userRegistration.status !== "withdrawn";
    if (!isAuthenticated) {
      return (
        <Link to="/login" className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs">
          <LogIn size={13} />
          Sign in
        </Link>
      );
    }
    if (["live", "frozen"].includes(contest.contestState)) {
      return registered ? (
        <button type="button" disabled={busy} onClick={() => updateRegistration("check-in")} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-50">
          <Trophy size={13} />
          Enter Arena
        </button>
      ) : contest.contestState === "live" ? (
        <button type="button" disabled={busy} onClick={() => updateRegistration("register")} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-50">
          Register
        </button>
      ) : (
        <button type="button" disabled className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs opacity-60">
          <Lock size={13} />
          Registration Closed
        </button>
      );
    }
    if (registered && postContestStates.includes(contest.contestState)) {
      return (
        <button type="button" onClick={() => navigate(`/contests/${contest._id}`)} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs">
          <Eye size={13} />
          {resultActionLabel(contest.contestState)}
        </button>
      );
    }
    if (registered) {
      return (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-sm border border-green-500/25 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-700 dark:text-green-300">
            <CheckCircle2 size={13} />
            Registered
          </span>
          <button type="button" disabled={busy} onClick={() => updateRegistration("withdraw")} className="btn-outline px-4 py-2 text-xs disabled:opacity-50">
            Withdraw
          </button>
        </div>
      );
    }
    if (["registration_open", "upcoming"].includes(contest.contestState)) {
      return (
        <button type="button" disabled={busy} onClick={() => updateRegistration("register")} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs disabled:opacity-50">
          Register
        </button>
      );
    }
    return (
      <button type="button" disabled className="btn-outline inline-flex items-center justify-center gap-2 px-4 py-2 text-xs opacity-60">
        <Lock size={13} />
        Closed
      </button>
    );
  };

  if (loading) {
    return <div className="academic-card p-10 text-center text-sm text-muted-foreground">Loading contest details...</div>;
  }

  if (!contest) {
    return (
      <div className="academic-card p-10 text-center">
        <h1 className="font-serif text-xl font-bold text-foreground">Contest not found</h1>
        <button type="button" onClick={() => navigate("/contests")} className="btn-outline mt-4 px-4 py-2 text-xs">
          Back to contests
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <button type="button" onClick={() => navigate("/contests")} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        Back to contests
      </button>

      <div className="academic-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-sm border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {labelize(contest.contestState)}
              </span>
              <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                {labelize(contest.contestType)}
              </span>
              {contest.ratingEnabled && (
                <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  Rated
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{contest.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{contest.description}</p>
          </div>
          <div className="shrink-0">{renderPrimaryAction()}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Starts", formatDate(contest.startTime), CalendarClock],
          ["Duration", `${contest.durationMinutes} min`, Clock3],
          ["Participants", String(contest.registrationCount), Users],
          ["Scoring", labelize(contest.scoringMode), ShieldCheck],
        ].map(([label, value, Icon]) => {
          const DetailIcon = Icon as typeof CalendarClock;
          return (
            <div key={label as string} className="rounded-sm border border-border bg-card p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-secondary/30 text-primary">
                <DetailIcon size={16} />
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label as string}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{value as string}</div>
            </div>
          );
        })}
      </div>

      <div className="academic-card p-4">
          <h2 className="font-serif text-base font-bold text-foreground">Rules</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            {(contest.rules || []).map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.45)]" />
                <span>{rule}</span>
              </li>
            ))}
            {(contest.rules || []).length === 0 && (
              <li>Contest rules will follow the configured scoring, timing, and answer-key release settings.</li>
            )}
          </ul>
      </div>
    </div>
  );
}
