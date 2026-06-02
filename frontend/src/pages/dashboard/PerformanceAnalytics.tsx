import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, Cell, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import ChartCard from "../../components/dashboard/ChartCard";

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
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "JetBrains Mono",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))" },
};

export const AccuracyBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const pct = (value / max) * 100;
  const color = value >= 75 ? "hsl(var(--primary))" : value >= 55 ? "hsl(var(--primary) / 0.55)" : "hsl(var(--destructive))";
  return (
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

export default function PerformanceAnalytics() {
  const [tab, setTab] = useState<"subject" | "difficulty" | "questionType">("subject");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/performance?viewType=${tab}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Performance Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Accuracy, attempts, and time analysis across all dimensions.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border border-border rounded-sm overflow-hidden w-full text-sm font-medium">
        {([
          ["subject", "By Subject"],
          ["difficulty", "By Difficulty"],
          ["questionType", "By Question Type"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 transition-colors border-r last:border-r-0 border-border ${
              tab === key 
                ? "bg-primary text-primary-foreground" 
                : "bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading analytics...</div>
      ) : (
        <div className="space-y-6">
          {tab === "subject" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Accuracy by Subject" subtitle="Percentage of correct answers">
                <ResponsiveContainer width="100%" height={300}>
                  <ReBarChart data={data} layout="vertical" margin={{ left: 5, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
                    <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={16}>
                      {data.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.weak ? "hsl(var(--destructive) / 0.8)" : "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Subject Radar" subtitle="Overview across all subjects">
                <ResponsiveContainer width="100%" height={300}>
                   {data && data.length > 0 ? (
                    <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Radar dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip {...tooltipStyle} />
                    </RadarChart>
                   ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                   )}
                </ResponsiveContainer>
              </ChartCard>

              <div className="lg:col-span-2 overflow-x-auto bg-card border border-border rounded-lg shadow-sm">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Attempted</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Correct</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Accuracy</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((s: any) => (
                      <tr key={s.subject} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{s.subject}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{s.attempted}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{s.correct}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-medium w-10">{s.accuracy}%</span>
                            <div className="flex-1 max-w-[100px]"><AccuracyBar value={s.accuracy} /></div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{s.avgTime}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "difficulty" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Accuracy by Difficulty">
                <ResponsiveContainer width="100%" height={300}>
                  <ReBarChart data={data} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="level" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} barSize={40}>
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Attempted vs Correct">
                <ResponsiveContainer width="100%" height={300}>
                  <ReBarChart data={data} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="level" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Bar dataKey="attempted" fill="hsl(var(--primary) / 0.3)" name="Attempted" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="correct" fill="hsl(var(--primary))" name="Correct" radius={[2, 2, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {tab === "questionType" && (
            <div className="grid grid-cols-1 gap-6">
               <ChartCard title="Accuracy & Time by Format">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={data} margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="type" axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Accuracy"]} />
                        <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} barSize={40} fill="hsl(var(--primary))" />
                      </ReBarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={data} margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="type" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}m`, "Avg Time"]} />
                        <Bar dataKey="avgTime" radius={[4, 4, 0, 0]} barSize={40} fill="hsl(var(--muted-foreground) / 0.5)" name="Avg Time (min)" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
               </ChartCard>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
