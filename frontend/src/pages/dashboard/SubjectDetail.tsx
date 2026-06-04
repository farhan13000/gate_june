import { lazy, Suspense, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BrainCircuit, Clock, GitBranch, RotateCcw, Target, TimerReset } from "lucide-react";
import {
  AnalyticsCard,
  ChartContainer,
  EmptyState,
  ProgressBar,
  SectionCard,
  SkeletonLoader,
  StatCard,
} from "@/dashboard/components";
import { dashboardApi } from "@/dashboard/services";
import { useDashboardQuery } from "@/dashboard/hooks";

const ChapterBarChart = lazy(() => import("@/dashboard/charts/SubjectIntelligenceCharts").then((module) => ({ default: module.ChapterBarChart })));
const DependencyGraph = lazy(() => import("@/dashboard/charts/SubjectIntelligenceCharts").then((module) => ({ default: module.DependencyGraph })));
const SubjectProgressTimeline = lazy(() => import("@/dashboard/charts/SubjectIntelligenceCharts").then((module) => ({ default: module.SubjectProgressTimeline })));

function ChartFallback() {
  return <div className="h-64"><SkeletonLoader rows={4} /></div>;
}

export default function SubjectDetail() {
  const { subjectId = "" } = useParams();
  const { data, loading, error } = useDashboardQuery(() => dashboardApi.subjectDetailIntelligence(subjectId), [subjectId]);

  const timeline = useMemo(() => {
    return (data?.topics ?? []).slice(0, 10).map((topic) => ({
      label: topic.topic.slice(0, 10),
      mastery: topic.mastery,
      completion: topic.completion,
    }));
  }, [data]);

  if (loading) return <SkeletonLoader rows={7} />;
  if (error || !data) return <EmptyState title="Subject detail unavailable" description="This subject intelligence report could not be loaded." />;

  const { subject, chapters, topics, dependencyGraph, conceptCompletion } = data;
  const weakTopics = topics.filter((topic) => topic.weakness);
  const revisionDue = topics.filter((topic) => topic.spacedRepetition !== "Healthy");
  const totalTime = topics.reduce((sum, topic) => sum + topic.timeSpentMinutes, 0);
  const avgForecast = topics.length ? Math.round(topics.reduce((sum, topic) => sum + topic.forecast, 0) / topics.length) : 0;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden border border-[var(--dash-border)] bg-white p-5 shadow-sm">
        <div className="absolute inset-0 dashboard-grid-bg opacity-80" aria-hidden="true" />
        <div className="relative">
          <Link to="/dashboard/subjects" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0D6EFD] hover:underline">
            <ArrowLeft size={15} />
            Back to subjects
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D6EFD]">Subject intelligence report</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#10213F] sm:text-3xl">{subject.subject}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B5563]">
                Chapter analytics, topic mastery, concept decay, revision frequency, and mastery forecasting for targeted preparation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[22rem]">
              <AnalyticsCard title="Concepts Tracked" value={conceptCompletion.totalTracked} meta={`${conceptCompletion.completed} completed`} />
              <AnalyticsCard title="Weak Concepts" value={conceptCompletion.weak} meta="Needs repair" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subject Mastery" value={subject.mastery} suffix="%" icon={Target} />
        <StatCard label="Confidence Score" value={subject.confidenceScore} suffix="%" icon={BrainCircuit} />
        <StatCard label="Time Spent" value={Math.round(totalTime / 60)} suffix="h" icon={Clock} />
        <StatCard label="Forecast" value={avgForecast} suffix="%" icon={TimerReset} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartContainer title="Chapter Analytics" eyebrow="Mastery and completion" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <ChapterBarChart data={chapters} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Mastery Forecasting" eyebrow="Topic trajectory" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <SubjectProgressTimeline data={timeline} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Dependency Mapping" eyebrow="Concept graph" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <DependencyGraph data={dependencyGraph} />
          </Suspense>
        </ChartContainer>

        <SectionCard title="Revision Intelligence" eyebrow="Spaced repetition">
          <div className="space-y-3">
            <ProgressBar label="Syllabus completion" value={subject.syllabusCompletion} />
            <ProgressBar label="Average accuracy" value={subject.averageAccuracy} tone="success" />
            <ProgressBar label="Learning consistency" value={subject.learningConsistency} tone="warning" />
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <RotateCcw size={15} className="mb-2 text-[#0D6EFD]" />
                <div className="font-mono text-lg text-[#10213F]">{revisionDue.length}</div>
                <div className="text-[#4B5563]">Revision indicators</div>
              </div>
              <div className="border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <GitBranch size={15} className="mb-2 text-[#0D6EFD]" />
                <div className="font-mono text-lg text-[#10213F]">{dependencyGraph.length}</div>
                <div className="text-[#4B5563]">Dependencies</div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Topic Mastery and Weakness Detection" eyebrow="Concept table">
        <div className="dashboard-scrollbar overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-xs uppercase text-[#4B5563]">
              <tr>
                <th className="px-3 py-2">Topic</th>
                <th className="px-3 py-2">Chapter</th>
                <th className="px-3 py-2">Mastery</th>
                <th className="px-3 py-2">Accuracy</th>
                <th className="px-3 py-2">Concept Decay</th>
                <th className="px-3 py-2">Revision</th>
                <th className="px-3 py-2">Problems</th>
                <th className="px-3 py-2">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id} className="border-b border-[#EEF2F7] transition hover:bg-[#F8FAFC]">
                  <td className="px-3 py-3 font-semibold text-[#10213F]">{topic.topic}</td>
                  <td className="px-3 py-3 text-[#4B5563]">{topic.chapter}</td>
                  <td className="px-3 py-3"><ProgressBar value={topic.mastery} /></td>
                  <td className="px-3 py-3 font-mono text-[#10213F]">{topic.accuracy}%</td>
                  <td className="px-3 py-3 font-mono text-[#10213F]">{topic.conceptDecay}%</td>
                  <td className="px-3 py-3">
                    <span className={`border px-2 py-1 text-xs ${topic.spacedRepetition === "Healthy" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#bfdbfe] bg-[#EAF4FF] text-[#0D6EFD]"}`}>
                      {topic.spacedRepetition}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[#10213F]">{topic.attempts}</td>
                  <td className="px-3 py-3 font-mono text-[#10213F]">{topic.forecast}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Priority Repair Queue" eyebrow="Weakness detection">
        {weakTopics.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {weakTopics.map((topic) => (
              <div key={topic.id} className="border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-[#10213F]">{topic.topic}</h3>
                <p className="mt-2 text-sm text-[#4B5563]">
                  Decay {topic.conceptDecay}% · accuracy {topic.accuracy}% · {topic.spacedRepetition}
                </p>
                <div className="mt-3">
                  <ProgressBar label="Repair forecast" value={topic.forecast} tone="warning" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No urgent weaknesses detected" description="Current subject signals are stable. Keep revision cadence active." />
        )}
      </SectionCard>
    </div>
  );
}
