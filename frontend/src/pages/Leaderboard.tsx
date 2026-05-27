import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  handle: string;
  fullName: string;
  institution: string;
  rating: number;
  solved: number;
};

const periods = ["All Time", "This Month", "This Week"];
const periodQueryMap: Record<string, string> = {
  "All Time": "all",
  "This Month": "this_month",
  "This Week": "this_week",
};

export default function Leaderboard() {
  const [period, setPeriod] = useState("All Time");
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ period: periodQueryMap[period] });
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/leaderboard?${query.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        setLeaders(json.leaderboard || []);
      } catch {
        setError("Unable to load leaderboard right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period]);

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-mono text-muted-foreground mb-1">Rankings</div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Ranked by contest rating and solved score across GATE DA contests.</p>
        </div>
        <div className="flex border border-border rounded-sm overflow-hidden text-xs">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 transition-colors duration-150 ${period === p ? "bg-secondary text-foreground font-medium" : "bg-card text-muted-foreground hover:bg-secondary/60"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[680px] w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal w-16">Rank</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Name</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal hidden md:table-cell">Institution</th>
              <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal">Rating</th>
              <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal hidden sm:table-cell">Solved</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">Loading leaderboard…</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-destructive">{error}</td>
              </tr>
            ) : leaders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">No leaderboard data available.</td>
              </tr>
            ) : (
              leaders.map((entry) => (
                <tr key={entry.handle} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {entry.rank <= 3 ? (
                      <span className={entry.rank === 1 ? "text-foreground font-bold" : "text-foreground/70"}>{entry.rank}</span>
                    ) : entry.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{entry.handle}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{entry.fullName}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{entry.institution}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-foreground">{entry.rating}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">{entry.solved}</td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <span>Top {leaders.length} users by rating and recent activity.</span>
        <div className="flex gap-1">
          <button disabled className="px-3 py-1.5 border border-border rounded-sm text-muted-foreground bg-background">←</button>
          <button className="px-3 py-1.5 border border-border rounded-sm bg-secondary font-medium text-foreground">1</button>
          <button disabled className="px-3 py-1.5 border border-border rounded-sm text-muted-foreground bg-background">2</button>
          <button disabled className="px-3 py-1.5 border border-border rounded-sm text-muted-foreground bg-background">→</button>
        </div>
      </div>
    </div>
  );
}
