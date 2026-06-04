import { lazy, Suspense, useMemo } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Clock,
  Flame,
  Gauge,
  LineChart,
  Medal,
  Sigma,
  Target,
  Trophy,
} from "lucide-react";
import {
  AnalyticsCard,
  ChartContainer,
  EmptyState,
  HeatmapGrid,
  ProgressBar,
  SectionCard,
  SkeletonLoader,
  StatCard,
  TimelineContainer,
} from "@/dashboard/components";
import { dashboardApi } from "@/dashboard/services";
import { useDashboardQuery } from "@/dashboard/hooks";

const WeeklyActivityGraph = lazy(() => import("@/dashboard/charts/OverviewCharts").then((module) => ({ default: module.WeeklyActivityGraph })));
const SubjectCompletionChart = lazy(() => import("@/dashboard/charts/OverviewCharts").then((module) => ({ default: module.SubjectCompletionChart })));
const AccuracySpeedChart = lazy(() => import("@/dashboard/charts/OverviewCharts").then((module) => ({ default: module.AccuracySpeedChart })));
const ContestSnapshotChart = lazy(() => import("@/dashboard/charts/OverviewCharts").then((module) => ({ default: module.ContestSnapshotChart })));
const RecentPerformanceTrends = lazy(() => import("@/dashboard/charts/OverviewCharts").then((module) => ({ default: module.RecentPerformanceTrends })));

interface OverviewStats {
  overallAccuracy?: number;
  totalAttempted?: number;
  avgTimePerQuestion?: number;
  currentStreakDays?: number;
  problemsSolved?: number;
  rating?: number;
}

function ChartFallback() {
  return <div className="h-64"><SkeletonLoader rows={4} /></div>;
}

function activityLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardOverview() {
  const { data, loading, error } = useDashboardQuery(async () => {
    const [overview, readiness, streak, weekly, study, contests, recent] = await Promise.all([
      dashboardApi.overview(),
      dashboardApi.readinessScore(),
      dashboardApi.streakTracking(),
      dashboardApi.weeklyPerformance(),
      dashboardApi.studyAnalytics(),
      dashboardApi.contestSummary(),
      dashboardApi.recentActivity(),
    ]);

    return { overview, readiness, streak, weekly, study, contests, recent };
  }, []);

  const stats = (data?.overview.stats ?? {}) as OverviewStats;
  const weekly = data?.weekly.weekly ?? [];
  const subjects = data?.study.subjects ?? [];
  const activity = data?.recent.activity ?? [];
  const contestRecent = data?.contests.recent ?? [];

  const derived = useMemo(() => {
    const avgCompletion = subjects.length
      ? Math.round(subjects.reduce((sum, item) => sum + item.completion, 0) / subjects.length)
      : 0;
    const first = weekly[0]?.accuracy ?? 0;
    const last = weekly[weekly.length - 1]?.accuracy ?? 0;
    const weeklyGrowth = last - first;
    const heatmap = Array.from({ length: 98 }).map((_, index) => {
      const item = weekly[index % Math.max(weekly.length, 1)];
      return {
        date: `D-${98 - index}`,
        count: item ? Math.min(6, item.attempts) : 0,
      };
    });

    return { avgCompletion, weeklyGrowth, heatmap };
  }, [subjects, weekly]);

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonLoader rows={6} />
      </div>
    );
  }

  if (error || !data) {
    return <EmptyState title="Dashboard unavailable" description="The overview intelligence layer could not be loaded. Please retry after a moment." />;
  }

  const readiness = data.readiness;
  const contestSummary = data.contests;
  const consistencyScore = data.streak.consistencyScore;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden border border-[var(--dash-border)] bg-white p-5 shadow-sm">
        <div className="absolute inset-0 dashboard-grid-bg opacity-80" aria-hidden="true" />
        <div className="pointer-events-none absolute right-6 top-5 hidden font-mono text-[11px] leading-6 text-[#0D6EFD]/20 lg:block" aria-hidden="true">
          {"∇J(θ) -> 0\nP(success | discipline)\nΣ accuracy_i / n"}
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D6EFD]">Academic intelligence overview</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#10213F] sm:text-3xl">Good to see you back. Your preparation signal is being measured.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B5563]">{readiness.motivationalInsight}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <AnalyticsCard title="Daily Summary" value={readiness.dailySummary.problemsSolved} meta="Solved problems" />
              <AnalyticsCard title="Accuracy Signal" value={`${readiness.dailySummary.accuracy}%`} meta="Current aggregate" />
              <AnalyticsCard title="Study Time" value={`${readiness.dailySummary.studyHours}h`} meta="Logged practice time" />
            </div>
          </div>

          <div className="border border-[#bfdbfe] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0D6EFD]">Readiness Score</p>
                <div className="mt-2 font-mono text-5xl font-semibold text-[#10213F]">{readiness.readinessScore}</div>
              </div>
              <Gauge size={36} className="text-[#0D6EFD]" />
            </div>
            <ProgressBar value={readiness.readinessScore} tone="accent" />
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="border border-[#E5E7EB] bg-white px-3 py-2">
                <div className="font-mono text-lg font-semibold text-[#10213F]">{readiness.percentileProjection}</div>
                <div className="text-[#4B5563]">Percentile projection</div>
              </div>
              <div className="border border-[#E5E7EB] bg-white px-3 py-2">
                <div className="font-mono text-lg font-semibold text-[#10213F]">{data.streak.currentStreak}</div>
                <div className="text-[#4B5563]">Current streak</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Problems Solved" value={stats.problemsSolved ?? readiness.dailySummary.problemsSolved} trend="Unique correct problems" icon={Sigma} />
        <StatCard label="Accuracy" value={stats.overallAccuracy ?? readiness.dailySummary.accuracy} suffix="%" trend="All attempts" icon={Target} />
        <StatCard label="Study Hours" value={readiness.dailySummary.studyHours} trend="Estimated from timed attempts" icon={Clock} />
        <StatCard label="Mock Tests" value={contestSummary.mockTests} trend="Contest attempts" icon={Trophy} />
        <StatCard label="Current Rank" value={contestSummary.currentRank ?? "-"} trend={contestSummary.bestRank ? `Best rank ${contestSummary.bestRank}` : "Awaiting contest data"} icon={Medal} />
        <StatCard label="Weekly Growth" value={derived.weeklyGrowth} suffix="%" tone={derived.weeklyGrowth >= 0 ? "success" : "danger"} trend="Accuracy delta this week" icon={LineChart} />
        <StatCard label="Subject Completion" value={derived.avgCompletion} suffix="%" trend="Theory progress mean" icon={BookOpen} />
        <StatCard label="Consistency Score" value={consistencyScore} suffix="/100" trend={`${data.streak.currentStreak} day streak`} icon={Flame} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartContainer title="Weekly Activity Graph" eyebrow="Attempts + accuracy" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <WeeklyActivityGraph data={weekly} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Subject Completion Overview" eyebrow="Syllabus progress" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <SubjectCompletionChart data={subjects} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Accuracy vs Speed Chart" eyebrow="Pace-quality plane" minWidth={520}>
          <Suspense fallback={<ChartFallback />}>
            <AccuracySpeedChart data={weekly} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Contest Snapshot" eyebrow="Mock performance" minWidth={520}>
          <Suspense fallback={<ChartFallback />}>
            <ContestSnapshotChart data={contestRecent.length ? contestRecent : [{ label: "No contest", score: 0, solved: 0, rank: "-" }]} />
          </Suspense>
        </ChartContainer>

        <SectionCard title="Study Heatmap" eyebrow="Discipline grid">
          <HeatmapGrid data={derived.heatmap} />
        </SectionCard>

        <ChartContainer title="Recent Performance Trends" eyebrow="Accuracy trajectory" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <RecentPerformanceTrends data={weekly} />
          </Suspense>
        </ChartContainer>
      </div>

      <SectionCard title="Recent Activity" eyebrow="Academic timeline">
        {activity.length ? (
          <TimelineContainer>
            {activity.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="relative">
                <span className="absolute -left-[1.35rem] top-1 h-2 w-2 rounded-full bg-[#0D6EFD]" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-[#10213F]">{activityLabel(item.type)}</p>
                  <span className="font-mono text-[11px] text-[#94A3B8]">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-[#4B5563]">{item.title}</p>
                <p className="mt-1 text-xs text-[#0D6EFD]">{item.meta}</p>
              </div>
            ))}
          </TimelineContainer>
        ) : (
          <EmptyState title="No recent activity yet" description="Solve problems, read theory, or attempt a contest to populate the academic timeline." icon={Activity} />
        )}
      </SectionCard>
    </div>
  );
}
