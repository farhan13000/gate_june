import { lazy, Suspense } from "react";
import { AlertTriangle, BrainCircuit, Clock3, Crosshair, Gauge, ListChecks, ShieldAlert, TrendingDown } from "lucide-react";
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
import { useDashboardQuery } from "@/dashboard/hooks";
import { dashboardApi } from "@/dashboard/services";

const TopicRiskMatrix = lazy(() => import("@/dashboard/charts/WeakAreaCharts").then((module) => ({ default: module.TopicRiskMatrix })));
const ErrorFrequencyChart = lazy(() => import("@/dashboard/charts/WeakAreaCharts").then((module) => ({ default: module.ErrorFrequencyChart })));
const ErrorClusterScatter = lazy(() => import("@/dashboard/charts/WeakAreaCharts").then((module) => ({ default: module.ErrorClusterScatter })));
const ConceptStabilityGraph = lazy(() => import("@/dashboard/charts/WeakAreaCharts").then((module) => ({ default: module.ConceptStabilityGraph })));
const ConfidenceCurve = lazy(() => import("@/dashboard/charts/WeakAreaCharts").then((module) => ({ default: module.ConfidenceCurve })));
const RevisionDecayChart = lazy(() => import("@/dashboard/charts/WeakAreaCharts").then((module) => ({ default: module.RevisionDecayChart })));
const AccuracyCollapseChart = lazy(() => import("@/dashboard/charts/WeakAreaCharts").then((module) => ({ default: module.AccuracyCollapseChart })));

function ChartFallback() {
  return <div className="h-64"><SkeletonLoader rows={4} /></div>;
}

function severityClasses(severity: string) {
  if (severity === "Critical") return "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#92400E]";
  if (severity === "High") return "border-[#BFDBFE] bg-[#EAF4FF] text-[#10213F]";
  return "border-[#E5E7EB] bg-[#F8FAFC] text-[#4B5563]";
}

export default function WeakAreaAnalysis() {
  const { data, loading, error } = useDashboardQuery(async () => {
    const [weakAreas, conceptStability, revisionRisk, errorAnalysis] = await Promise.all([
      dashboardApi.weakAreas(),
      dashboardApi.conceptStability(),
      dashboardApi.revisionRisk(),
      dashboardApi.errorAnalysis(),
    ]);
    return { weakAreas, conceptStability, revisionRisk, errorAnalysis };
  }, []);

  if (loading) return <SkeletonLoader rows={8} />;
  if (error || !data) return <EmptyState title="Weak area engine unavailable" description="The weakness intelligence service could not be loaded." />;

  const { weakAreas, conceptStability, revisionRisk, errorAnalysis } = data;
  const topWeakness = weakAreas.weakTopics[0];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden border border-[var(--dash-border)] bg-white p-5 shadow-sm">
        <div className="absolute inset-0 dashboard-grid-bg opacity-90" aria-hidden="true" />
        <div className="pointer-events-none absolute right-6 top-5 hidden font-mono text-[11px] leading-6 text-[#0D6EFD]/20 xl:block" aria-hidden="true">
          {"risk = error_rate + decay + hesitation\nP(retention) = e^(-lambda t)\npriority = argmax(weakness)"}
        </div>
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D6EFD]">Weak area detection</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#10213F] sm:text-3xl">Conceptual Weakness Intelligence Engine</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B5563]">
              Detect unstable concepts, repeated error patterns, revision decay, and time-inefficient topics with a research-grade scoring model.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[25rem]">
            <AnalyticsCard title="Primary Recovery Target" value={topWeakness?.weaknessScore ?? 0} meta={topWeakness?.topic ?? "No tracked weakness"} />
            <AnalyticsCard title="Confidence Index" value={weakAreas.summary.confidenceIndex} meta="normalized across weak topics" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Weak Topics" value={weakAreas.summary.weakTopicCount} icon={ShieldAlert} />
        <StatCard label="Average Weakness" value={weakAreas.summary.averageWeakness} suffix="/100" icon={Gauge} />
        <StatCard label="Repeated Errors" value={weakAreas.summary.repeatedErrors} icon={AlertTriangle} tone="warning" />
        <StatCard label="Retention Index" value={weakAreas.summary.retentionIndex} suffix="%" icon={BrainCircuit} tone="success" />
      </div>

      <SectionCard title="Smart Weakness Observations" eyebrow="Automated intelligence">
        <div className="grid gap-3 lg:grid-cols-3">
          {weakAreas.insights.map((insight, index) => (
            <div key={insight} className="border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center border border-[#BFDBFE] bg-[#EAF4FF] text-[#0D6EFD]">
                {index === 0 ? <Crosshair size={16} /> : index === 1 ? <TrendingDown size={16} /> : <Clock3 size={16} />}
              </div>
              <p className="text-sm leading-6 text-[#10213F]">{insight}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartContainer title="Weak Topic Detection" eyebrow="Risk matrix" minWidth={720}>
          <Suspense fallback={<ChartFallback />}>
            <TopicRiskMatrix data={weakAreas.riskMatrix} />
          </Suspense>
        </ChartContainer>

        <SectionCard title="Confidence Heatmap" eyebrow="Weakness density">
          <HeatmapGrid data={weakAreas.heatmap} />
          <p className="mt-3 text-xs leading-5 text-[#64748B]">Darker cells indicate higher aggregate weakness and lower conceptual confidence.</p>
        </SectionCard>

        <ChartContainer title="Error Frequency Mapping" eyebrow="Repeated mistake types" minWidth={540}>
          <Suspense fallback={<ChartFallback />}>
            <ErrorFrequencyChart data={errorAnalysis.frequencyMap} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Error Clusters" eyebrow="Errors by time pressure" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <ErrorClusterScatter data={errorAnalysis.clusters} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Concept Instability Analysis" eyebrow="Stability / confidence / retention" minWidth={580}>
          <Suspense fallback={<ChartFallback />}>
            <ConceptStabilityGraph data={conceptStability.stability} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Concept Retention Tracking" eyebrow="Confidence curve" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <ConfidenceCurve data={conceptStability.confidenceCurve} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Revision Risk Areas" eyebrow="Forgetting curve proxy" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <RevisionDecayChart data={revisionRisk.decayChart} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Accuracy Collapse Zones" eyebrow="Accuracy vs instability" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <AccuracyCollapseChart data={weakAreas.accuracyCollapseZones} />
          </Suspense>
        </ChartContainer>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Recovery Priority Ranking" eyebrow="Weakness scoring algorithm">
          <div className="space-y-3">
            {weakAreas.priorityQueue.map((item) => (
              <div key={item.topic} className="border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#0D6EFD]">#{item.rank}</span>
                      <h3 className="text-sm font-semibold text-[#10213F]">{item.topic}</h3>
                      <span className={`border px-2 py-0.5 text-[11px] font-semibold ${severityClasses(item.severity)}`}>{item.severity}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#4B5563]">{item.action}</p>
                  </div>
                  <div className="min-w-[9rem]">
                    <ProgressBar label="Weakness score" value={item.score} tone={item.score > 70 ? "warning" : "default"} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Time-Inefficient Topics" eyebrow="Pacing inefficiency">
          <div className="space-y-4">
            {weakAreas.timeInefficientTopics.map((topic) => (
              <div key={topic.topic} className="border-b border-[#E5E7EB] pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#10213F]">{topic.topic}</h3>
                    <p className="text-xs text-[#64748B]">{topic.subject}</p>
                  </div>
                  <span className="font-mono text-sm text-[#10213F]">{topic.averageTime}s</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ProgressBar label="Accuracy" value={topic.accuracy} />
                  <ProgressBar label="Confidence" value={topic.confidence} tone="success" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Repeated Error Detection" eyebrow="Concept instability queue">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {errorAnalysis.repeatedErrors.length ? errorAnalysis.repeatedErrors.map((item) => (
            <div key={item.topic} className="border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#10213F]">{item.topic}</h3>
                  <p className="mt-1 text-xs text-[#64748B]">{item.subject}</p>
                </div>
                <ListChecks size={16} className="text-[#0D6EFD]" />
              </div>
              <div className="mt-4 space-y-3">
                <ProgressBar label="Repeated errors" value={Math.min(100, item.repeatedErrors * 18)} tone="warning" />
                <ProgressBar label="Weakness score" value={item.weaknessScore} />
                <ProgressBar label="Confidence" value={item.confidence} tone="success" />
              </div>
            </div>
          )) : (
            <EmptyState title="No repeated errors detected" description="The engine has not found enough repeated mistakes to cluster." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
