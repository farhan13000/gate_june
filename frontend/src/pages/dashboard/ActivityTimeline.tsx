import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

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

export default function ActivityTimeline() {
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock weekly activity for now, ideally this comes from backend too
  const weeklyActivityData = [
    { day: "Mon", questions: 18, time: 45 },
    { day: "Tue", questions: 25, time: 62 },
    { day: "Wed", questions: 8, time: 20 },
    { day: "Thu", questions: 32, time: 78 },
    { day: "Fri", questions: 14, time: 35 },
    { day: "Sat", questions: 45, time: 110 },
    { day: "Sun", questions: 28, time: 70 },
  ];

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/activity`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setHeatmapData(json.activity || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const toLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const getWeekMonthLabel = (
    currentWeek: { date: string; count: number }[],
    previousWeek?: { date: string; count: number }[]
  ) => {
    const previousLast = previousWeek?.[previousWeek.length - 1];
    let previousDate = previousLast ? toLocalDate(previousLast.date) : null;
    for (const day of currentWeek) {
      const currentDate = toLocalDate(day.date);
      const monthChanged =
        !previousDate ||
        currentDate.getMonth() !== previousDate.getMonth() ||
        currentDate.getFullYear() !== previousDate.getFullYear();
      if (monthChanged) return monthFormatter.format(currentDate);
      previousDate = currentDate;
    }
    return "";
  };

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
  const weeks: { date: string; count: number }[][] = [];
  let week: { date: string; count: number }[] = [];
  heatmapData.forEach((d, i) => {
    week.push(d);
    if (week.length === 7 || i === heatmapData.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Activity className="text-primary" /> Activity Timeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Daily activity map and recent actions over the last 6 months.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-sm overflow-x-auto">
        <h3 className="text-[10px] text-muted-foreground font-mono mb-4 uppercase tracking-wide">6-Month Heatmap</h3>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading activity...</div>
        ) : (
          <div className="flex gap-1 min-w-max">
            <div className="flex flex-col gap-1 mr-1">
              <div className="h-4" />
              {dayLabels.map((l, i) => (
                <div key={i} className="h-3 text-[10px] text-muted-foreground font-mono leading-none flex items-center" style={{ width: 22 }}>{l}</div>
              ))}
            </div>
            {weeks.map((w, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                <div className="h-4 text-[10px] text-muted-foreground font-mono">
                  {getWeekMonthLabel(w, weeks[wi - 1])}
                </div>
                {w.map((d, di) => (
                  <div key={di} title={`${d.date}: ${d.count} submissions`} className="w-3 h-3 rounded-sm transition-colors" style={{
                    background: d.count === 0 ? "hsl(var(--secondary))" : d.count === 1 ? "hsl(var(--primary) / 0.25)" : d.count === 2 ? "hsl(var(--primary) / 0.45)" : d.count === 3 ? "hsl(var(--primary) / 0.65)" : "hsl(var(--primary))",
                  }} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Weekly Activity Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-mono mb-4 uppercase tracking-wide">Questions / Day</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="questions" radius={[2, 2, 0, 0]}>
                {weeklyActivityData.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-mono mb-4 uppercase tracking-wide">Time Spent / Day (min)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="time" fill="hsl(var(--muted-foreground) / 0.5)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-secondary/20 border border-border rounded-lg p-6">
        <h3 className="font-serif font-semibold text-foreground mb-4">Recent Actions</h3>
        <p className="text-sm text-muted-foreground italic">Detailed activity log based on UserActivityLog will appear here soon.</p>
      </div>
    </div>
  );
}
