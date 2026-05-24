import {
  BarChart2, TrendingUp, Edit2, UserMinus, Share2, Download,
  BookOpen, Target, AlertTriangle, CheckCircle2, Clock, Award,
  ChevronRight, Flame, Zap, BarChart, PieChart as PieChartIcon
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, Cell, PieChart, Pie, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, CartesianGrid
} from "recharts";
import { useEffect, useState } from "react";

// ── Data ────────────────────────────────────────────────────────────────────

const ratingData = [
  { date: "Oct", rating: 1420 },
  { date: "Nov", rating: 1580 },
  { date: "Dec", rating: 1510 },
  { date: "Jan", rating: 1720 },
  { date: "Feb", rating: 1890 },
  { date: "Mar", rating: 2041 },
];

const subjectPerformance = [
  { subject: "Statistics", attempted: 62, correct: 48, accuracy: 77, avgTime: 2.1, weak: false },
  { subject: "Linear Algebra", attempted: 40, correct: 24, accuracy: 60, avgTime: 3.2, weak: true },
  { subject: "Probability", attempted: 55, correct: 47, accuracy: 85, avgTime: 1.8, weak: false },
  { subject: "Machine Learning", attempted: 38, correct: 20, accuracy: 53, avgTime: 4.1, weak: true },
  { subject: "Databases", attempted: 45, correct: 41, accuracy: 91, avgTime: 1.5, weak: false },
  { subject: "Python", attempted: 50, correct: 44, accuracy: 88, avgTime: 2.0, weak: false },
  { subject: "Optimization", attempted: 30, correct: 12, accuracy: 40, avgTime: 5.3, weak: true },
  { subject: "Calculus", attempted: 28, correct: 18, accuracy: 64, avgTime: 3.8, weak: true },
];

const difficultyPerformance = [
  { level: "Easy", accuracy: 92, attempted: 130, correct: 120 },
  { level: "Medium", accuracy: 71, attempted: 95, correct: 67 },
  { level: "Hard", accuracy: 48, attempted: 60, correct: 29 },
];

const questionTypePerformance = [
  { type: "MCQ (Single)", accuracy: 82, attempted: 145, avgTime: 1.6 },
  { type: "MCQ (Multi)", accuracy: 61, attempted: 80, avgTime: 2.8 },
  { type: "NAT", accuracy: 54, attempted: 55, avgTime: 4.2 },
  { type: "MSQ", accuracy: 68, attempted: 40, avgTime: 3.1 },
  { type: "Fill-in", accuracy: 73, attempted: 25, avgTime: 2.4 },
];

const testTypePerformance = [
  { type: "Full Mock", attempted: 6, avgScore: 58.2, avgAccuracy: 65, bestRank: 48 },
  { type: "Subject Test", attempted: 18, avgScore: 72.4, avgAccuracy: 78, bestRank: 12 },
  { type: "Chapter Test", attempted: 34, avgScore: 81.6, avgAccuracy: 85, bestRank: 5 },
  { type: "Practice Set", attempted: 120, avgScore: 76.1, avgAccuracy: 80, bestRank: 3 },
  { type: "PYQ Set", attempted: 12, avgScore: 69.3, avgAccuracy: 72, bestRank: 22 },
];

const chapterWiseData = [
  { chapter: "Eigenvalues", subject: "Linear Algebra", accuracy: 35, priority: "High", format: "NAT + MCQ" },
  { chapter: "Gradient Descent", subject: "Optimization", accuracy: 28, priority: "High", format: "NAT" },
  { chapter: "Bayes Theorem", subject: "Probability", accuracy: 55, priority: "Medium", format: "MCQ Multi" },
  { chapter: "SQL Joins", subject: "Databases", accuracy: 88, priority: "Low", format: "MCQ Single" },
  { chapter: "SVM Kernels", subject: "Machine Learning", accuracy: 32, priority: "High", format: "MCQ Multi" },
  { chapter: "Integration", subject: "Calculus", accuracy: 48, priority: "Medium", format: "NAT" },
  { chapter: "Hypothesis Testing", subject: "Statistics", accuracy: 61, priority: "Medium", format: "NAT + MCQ" },
  { chapter: "Decision Trees", subject: "Machine Learning", accuracy: 71, priority: "Low", format: "MCQ Single" },
];

const weeklyActivity = [
  { day: "Mon", questions: 18, time: 45 },
  { day: "Tue", questions: 25, time: 62 },
  { day: "Wed", questions: 8, time: 20 },
  { day: "Thu", questions: 32, time: 78 },
  { day: "Fri", questions: 14, time: 35 },
  { day: "Sat", questions: 45, time: 110 },
  { day: "Sun", questions: 28, time: 70 },
];

const radarData = subjectPerformance.slice(0, 6).map(s => ({
  subject: s.subject.split(" ")[0],
  score: s.accuracy,
  fullMark: 100,
}));

const generateHeatmap = () => {
  const days: { date: string; count: number }[] = [];
  const now = new Date(2026, 2, 4);
  for (let i = 180; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const count = Math.random() < 0.35 ? Math.floor(Math.random() * 5) + 1 : 0;
    days.push({ date: d.toISOString().split("T")[0], count });
  }
  return days;
};
const heatmapData = generateHeatmap();
const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
const weeks: { date: string; count: number }[][] = [];
let week: { date: string; count: number }[] = [];
heatmapData.forEach((d, i) => {
  week.push(d);
  if (week.length === 7 || i === heatmapData.length - 1) { weeks.push(week); week = []; }
});

const badges = [
  { name: "Code Enthusiast", tier: "No Badge", progress: 0, total: 10, desc: "Explain 10 Solutions to get Bronze Badge", likes: 0, dislikes: 0 },
  { name: "Contest Contender", tier: "Bronze", progress: 21, total: 21, desc: "Participate in 21 contests to get Silver Badge", likes: 0, dislikes: 0 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const AccuracyBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const pct = (value / max) * 100;
  const color = value >= 75 ? "hsl(var(--primary))" : value >= 55 ? "hsl(var(--primary) / 0.55)" : "hsl(var(--destructive))";
  return (
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-card border border-border rounded-sm p-4 text-center">
    <div className="font-mono text-2xl font-bold text-primary">{value}</div>
    <div className="text-xs text-foreground mt-1 font-medium">{label}</div>
    {sub && <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{sub}</div>}
  </div>
);

const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-4">
    <h2 className="font-serif font-bold text-base text-foreground">{title}</h2>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    <div className="h-px bg-border mt-2" />
  </div>
);

const PriorityBadge = ({ p }: { p: string }) => {
  const styles: Record<string, string> = {
    High: "bg-destructive/10 text-destructive border-destructive/30",
    Medium: "bg-primary/10 text-primary border-primary/30",
    Low: "bg-secondary text-muted-foreground border-border",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 border rounded-sm font-mono font-bold ${styles[p]}`}>{p}</span>;
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.65)",
  "hsl(var(--primary) / 0.4)",
  "hsl(var(--muted-foreground) / 0.5)",
  "hsl(var(--destructive) / 0.7)",
];

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

// ── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [ratingTab, setRatingTab] = useState<"current" | "old">("current");
  const [perfTab, setPerfTab] = useState<"subject" | "difficulty" | "type" | "testtype">("subject");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);

  useEffect(() => {
    console.log("Dashboard: mounting — fetching initial data");
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        console.log("Dashboard: initial data received", json);
        setDashboard(json.dashboard);
      } catch (err) {
        console.error("Dashboard: failed to fetch initial data", err);
      }
    };

    fetchDashboard();

    // Subscribe to SSE stream for live updates
    try {
      const esUrl = `${import.meta.env.VITE_API_BASE || ""}/api/dashboard/stream`;
      const es = new EventSource(esUrl);
      es.addEventListener("dashboard-update", (e: any) => {
        try {
          const data = JSON.parse(e.data);
          console.log("Dashboard: SSE update", data);
          setDashboard((prev: any) => ({ ...prev, stats: { ...prev?.stats, ...data } }));
        } catch (err) {
          console.error("Dashboard: SSE parse error", err);
        }
      });
      es.onerror = (ev) => {
        console.error("Dashboard: SSE error", ev);
        es.close();
      };

      return () => {
        console.log("Dashboard: unmounting — closing SSE");
        es.close();
      };
    } catch (err) {
      console.error("Dashboard: SSE setup failed", err);
    }
  }, []);

  // Merge server-provided data (if any) with the static defaults
  const subjectPerformanceData = dashboard?.subjectPerformance ?? subjectPerformance;
  const totalAttempted = dashboard?.stats?.totalAttempted ?? subjectPerformanceData.reduce((s: number, x: any) => s + x.attempted, 0);
  const totalCorrect = dashboard?.stats?.totalCorrect ?? subjectPerformanceData.reduce((s: number, x: any) => s + x.correct, 0);
  const overallAccuracy = dashboard?.stats?.overallAccuracy ?? (totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0);
  const weakSubjects = subjectPerformanceData.filter((s: any) => s.weak);

  // Derived radar data dynamically
  const radarData = subjectPerformanceData.slice(0, 6).map((s: any) => ({
    subject: s.subject.split(" ")[0],
    score: s.accuracy,
    fullMark: 100,
  }));

  // Dynamic charts and arrays
  const difficultyPerformanceData = dashboard?.difficultyPerformance ?? difficultyPerformance;
  const questionTypePerformanceData = dashboard?.questionTypePerformance ?? questionTypePerformance;
  const weeklyActivityData = dashboard?.weeklyActivity ?? weeklyActivity;
  const ratingDataData = dashboard?.ratingData ?? ratingData;
  const chapterWiseDataData = dashboard?.chapterWiseData ?? chapterWiseData;

  // Heatmap calculation
  const heatmapDataData = dashboard?.heatmapData ?? heatmapData;
  const weeks: any[][] = [];
  let week: any[] = [];
  heatmapDataData.forEach((d: any, i: number) => {
    week.push(d);
    if (week.length === 7 || i === heatmapDataData.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  const rating = dashboard?.stats?.rating ?? 1500;
  const problemsSolved = dashboard?.stats?.problemsSolved ?? 0;
  const streak = dashboard?.stats?.currentStreakDays ?? 0;
  const contests = dashboard?.stats?.contestsParticipated ?? 0;
  
  const globalRank = typeof dashboard?.stats?.rating === "number" ? `#${Math.max(1, 2000 - Math.floor(rating * 0.95))}` : "—";
  const countryRank = typeof dashboard?.stats?.rating === "number" ? `#${Math.max(1, 500 - Math.floor(rating * 0.24))}` : "—";
  const ratingStarsCount = Math.min(5, Math.max(1, Math.floor(rating / 400)));

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-6 font-mono">
        <span className="text-primary cursor-pointer hover:underline">Home</span>
        <span className="mx-1">»</span>
        <span>{dashboard?.profile?.fullName ?? "Student"}</span>
        <span className="mx-1">»</span>
        <span className="text-muted-foreground">Dashboard</span>
      </div>

      {/* Quick Sections Nav */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {[
          ["Overview", "#overview"],
          ["Performance", "#performance"],
          ["Practice", "#practice"],
          ["Activity", "#activity"],
          ["Topic Mastery", "#topic-mastery"],
          ["Quick Panel", "#quick-panel"],
        ].map(([label, href]) => (
          <a key={href as string} href={href as string} className="text-xs py-1 px-2 border border-border rounded-sm bg-background text-muted-foreground hover:bg-secondary/40">{label}</a>
        ))}
      </div>

      {/* ── Top Stats Bar ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Attempted" value={String(totalAttempted)} sub="all tests" />
        <StatCard label="Correct" value={String(totalCorrect)} sub="answers" />
        <StatCard label="Accuracy" value={`${overallAccuracy}%`} sub="overall" />
        <StatCard label="Problems Solved" value={String(problemsSolved)} sub="unique" />
        <StatCard label="Current Streak" value={`${streak}d`} sub="days active" />
        <StatCard label="GATE DA Rating" value={String(rating)} sub={`${globalRank} global`} />
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* ════ LEFT 2/3 ════ */}
        <div className="md:col-span-2 space-y-6">

          {/* Profile Card */}
          <div id="overview" className="bg-card border border-border rounded-sm p-5">
            <div className="flex items-start gap-5 pb-4 border-b border-border">
              <div className="w-14 h-14 bg-secondary border border-border rounded-sm flex items-center justify-center shrink-0">
                <svg viewBox="0 0 64 64" className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="32" cy="22" r="10" /><path d="M10 54c0-12 10-20 22-20s22 8 22 20" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h1 className="font-serif text-lg font-bold text-foreground">{dashboard?.profile?.fullName ?? "Student"}</h1>
                  <div className="flex gap-2">
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={13} /></button>
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><UserMinus size={13} /></button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
                  {[
                    ["Email", dashboard?.profile?.email ?? "—"],
                    ["Role", dashboard?.profile?.role ?? "student"],
                    ["Institution", dashboard?.profile?.institution ?? "—"],
                    ["Target Year", dashboard?.profile?.targetGateYear ? String(dashboard.profile.targetGateYear) : "—"],
                    ["Auth", dashboard?.profile?.authProvider ?? "local"],
                    ["Member Since", dashboard?.profile?.createdAt ? new Date(dashboard.profile.createdAt).toLocaleDateString() : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground w-28 shrink-0">{k}:</span>
                      <span className="text-foreground font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Quick insight strip */}
            <div className="pt-3 flex flex-wrap gap-2">
              {weakSubjects.map(s => (
                <span key={s.subject} className="inline-flex items-center gap-1 text-[10px] bg-destructive/8 border border-destructive/25 text-destructive px-2 py-0.5 rounded-sm font-mono">
                  <AlertTriangle size={9} /> Weak: {s.subject} ({s.accuracy}%)
                </span>
              ))}
              {subjectPerformanceData.filter((s: any) => !s.weak && s.attempted > 0).slice(0, 1).map((s: any) => (
                <span key={s.subject} className="inline-flex items-center gap-1 text-[10px] bg-primary/8 border border-primary/25 text-primary px-2 py-0.5 rounded-sm font-mono">
                  <CheckCircle2 size={9} /> Strong: {s.subject} ({s.accuracy}%)
                </span>
              ))}
              <span className="inline-flex items-center gap-1 text-[10px] bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-sm font-mono">
                <Flame size={9} /> {streak}-day streak
              </span>
            </div>
          </div>

          {/* ── Performance Analytics Tabs ── */}
          <div id="performance" className="bg-card border border-border rounded-sm p-5">
            <SectionHeader title="Performance Analytics" sub="Accuracy, attempts, and time analysis across all dimensions" />

            {/* Tab bar */}
            <div className="flex border border-border rounded-sm overflow-hidden mb-5 w-fit text-xs font-mono">
              {([
                ["subject", "By Subject"],
                ["difficulty", "By Difficulty"],
                ["type", "By Question Type"],
                ["testtype", "By Test Type"],
              ] as [typeof perfTab, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPerfTab(key)}
                  className={`px-3 py-1.5 transition-colors border-r last:border-r-0 border-border ${perfTab === key ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Subject tab */}
            {perfTab === "subject" && (
              <div className="space-y-4">
                {/* Radar + bar side-by-side */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono mb-2 uppercase tracking-wide">Subject Radar</p>
                    <ResponsiveContainer width="100%" height={180}>
                      {radarData && radarData.length > 0 ? (
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} />
                          <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={1.5} />
                        </RadarChart>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No subject data available</div>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono mb-2 uppercase tracking-wide">Accuracy by Subject</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <ReBarChart data={subjectPerformanceData} layout="vertical" margin={{ left: 5, right: 20 }}>
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="subject" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
                        <Bar dataKey="accuracy" radius={[0, 2, 2, 0]} minPointSize={3}>
                          {subjectPerformanceData.map((entry: any) => (
                            <Cell key={entry.subject} fill={entry.weak ? "hsl(var(--destructive) / 0.7)" : "hsl(var(--primary))"} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Subject table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        {["Subject", "Attempted", "Correct", "Accuracy", "Avg Time", "Status"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-muted-foreground font-mono font-medium text-[10px] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subjectPerformanceData.map((s: any) => (
                        <tr
                          key={s.subject}
                          onClick={() => setActiveSubject(activeSubject === s.subject ? null : s.subject)}
                          className="border-b border-border/50 hover:bg-secondary/40 cursor-pointer transition-colors"
                        >
                          <td className="py-2 px-3 font-medium text-foreground">{s.subject}</td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">{s.attempted}</td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">{s.correct}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${s.accuracy >= 75 ? "text-primary" : s.accuracy >= 55 ? "text-foreground" : "text-destructive"}`}>{s.accuracy}%</span>
                              <div className="w-16"><AccuracyBar value={s.accuracy} /></div>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">{s.avgTime}m</td>
                          <td className="py-2 px-3">
                            {s.weak
                              ? <span className="text-[10px] font-mono text-destructive flex items-center gap-1"><AlertTriangle size={9} />Needs Work</span>
                              : <span className="text-[10px] font-mono text-primary flex items-center gap-1"><CheckCircle2 size={9} />Good</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {activeSubject && (
                  <div className="mt-2 p-3 bg-secondary/30 border border-border rounded-sm text-xs text-muted-foreground font-mono">
                    💡 <strong className="text-foreground">{activeSubject}</strong>: Focus on chapter-level weak areas below. Review theory before practice sets.
                  </div>
                )}
              </div>
            )}

            {/* Difficulty tab */}
            {perfTab === "difficulty" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono mb-3 uppercase tracking-wide">Accuracy % by Difficulty</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <ReBarChart data={difficultyPerformanceData} margin={{ top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="level" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
                      <Bar dataKey="accuracy" radius={[2, 2, 0, 0]}>
                        {difficultyPerformanceData.map((_e: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i]} />
                        ))}
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono mb-3 uppercase tracking-wide">Attempted vs Correct</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <ReBarChart data={difficultyPerformanceData} margin={{ top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="level" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                      <Bar dataKey="attempted" fill="hsl(var(--primary) / 0.4)" radius={[2, 2, 0, 0]} name="Attempted" />
                      <Bar dataKey="correct" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Correct" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {difficultyPerformanceData.map((d: any) => (
                    <div key={d.level} className="p-3 border border-border rounded-sm bg-secondary/20">
                      <div className="text-xs font-semibold text-foreground mb-1">{d.level}</div>
                      <div className="font-mono text-xl font-bold text-primary">{d.accuracy}%</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{d.correct}/{d.attempted} correct</div>
                      <AccuracyBar value={d.accuracy} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Type tab */}
            {perfTab === "type" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono mb-3 uppercase tracking-wide">Accuracy by Question Format</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <ReBarChart data={questionTypePerformanceData} margin={{ bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="type" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
                        <Bar dataKey="accuracy" radius={[2, 2, 0, 0]}>
                          {questionTypePerformanceData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono mb-3 uppercase tracking-wide">Avg Time per Format (min)</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <ReBarChart data={questionTypePerformanceData} margin={{ bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="type" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}m`, "Avg Time"]} />
                        <Bar dataKey="avgTime" fill="hsl(var(--muted-foreground) / 0.4)" radius={[2, 2, 0, 0]} name="Avg Time" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {["Format", "Attempted", "Accuracy", "Avg Time", "Recommended Action"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-mono font-medium text-[10px] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {questionTypePerformanceData.map((q: any) => (
                      <tr key={q.type} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground">{q.type}</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{q.attempted}</td>
                        <td className="py-2 px-3">
                          <span className={`font-mono font-bold ${q.accuracy >= 75 ? "text-primary" : q.accuracy >= 55 ? "text-foreground" : "text-destructive"}`}>{q.accuracy}%</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{q.avgTime}m</td>
                        <td className="py-2 px-3 text-[10px] text-muted-foreground">
                          {q.accuracy < 60 ? "⚠ Practice more — attempt all skipped sets" : q.avgTime > 3 ? "⏱ Work on speed for this type" : "✓ Maintain consistency"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm text-xs text-muted-foreground font-mono">
                  💡 <strong className="text-foreground">NAT questions</strong> take the most time (4.2 min avg) and have lowest accuracy (54%). Prioritize NAT practice sets for Optimization and ML.
                </div>
              </div>
            )}

            {/* Test Type tab */}
            {perfTab === "testtype" && (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <ReBarChart data={testTypePerformance} margin={{ bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Avg Accuracy"]} />
                    <Bar dataKey="avgAccuracy" radius={[2, 2, 0, 0]}>
                      {testTypePerformance.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {["Test Type", "Taken", "Avg Score", "Avg Acc.", "Best Rank", "Trend"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-mono font-medium text-[10px] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testTypePerformance.map(t => (
                      <tr key={t.type} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground">{t.type}</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{t.attempted}</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{t.avgScore}</td>
                        <td className="py-2 px-3">
                          <span className={`font-mono font-bold ${t.avgAccuracy >= 75 ? "text-primary" : "text-muted-foreground"}`}>{t.avgAccuracy}%</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">#{t.bestRank}</td>
                        <td className="py-2 px-3 text-primary text-[10px] font-mono flex items-center gap-0.5">
                          <TrendingUp size={10} /> +{Math.floor(Math.random() * 5 + 1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-sm text-xs text-muted-foreground font-mono">
                  ⚠ <strong className="text-foreground">Full Mock performance (65%)</strong> is significantly lower than Chapter Tests (85%). Simulate exam conditions and attempt 2 full mocks per week.
                </div>
              </div>
            )}
          </div>

          {/* ── Chapter-wise Weak Areas ── */}
          <div id="practice" className="bg-card border border-border rounded-sm p-5">
            <SectionHeader title="Chapter-wise Focus Areas" sub="Chapters that need immediate attention, sorted by priority" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["Chapter", "Subject", "Accuracy", "Priority", "Best Format to Practice", "Action"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-muted-foreground font-mono font-medium text-[10px] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...chapterWiseDataData].sort((a: any, b: any) => a.accuracy - b.accuracy).map((c: any) => (
                    <tr key={c.chapter} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground">{c.chapter}</td>
                      <td className="py-2 px-3 text-muted-foreground">{c.subject}</td>
                      <td className="py-2 px-3">
                        <span className={`font-mono font-bold ${c.accuracy >= 75 ? "text-primary" : c.accuracy >= 55 ? "text-foreground" : "text-destructive"}`}>{c.accuracy}%</span>
                      </td>
                      <td className="py-2 px-3"><PriorityBadge p={c.priority} /></td>
                      <td className="py-2 px-3 font-mono text-muted-foreground text-[10px]">{c.format}</td>
                      <td className="py-2 px-3">
                        <button className="text-[10px] text-primary font-mono hover:underline flex items-center gap-0.5">
                          Practice <ChevronRight size={9} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-[10px] font-mono text-muted-foreground">
              <div className="p-2.5 border border-destructive/25 bg-destructive/5 rounded-sm">
                <div className="text-destructive font-bold mb-1">🔴 High Priority ({chapterWiseDataData.filter((c: any) => c.priority === "High").length} chapters)</div>
                {chapterWiseDataData.filter((c: any) => c.priority === "High").map((c: any) => <div key={c.chapter}>· {c.chapter} ({c.subject})</div>)}
              </div>
              <div className="p-2.5 border border-primary/25 bg-primary/5 rounded-sm">
                <div className="text-primary font-bold mb-1">🔵 Medium Priority ({chapterWiseDataData.filter((c: any) => c.priority === "Medium").length} chapters)</div>
                {chapterWiseDataData.filter((c: any) => c.priority === "Medium").map((c: any) => <div key={c.chapter}>· {c.chapter} ({c.subject})</div>)}
              </div>
              <div className="p-2.5 border border-border bg-secondary/20 rounded-sm">
                <div className="font-bold mb-1 text-muted-foreground">✅ Low Priority ({chapterWiseDataData.filter((c: any) => c.priority === "Low").length} chapters)</div>
                {chapterWiseDataData.filter((c: any) => c.priority === "Low").map((c: any) => <div key={c.chapter}>· {c.chapter} ({c.subject})</div>)}
              </div>
            </div>
          </div>

          {/* ── Heatmap ── */}
          <div id="activity" className="bg-card border border-border rounded-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Submissions Heat Map" sub="Daily activity over last 6 months" />
              <select className="text-xs border border-border bg-background text-foreground px-2 py-1 rounded-sm font-mono">
                <option>Last 6 Months</option><option>Last 1 Year</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                <div className="flex flex-col gap-1 mr-1">
                  <div className="h-4" />
                  {dayLabels.map((l, i) => (
                    <div key={i} className="h-3 text-[9px] text-muted-foreground font-mono leading-none flex items-center" style={{ width: 22 }}>{l}</div>
                  ))}
                </div>
                {weeks.map((w, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    <div className="h-4 text-[9px] text-muted-foreground font-mono">{wi % 4 === 0 ? months[Math.floor(wi / 4)] ?? "" : ""}</div>
                    {w.map((d, di) => (
                      <div key={di} title={`${d.date}: ${d.count} submissions`} className="w-3 h-3 rounded-sm transition-colors" style={{
                        background: d.count === 0 ? "hsl(var(--secondary))" : d.count === 1 ? "hsl(var(--primary) / 0.25)" : d.count === 2 ? "hsl(var(--primary) / 0.45)" : d.count === 3 ? "hsl(var(--primary) / 0.65)" : "hsl(var(--primary))",
                      }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Weekly Activity ── */}
          <div className="bg-card border border-border rounded-sm p-5">
            <SectionHeader title="Weekly Activity" sub="Questions solved and time spent this week" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground font-mono mb-2 uppercase tracking-wide">Questions / Day</p>
                <ResponsiveContainer width="100%" height={140}>
                  <ReBarChart data={weeklyActivityData}>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="questions" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-mono mb-2 uppercase tracking-wide">Time Spent (min)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={weeklyActivityData}>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="time" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ r: 2.5, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Rating Graph ── */}
          <div className="bg-card border border-border rounded-sm p-5">
            <SectionHeader title="Rating Graph" sub="Contest performance history" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex border border-border rounded-sm overflow-hidden w-fit">
                {(["current", "old"] as const).map(tab => (
                  <button key={tab} onClick={() => setRatingTab(tab)} className={`text-xs px-4 py-1.5 font-mono transition-colors border-r last:border-r-0 border-border ${ratingTab === tab ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                    {tab === "current" ? "Current" : "Historical"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-mono">Contests: <strong className="text-foreground">{contests}</strong></span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={ratingDataData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Topic Mastery ── */}
          <div id="topic-mastery" className="bg-card border border-border rounded-sm p-5">
            <SectionHeader title="Topic Mastery" sub="Overall mastery level per subject (theory + practice combined)" />
            <div className="space-y-3">
              {subjectPerformanceData.map((s: any) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground flex items-center gap-1.5">
                      {s.weak && <AlertTriangle size={10} className="text-destructive" />}
                      {s.subject}
                    </span>
                    <span className={`font-mono ${s.accuracy >= 75 ? "text-primary" : s.accuracy >= 55 ? "text-foreground" : "text-destructive"}`}>{s.accuracy}%</span>
                  </div>
                  <AccuracyBar value={s.accuracy} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div id="quick-panel" className="space-y-5">

          {/* Rating card */}
          <div className="bg-card border border-border rounded-sm p-5 text-center">
            <div className="font-mono text-4xl font-bold text-foreground">{rating}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{rating >= 2000 ? "(Div 1)" : rating >= 1500 ? "(Div 2)" : "(Unrated)"}</div>
            <div className="flex justify-center gap-0.5 mt-2 mb-1.5">
              {[...Array(ratingStarsCount)].map((_, i) => (
                <div key={i} className="w-5 h-5 bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-[10px]">★</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-primary font-semibold">GATE DA Rating</div>
            <div className="text-[10px] text-muted-foreground">(Highest: {rating})</div>
            <div className="border-t border-border mt-3 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-center sm:border-r sm:border-border">
                <div className="font-serif text-base font-bold text-foreground">{globalRank}</div>
                <div className="text-[10px] text-muted-foreground">Global Rank</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-base font-bold text-foreground">{countryRank}</div>
                <div className="text-[10px] text-muted-foreground">Country Rank</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-sm p-4">
            <h3 className="font-serif font-bold text-xs text-foreground mb-2.5 pb-2 border-b border-border uppercase tracking-wide">Statistics</h3>
            <div className="space-y-2 text-xs">
              {[
                ["Problems Solved", String(problemsSolved)],
                ["Contest Participated", String(contests)],
                ["Current Streak", `${streak} days`],
                ["Total Attempted", String(totalAttempted)],
                ["Total Correct", String(totalCorrect)],
                ["Accuracy (Overall)", `${overallAccuracy}%`],
                ["GATE DA Rating", String(rating)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-mono font-bold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-card border border-border rounded-sm p-4">
            <h3 className="font-serif font-bold text-xs text-foreground mb-2.5 pb-2 border-b border-border uppercase tracking-wide flex items-center gap-1.5">
              <Zap size={11} className="text-primary" /> Study Recommendations
            </h3>
            <div className="space-y-2.5 text-[10px] font-mono text-muted-foreground">
              {chapterWiseDataData.filter((c: any) => c.priority === "High").slice(0, 1).map((c: any) => (
                <div key={c.chapter} className="p-2 bg-destructive/6 border border-destructive/20 rounded-sm">
                  <div className="text-destructive font-bold mb-0.5">🎯 Immediate Focus</div>
                  {c.chapter} ({c.subject}) — only {c.accuracy}% accuracy. Prioritise {c.format} practice.
                </div>
              ))}
              {weakSubjects.slice(0, 1).map((s: any) => (
                <div key={s.subject} className="p-2 bg-primary/6 border border-primary/20 rounded-sm">
                  <div className="text-primary font-bold mb-0.5">📋 This Week</div>
                  Improve {s.subject} — currently at {s.accuracy}% accuracy. Attempt more {s.subject} practice sets.
                </div>
              ))}
              <div className="p-2 bg-secondary border border-border rounded-sm">
                <div className="font-bold text-foreground mb-0.5">📈 Progress</div>
                {problemsSolved} problems solved · {streak}-day streak · {overallAccuracy}% accuracy overall.
              </div>
            </div>
          </div>

          {/* Study Plan Tracker */}
          <div className="bg-card border border-border rounded-sm p-4">
            <h3 className="font-serif font-bold text-xs text-foreground mb-2.5 pb-2 border-b border-border uppercase tracking-wide flex items-center gap-1.5">
              <Target size={11} className="text-primary" /> Study Plan (Mar Week 1)
            </h3>
            <div className="space-y-1.5 text-[10px] font-mono">
              {[
                { task: "Statistics Mock", done: true },
                { task: "Eigenvalue NAT Practice", done: true },
                { task: "ML Theory: SVM", done: false },
                { task: "Full Mock #7", done: false },
                { task: "PYQ Set: Probability", done: false },
              ].map(t => (
                <div key={t.task} className={`flex items-center gap-2 ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  <span className={t.done ? "text-primary" : "text-muted-foreground"}>
                    {t.done ? "✓" : "○"}
                  </span>
                  {t.task}
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Weekly Progress</span>
                  <span className="text-foreground font-bold">2/5</span>
                </div>
                <AccuracyBar value={40} />
              </div>
            </div>
          </div>

          {/* Upcoming Contests */}
          <div className="bg-card border border-border rounded-sm p-4">
            <h3 className="font-serif font-bold text-xs text-foreground mb-2.5 pb-2 border-b border-border uppercase tracking-wide">Upcoming Contests</h3>
            <div className="space-y-2">
              {[
                { name: "Statistics Sprint #8", date: "Mar 5", registered: true },
                { name: "Linear Algebra Weekly", date: "Mar 9", registered: false },
                { name: "Full Mock #13", date: "Mar 15", registered: false },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                  <div>
                    <div className="text-foreground text-[11px]">{c.name}</div>
                    <div className="text-muted-foreground font-mono text-[10px] mt-0.5">{c.date}</div>
                  </div>
                  {c.registered
                    ? <span className="text-primary text-xs font-bold">✓</span>
                    : <button className="text-[10px] px-2 py-0.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors rounded-sm font-mono">+</button>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-card border border-border rounded-sm p-4">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border">
              <h3 className="font-serif font-bold text-xs text-foreground uppercase tracking-wide">Badges</h3>
              <Share2 size={11} className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
            </div>
            <div className="space-y-3">
              {badges.map(b => (
                <div key={b.name} className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                    <span className="text-xs">🏅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground">{b.name} — {b.tier}</span>
                      <Download size={10} className="text-muted-foreground cursor-pointer shrink-0 ml-1" />
                    </div>
                    <div className="text-[10px] text-primary font-mono mt-0.5">{b.progress}/{b.total}</div>
                    <AccuracyBar value={(b.progress / b.total) * 100} />
                    <div className="text-[10px] text-muted-foreground mt-1">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
