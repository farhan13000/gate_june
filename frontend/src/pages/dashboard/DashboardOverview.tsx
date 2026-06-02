import { useEffect, useState } from "react";
import { 
  BarChart2, 
  BookOpen, 
  History, 
  Clock, 
  Target, 
  Lightbulb, 
  Award, 
  Trophy, 
  Activity 
} from "lucide-react";
import MetricCard from "../../components/dashboard/MetricCard";
import PreviewCard from "../../components/dashboard/PreviewCard";
import { AccuracyBar } from "./PerformanceAnalytics"; // We will create this helper later, or I can inline it.

// Let's create an inline AccuracyBar helper for now
const SimpleAccuracyBar = ({ value }: { value: number }) => {
  const color = value >= 75 ? "bg-primary" : value >= 55 ? "bg-yellow-500" : "bg-destructive";
  return (
    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
      <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
};

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/overview`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading overview...</div>;
  }

  const stats = data || {
    overallAccuracy: 0,
    totalAttempted: 0,
    avgTimePerQuestion: 0,
    strongestSubject: null,
    weakestSubject: null,
    currentStreakDays: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's a summary of your learning progress.</p>
      </div>

      {/* High-level metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Overall Accuracy" 
          value={`${stats.overallAccuracy}%`} 
          subtitle="Across all questions"
        />
        <MetricCard 
          title="Total Attempts" 
          value={stats.totalAttempted} 
          subtitle="Questions solved"
        />
        <MetricCard 
          title="Avg. Time / Question" 
          value={stats.avgTimePerQuestion ? `${stats.avgTimePerQuestion}s` : "N/A"} 
        />
        <MetricCard 
          title="Current Streak" 
          value={`${stats.currentStreakDays} days`} 
          subtitle="Keep it up!"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.strongestSubject && (
           <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
             <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Strongest Subject</div>
             <div className="text-lg font-bold text-primary">{stats.strongestSubject.subject}</div>
             <div className="text-sm mt-1">{stats.strongestSubject.accuracy}% Accuracy</div>
           </div>
        )}
        {stats.weakestSubject && (
           <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
             <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weakest Subject</div>
             <div className="text-lg font-bold text-destructive">{stats.weakestSubject.subject}</div>
             <div className="text-sm mt-1">{stats.weakestSubject.accuracy}% Accuracy</div>
           </div>
        )}
      </div>

      <div className="h-px bg-border w-full my-6" />

      {/* Section Previews */}
      <h2 className="text-lg font-serif font-bold text-foreground mb-4">Detailed Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        
        <PreviewCard 
          title="Performance Analytics" 
          description="Accuracy by subject, difficulty, and question type."
          href="/dashboard/performance"
          icon={<BarChart2 />}
        >
           <div className="text-xs text-muted-foreground mt-2">Deep dive into your core metrics with radar and bar charts.</div>
        </PreviewCard>

        <PreviewCard 
          title="Subject Progress" 
          description="Chapter-wise completion and mastery."
          href="/dashboard/subjects"
          icon={<BookOpen />}
        >
           <div className="text-xs text-muted-foreground mt-2">Track syllabus coverage and topic mastery.</div>
        </PreviewCard>

        <PreviewCard 
          title="Test History" 
          description="Past mocks, practice sets, and PYQs."
          href="/dashboard/test-history"
          icon={<History />}
        />

        <PreviewCard 
          title="Time Analysis" 
          description="Speed and efficiency breakdown."
          href="/dashboard/time-analysis"
          icon={<Clock />}
        />

        <PreviewCard 
          title="Weak Areas" 
          description="Identify and fix repeated mistake patterns."
          href="/dashboard/weak-areas"
          icon={<Target />}
        />

        <PreviewCard 
          title="Recommendations" 
          description="Smart practice plans and revision queue."
          href="/dashboard/recommendations"
          icon={<Lightbulb />}
        />

        <PreviewCard 
          title="Contest Performance" 
          description="Rank history, penalty analysis, and leaderboards."
          href="/dashboard/contest-performance"
          icon={<Award />}
        />

        <PreviewCard 
          title="Leaderboard" 
          description="Global, weekly, and peer rankings."
          href="/dashboard/leaderboard"
          icon={<Trophy />}
        />

        <PreviewCard 
          title="Activity Timeline" 
          description="Daily activity map and recent actions."
          href="/dashboard/activity"
          icon={<Activity />}
        />

      </div>
    </div>
  );
}
