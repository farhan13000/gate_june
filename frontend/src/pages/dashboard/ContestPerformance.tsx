import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, Search, History, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { AccuracyBar } from "./PerformanceAnalytics";

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "2px",
    fontSize: "11px",
    fontFamily: "JetBrains Mono",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))" },
};

export default function ContestPerformance() {
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState<any[]>([]);
  const [testTypePerformance, setTestTypePerformance] = useState<any[]>([]);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [contestSummary, setContestSummary] = useState<any>({
    ratedContests: 0,
    highestRating: 1500,
    averageRank: "-",
    avgPenalty: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfRes, historyRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/contest-performance`, { credentials: "include" }),
          fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/test-history?limit=10`, { credentials: "include" })
        ]);
        
        if (perfRes.ok) {
          const json = await perfRes.json();
          setRatingData(json.ratingData || []);
          setTestTypePerformance(json.testTypePerformance || []);
          setContestSummary(json.contestSummary || contestSummary);
        }
        
        if (historyRes.ok) {
          const json = await historyRes.json();
          setTestHistory(json.tests || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasData = ratingData.length > 0 || testHistory.length > 0;

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground font-mono">Loading performance data...</div>;
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0f172a] flex items-center gap-2">
            <Trophy className="text-[#2563eb]" /> Tests & Contests
          </h1>
          <p className="text-sm text-[#64748b] mt-1">Your contest ratings and test history.</p>
        </div>
        <div className="bg-white border border-dashed border-[#cbd5e1] rounded-none p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-[#f8fbff] rounded-none border border-[#e2e8f0] flex items-center justify-center mb-6">
            <Trophy className="text-[#64748b] w-10 h-10" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#0f172a] mb-2">No Contests Taken Yet</h2>
          <p className="text-[#64748b] max-w-md mb-8">
            You haven't participated in any rated contests or practice tests yet. Start practicing to see your rating curve, performance breakdown, and rank history here.
          </p>
          <Link to="/contests" className="bg-[#2563eb] text-white px-6 py-2.5 rounded-none font-semibold hover:bg-[#1d4ed8] transition-colors">
            Explore Contests & Tests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Trophy className="text-primary" /> Tests & Contests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your GATE DA rating history, penalty analysis, and test history.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        
        {/* Rating Curve */}
        <div className="bg-white border border-[#e2e8f0] rounded-none shadow-sm p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] text-[#64748b] font-mono uppercase tracking-wide">GATE DA Rating</p>
              <h2 className="text-3xl font-mono font-bold text-[#2563eb]">{contestSummary.highestRating}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#64748b] font-mono uppercase tracking-wide">Global Rank</p>
              <h2 className="text-3xl font-mono font-bold text-[#0f172a]">#{contestSummary.averageRank === "-" ? "—" : contestSummary.averageRank}</h2>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px]">
             {ratingData.length <= 1 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#64748b]">
                <AlertCircle className="mb-2 w-8 h-8 opacity-50" />
                <p className="text-sm">Not enough data to plot rating curve.</p>
                <p className="text-xs opacity-75 mt-1">Participate in more rated contests.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="rating" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Contest Stats */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e2e8f0] rounded-none shadow-sm p-6">
            <h3 className="font-serif font-semibold text-[#0f172a] mb-4">Contest Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
                <span className="text-sm font-medium text-[#64748b]">Rated Contests</span>
                <span className="font-mono font-bold text-[#0f172a]">{contestSummary.ratedContests}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
                <span className="text-sm font-medium text-[#64748b]">Highest Rating</span>
                <span className="font-mono font-bold text-[#2563eb]">{contestSummary.highestRating}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
                <span className="text-sm font-medium text-[#64748b]">Average Rank</span>
                <span className="font-mono font-bold text-[#0f172a]">{contestSummary.averageRank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#64748b]">Penalty Min (Avg)</span>
                <span className="font-mono font-bold text-[#dc2626]">{contestSummary.avgPenalty}m</span>
              </div>
            </div>
            <Link to="/contests" className="mt-6 block w-full py-2 text-center text-sm font-semibold border border-[#2563eb] text-[#2563eb] rounded-none hover:bg-[#eff6ff] transition-colors">
              Explore Contests
            </Link>
          </div>
        </div>
      </div>

      {/* Test Type Performance */}
      {testTypePerformance.length > 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-none shadow-sm">
          <div className="p-5 border-b border-[#e2e8f0]">
            <h3 className="font-serif font-semibold text-[#0f172a]">Performance by Test Type</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fbff]">
                  {["Test Type", "Taken", "Avg Score", "Avg Acc.", "Best Rank"].map(h => (
                    <th key={h} className="text-left py-3 px-5 text-[#64748b] font-mono font-bold text-[11px] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testTypePerformance.map(t => (
                  <tr key={t.type} className="border-b border-[#e2e8f0] hover:bg-[#f8fbff] transition-colors">
                    <td className="py-3 px-5 font-semibold text-[#0f172a]">{t.type}</td>
                    <td className="py-3 px-5 font-mono font-medium text-[#64748b]">{t.attempted}</td>
                    <td className="py-3 px-5 font-mono font-medium text-[#64748b]">{t.avgScore}</td>
                    <td className="py-3 px-5">
                      <span className={`font-mono font-bold ${t.avgAccuracy >= 75 ? "text-[#15803d]" : "text-[#0f172a]"}`}>{t.avgAccuracy}%</span>
                    </td>
                    <td className="py-3 px-5 font-mono font-medium text-[#64748b]">#{t.bestRank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test History Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-none shadow-sm">
        <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center">
          <h3 className="font-serif font-semibold text-[#0f172a] flex items-center gap-2">
            <History className="w-4 h-4 text-[#2563eb]" /> Test History
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search tests..."
              className="w-full bg-[#f8fbff] border border-[#e2e8f0] rounded-none pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#2563eb]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fbff]">
                <th className="text-left py-3 px-5 font-bold text-[#64748b] font-mono text-[11px] uppercase tracking-wide">Test Name</th>
                <th className="text-left py-3 px-5 font-bold text-[#64748b] font-mono text-[11px] uppercase tracking-wide">Type</th>
                <th className="text-left py-3 px-5 font-bold text-[#64748b] font-mono text-[11px] uppercase tracking-wide">Date</th>
                <th className="text-left py-3 px-5 font-bold text-[#64748b] font-mono text-[11px] uppercase tracking-wide">Score</th>
                <th className="text-left py-3 px-5 font-bold text-[#64748b] font-mono text-[11px] uppercase tracking-wide">Rank</th>
                <th className="text-left py-3 px-5 font-bold text-[#64748b] font-mono text-[11px] uppercase tracking-wide">Accuracy</th>
                <th className="text-right py-3 px-5 font-bold text-[#64748b] font-mono text-[11px] uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {testHistory.map((test, i) => (
                <tr key={i} className="border-b border-[#e2e8f0] hover:bg-[#f8fbff] transition-colors">
                  <td className="py-3 px-5 font-semibold text-[#0f172a]">{test.title}</td>
                  <td className="py-3 px-5 text-[#64748b] font-medium text-[10px] uppercase tracking-wider">{test.type}</td>
                  <td className="py-3 px-5 font-mono text-[#64748b]">{new Date(test.date).toLocaleDateString()}</td>
                  <td className="py-3 px-5 font-mono font-bold text-[#0f172a]">{test.score}</td>
                  <td className="py-3 px-5 font-mono font-medium text-[#64748b]">#{test.rank}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#0f172a] w-10 text-xs">{test.accuracy}%</span>
                      <div className="flex-1 max-w-[60px]"><AccuracyBar value={test.accuracy} /></div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Link 
                      to={`/contests/${test.id}/details`} 
                      className="text-[#2563eb] hover:underline text-xs font-bold"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {testHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748b] font-mono font-medium">No recent tests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
