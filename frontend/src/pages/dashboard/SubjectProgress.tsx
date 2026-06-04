import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, CalendarClock, CheckCircle2, Layers3, Radar, RotateCcw, Sigma } from "lucide-react";
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

const SubjectRadar = lazy(() => import("@/dashboard/charts/SubjectIntelligenceCharts").then((module) => ({ default: module.SubjectRadar })));
const CompletionMatrix = lazy(() => import("@/dashboard/charts/SubjectIntelligenceCharts").then((module) => ({ default: module.CompletionMatrix })));
const SubjectProgressTimeline = lazy(() => import("@/dashboard/charts/SubjectIntelligenceCharts").then((module) => ({ default: module.SubjectProgressTimeline })));

function ChartFallback() {
  return <div className="h-64"><SkeletonLoader rows={4} /></div>;
}

export default function SubjectProgress() {
  const { data, loading, error } = useDashboardQuery(() => dashboardApi.subjectIntelligence(), []);

  const heatmap = useMemo(() => {
    const subjects = data?.subjects ?? [];
    return subjects.flatMap((subject) =>
      (subject.topics.length ? subject.topics : [{ mastery: subject.mastery, topic: subject.subject }]).slice(0, 12).map((topic, index) => ({
        date: `${subject.subject.slice(0, 3)}-${index + 1}`,
        count: Math.round((topic.mastery || 0) / 18),
      }))
    );
  }, [data]);

  const timeline = useMemo(() => {
    return (data?.subjects ?? []).map((subject) => ({
      label: subject.subject.split(" ")[0],
      mastery: subject.mastery,
      completion: subject.syllabusCompletion,
    }));
  }, [data]);

  if (loading) return <SkeletonLoader rows={7} />;
  if (error || !data) return <EmptyState title="Subject intelligence unavailable" description="The subject analytics service could not be loaded." />;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden border border-[var(--dash-border)] bg-white p-5 shadow-sm">
        <div className="absolute inset-0 dashboard-grid-bg opacity-80" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D6EFD]">Subject intelligence</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#10213F] sm:text-3xl">Syllabus Mastery Laboratory</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B5563]">
              Track mastery, completion, revision freshness, confidence, and learning consistency across the complete GATE DA subject map.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[22rem]">
            <AnalyticsCard title="Average Mastery" value={`${data.summary.averageMastery}%`} meta="Across all subjects" />
            <AnalyticsCard title="Revision Due" value={data.summary.revisionDue} meta="Needs attention" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average Mastery" value={data.summary.averageMastery} suffix="%" icon={Sigma} />
        <StatCard label="Completed Subjects" value={data.summary.completedSubjects} icon={CheckCircle2} />
        <StatCard label="High Confidence" value={data.summary.highConfidence} icon={BrainCircuit} />
        <StatCard label="Revision Due" value={data.summary.revisionDue} tone={data.summary.revisionDue ? "warning" : "success"} icon={RotateCcw} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartContainer title="Radial Mastery Analytics" eyebrow="Subject vector" minWidth={520}>
          <Suspense fallback={<ChartFallback />}>
            <SubjectRadar data={data.subjects} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Completion Matrix" eyebrow="Completion / accuracy / consistency" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <CompletionMatrix data={data.subjects} />
          </Suspense>
        </ChartContainer>

        <SectionCard title="Topic Heatmap" eyebrow="Mastery density">
          <HeatmapGrid data={heatmap} />
        </SectionCard>

        <ChartContainer title="Progress Timeline" eyebrow="Mastery forecast" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <SubjectProgressTimeline data={timeline} />
          </Suspense>
        </ChartContainer>
      </div>

      <SectionCard title="All GATE DA Subjects" eyebrow="Analytical subject cards">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {data.subjects.map((subject) => (
            <Link
              key={subject.id}
              to={`/dashboard/subjects/${subject.id}`}
              className="group border border-[var(--dash-border)] bg-white p-4 shadow-sm transition hover:border-[#bfdbfe] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center border border-[#bfdbfe] bg-[#EAF4FF] text-[#0D6EFD]">
                      <Layers3 size={16} />
                    </div>
                    <h3 className="font-semibold text-[#10213F]">{subject.subject}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#4B5563]">
                    {subject.revisionStatus} · {subject.recentActivity} recent signals
                  </p>
                </div>
                <ArrowRight size={16} className="text-[#0D6EFD] opacity-0 transition group-hover:opacity-100" />
              </div>

              <div className="mt-4 space-y-3">
                <ProgressBar label="Mastery" value={subject.mastery} />
                <ProgressBar label="Syllabus" value={subject.syllabusCompletion} tone="success" />
                <ProgressBar label="Confidence" value={subject.confidenceScore} tone="warning" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-2">
                  <div className="font-mono font-semibold text-[#10213F]">{subject.averageAccuracy}%</div>
                  <div className="text-[#4B5563]">Accuracy</div>
                </div>
                <div className="border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-2">
                  <div className="font-mono font-semibold text-[#10213F]">{subject.learningConsistency}%</div>
                  <div className="text-[#4B5563]">Consistency</div>
                </div>
                <div className="border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-2">
                  <div className="font-mono font-semibold text-[#10213F]">{subject.attempted}</div>
                  <div className="text-[#4B5563]">Attempts</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
