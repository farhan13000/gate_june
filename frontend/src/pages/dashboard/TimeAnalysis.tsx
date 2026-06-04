import { lazy, Suspense, useMemo } from "react";
import { AlertTriangle, Clock3, Gauge, RotateCcw, Timer, Zap } from "lucide-react";
import {
  AnalyticsCard,
  ChartContainer,
  EmptyState,
  HeatmapGrid,
  ProgressBar,
  SectionCard,
  SkeletonLoader,
  StatCard,
} from "@/dashboard/components";
import { dashboardApi } from "@/dashboard/services";
import { useDashboardQuery } from "@/dashboard/hooks";

const SubjectTimeBars = lazy(() => import("@/dashboard/charts/TimeAnalysisCharts").then((module) => ({ default: module.SubjectTimeBars })));
const PacingGraph = lazy(() => import("@/dashboard/charts/TimeAnalysisCharts").then((module) => ({ default: module.PacingGraph })));
const EfficiencyRadar = lazy(() => import("@/dashboard/charts/TimeAnalysisCharts").then((module) => ({ default: module.EfficiencyRadar })));
const TimeAccuracyMap = lazy(() => import("@/dashboard/charts/TimeAnalysisCharts").then((module) => ({ default: module.TimeAccuracyMap })));
const SessionTimeline = lazy(() => import("@/dashboard/charts/TimeAnalysisCharts").then((module) => ({ default: module.SessionTimeline })));
const TimeDistributionCurve = lazy(() => import("@/dashboard/charts/TimeAnalysisCharts").then((module) => ({ default: module.TimeDistributionCurve })));

function ChartFallback() {
  return <div className="h-64"><SkeletonLoader rows={4} /></div>;
}

function formatSeconds(seconds: number) {
  const min = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return min ? `${min}m ${rest}s` : `${rest}s`;
}

export default function TimeAnalysis() {
  const { data, loading, error } = useDashboardQuery(async () => {
    const [analysis, pacing, sessions, distribution] = await Promise.all([
      dashboardApi.timeAnalysis(),
      dashboardApi.pacing(),
      dashboardApi.sessionAnalysis(),
      dashboardApi.timeDistribution(),
    ]);
    return { analysis, pacing, sessions, distribution };
  }, []);

  const heatmap = useMemo(() => {
    const rows = data?.analysis.timeAccuracyMap ?? [];
    return rows.slice(0, 84).map((item, index) => ({
      date: `${item.topic.slice(0, 4)}-${index}`,
      count: Math.max(0, Math.round(item.hesitation / 18)),
    }));
  }, [data]);

  if (loading) return <SkeletonLoader rows={7} />;
  if (error || !data) return <EmptyState title="Time analysis unavailable" description="The pacing intelligence service could not be loaded." />;

  const { analysis, pacing, sessions, distribution } = data;
  const slowest = analysis.slowestTopics[0];
  const fastest = analysis.fastestAreas[0];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden border border-[var(--dash-border)] bg-white p-5 shadow-sm">
        <div className="absolute inset-0 dashboard-grid-bg opacity-80" aria-hidden="true" />
        <div className="pointer-events-none absolute right-6 top-5 hidden font-mono text-[11px] leading-6 text-[#0D6EFD]/20 lg:block" aria-hidden="true">
          {"t_attempt = t_read + t_solve + t_verify\nspeed × accuracy → efficiency\nΔ pace after 90m"}
        </div>
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D6EFD]">Time intelligence</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#10213F] sm:text-3xl">Solving Speed and Pacing Analysis</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B5563]">
              Identify wasted time, hesitation patterns, slow subjects, contest pacing decay, and high-efficiency solving zones.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[24rem]">
            <AnalyticsCard title="Slowest Area" value={slowest ? formatSeconds(slowest.averageTime) : "N/A"} meta={slowest?.topic ?? "Awaiting attempts"} />
            <AnalyticsCard title="Fastest Area" value={fastest ? formatSeconds(fastest.averageTime) : "N/A"} meta={fastest?.topic ?? "Awaiting attempts"} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Avg Time / Question" value={analysis.summary.averageTimePerQuestion} suffix="s" icon={Timer} />
        <StatCard label="Hesitation Rate" value={analysis.summary.hesitationRate} suffix="%" tone="warning" icon={Gauge} />
        <StatCard label="Retry Rate" value={analysis.summary.retryRate} suffix="%" tone="danger" icon={RotateCcw} />
        <StatCard label="Wasted Time" value={analysis.summary.wastedTimeMinutes} suffix="m" tone="warning" icon={Clock3} />
      </div>

      <SectionCard title="Smart Timing Observations" eyebrow="Automated insights">
        <div className="grid gap-3 lg:grid-cols-2">
          {analysis.insights.map((insight, index) => (
            <div key={index} className="flex gap-3 border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-sm leading-6 text-[#4B5563]">
              <AlertTriangle size={16} className="mt-1 shrink-0 text-[#F59E0B]" />
              {insight}
            </div>
          ))}
          <div className="flex gap-3 border border-[#bfdbfe] bg-[#EAF4FF] p-3 text-sm leading-6 text-[#10213F]">
            <Zap size={16} className="mt-1 shrink-0 text-[#0D6EFD]" />
            {pacing.recommendation}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartContainer title="Subject-wise Time Distribution" eyebrow="Average seconds" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <SubjectTimeBars data={analysis.subjectDistribution} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Contest Pacing Analysis" eyebrow="Attempt windows" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <PacingGraph data={pacing.pacing} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Efficiency Radar" eyebrow="Accuracy / hesitation / allocation" minWidth={520}>
          <Suspense fallback={<ChartFallback />}>
            <EfficiencyRadar data={analysis.subjectDistribution} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Time vs Accuracy Mapping" eyebrow="Hesitation plane" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <TimeAccuracyMap data={analysis.timeAccuracyMap} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Session Efficiency Analysis" eyebrow="Study sessions" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <SessionTimeline data={sessions.sessions} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Time Distribution Curve" eyebrow="Speed buckets" minWidth={520}>
          <Suspense fallback={<ChartFallback />}>
            <TimeDistributionCurve data={distribution.distribution} />
          </Suspense>
        </ChartContainer>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard title="Hesitation Heatmap" eyebrow="Topic-level delay">
          <HeatmapGrid data={heatmap} />
        </SectionCard>

        <SectionCard title="Chapter-wise Time Consumption" eyebrow="Slow chapters">
          <div className="space-y-3">
            {analysis.chapterConsumption.map((chapter) => (
              <div key={`${chapter.subject}-${chapter.chapter}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-[#10213F]">{chapter.chapter}</span>
                  <span className="font-mono text-[#4B5563]">{formatSeconds(chapter.averageTime)}</span>
                </div>
                <ProgressBar value={Math.min(100, Math.round((chapter.averageTime / Math.max(analysis.summary.averageTimePerQuestion, 1)) * 55))} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Slowest Topics and Fastest Solving Areas" eyebrow="Pacing contrast">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#10213F]">Slowest Topics</h3>
            <div className="space-y-2">
              {analysis.slowestTopics.map((topic) => (
                <div key={topic.topic} className="border border-[#E5E7EB] bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#10213F]">{topic.topic}</span>
                    <span className="font-mono text-xs text-[#0D6EFD]">{formatSeconds(topic.averageTime)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#4B5563]">Accuracy {topic.accuracy}% · retries {topic.retries} · abandoned {topic.abandoned}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#10213F]">Fastest Solving Areas</h3>
            <div className="space-y-2">
              {analysis.fastestAreas.map((topic) => (
                <div key={topic.topic} className="border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#10213F]">{topic.topic}</span>
                    <span className="font-mono text-xs text-[#10B981]">{formatSeconds(topic.averageTime)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#4B5563]">Accuracy {topic.accuracy}% · {topic.subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
