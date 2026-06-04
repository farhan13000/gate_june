import { lazy, Suspense } from "react";
import { BarChart3, BrainCircuit, FlaskConical, Gauge, GitCompare, Sigma, Target, TrendingUp } from "lucide-react";
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

const SkillRadarChart = lazy(() => import("@/dashboard/charts/SkillProfilingCharts").then((module) => ({ default: module.SkillRadarChart })));
const PeerComparisonBars = lazy(() => import("@/dashboard/charts/SkillProfilingCharts").then((module) => ({ default: module.PeerComparisonBars })));
const SkillProgressTimeline = lazy(() => import("@/dashboard/charts/SkillProfilingCharts").then((module) => ({ default: module.SkillProgressTimeline })));
const StrengthDistributionChart = lazy(() => import("@/dashboard/charts/SkillProfilingCharts").then((module) => ({ default: module.StrengthDistributionChart })));
const PercentileSkillMap = lazy(() => import("@/dashboard/charts/SkillProfilingCharts").then((module) => ({ default: module.PercentileSkillMap })));

function ChartFallback() {
  return <div className="h-64"><SkeletonLoader rows={4} /></div>;
}

export default function SkillsDashboard() {
  const { data, loading, error } = useDashboardQuery(async () => {
    const [profile, peers, progress, consistency] = await Promise.all([
      dashboardApi.skillsProfile(),
      dashboardApi.peerComparison(),
      dashboardApi.skillProgress(),
      dashboardApi.consistency(),
    ]);
    return { profile, peers, progress, consistency };
  }, []);

  if (loading) return <SkeletonLoader rows={7} />;
  if (error || !data) return <EmptyState title="Skill profile unavailable" description="The skill intelligence service could not be loaded." />;

  const { profile, peers, progress, consistency } = data;
  const priority = profile.summary.prioritySkill;
  const strongest = profile.summary.strongestSkill;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden border border-[var(--dash-border)] bg-white p-5 shadow-sm">
        <div className="absolute inset-0 dashboard-grid-bg opacity-80" aria-hidden="true" />
        <div className="pointer-events-none absolute right-6 top-5 hidden font-mono text-[11px] leading-6 text-[#0D6EFD]/20 lg:block" aria-hidden="true">
          {"skill = f(accuracy, speed, consistency)\npeer_rank ∈ [0, 100]\nΔ mastery / Δ week"}
        </div>
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D6EFD]">Skill profiling</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#10213F] sm:text-3xl">Multidimensional Academic Skill Profile</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B5563]">
              Profile analytical capability, mathematical depth, consistency, contest temperament, speed, and conceptual stability against peer benchmarks.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[24rem]">
            <AnalyticsCard title="Strongest Skill" value={strongest.score} meta={strongest.skill} />
            <AnalyticsCard title="Priority Skill" value={priority.score} meta={priority.skill} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Profile Score" value={profile.summary.profileScore} suffix="/100" icon={Sigma} />
        <StatCard label="Peer Percentile" value={peers.percentile} suffix="%" icon={GitCompare} />
        <StatCard label="Consistency" value={consistency.consistencyScore} suffix="/100" icon={Gauge} />
        <StatCard label="Rating Delta" value={profile.summary.ratingDelta} tone={profile.summary.ratingDelta >= 0 ? "success" : "danger"} icon={TrendingUp} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartContainer title="Premium Skill Radar" eyebrow="Multidimensional polygon" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <SkillRadarChart data={profile.skills} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Peer Comparison Overlay" eyebrow="You vs cohorts" minWidth={520}>
          <Suspense fallback={<ChartFallback />}>
            <PeerComparisonBars data={peers.cohorts} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Percentile Skill Map" eyebrow="Score / percentile / adaptive weight" minWidth={620}>
          <Suspense fallback={<ChartFallback />}>
            <PercentileSkillMap data={profile.matrices} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Skill Progression Timeline" eyebrow="Forecast trajectory" minWidth={560}>
          <Suspense fallback={<ChartFallback />}>
            <SkillProgressTimeline data={progress.timeline} />
          </Suspense>
        </ChartContainer>

        <ChartContainer title="Strength Distribution" eyebrow="Current vs forecast" minWidth={580}>
          <Suspense fallback={<ChartFallback />}>
            <StrengthDistributionChart data={profile.skills} />
          </Suspense>
        </ChartContainer>

        <SectionCard title="Consistency Map" eyebrow="Study discipline">
          <HeatmapGrid data={consistency.heatmap} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <div className="font-mono text-lg text-[#10213F]">{consistency.activeDays}</div>
              <div className="text-[#4B5563]">Active days</div>
            </div>
            <div className="border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <div className="font-mono text-lg text-[#10213F]">{profile.summary.attempts}</div>
              <div className="text-[#4B5563]">Skill samples</div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Adaptive Skill Weighting" eyebrow="Normalized scoring system">
        <div className="grid gap-4 lg:grid-cols-3">
          {profile.skills.map((skill) => (
            <div key={skill.skill} className="border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#bfdbfe] hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#10213F]">{skill.skill}</h3>
                  <p className="mt-1 text-xs text-[#4B5563]">Peer avg {skill.peerAverage}% · top {skill.topPerformer}%</p>
                </div>
                <BrainCircuit size={16} className="text-[#0D6EFD]" />
              </div>
              <div className="mt-4 space-y-3">
                <ProgressBar label="Score" value={skill.score} />
                <ProgressBar label="Percentile" value={skill.percentile} tone="success" />
                <ProgressBar label="Adaptive weight" value={skill.adaptiveWeight} tone="warning" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Comparative Analytics" eyebrow="Benchmark interpretation">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-[#E5E7EB] bg-[#F8FAFC] p-4">
            <Target className="mb-3 text-[#0D6EFD]" size={18} />
            <h3 className="text-sm font-semibold text-[#10213F]">Top Performer Gap</h3>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              Your largest improvement vector is {priority.skill}. Raising this by 12-15 points should improve the profile polygon noticeably.
            </p>
          </div>
          <div className="border border-[#E5E7EB] bg-[#F8FAFC] p-4">
            <BarChart3 className="mb-3 text-[#0D6EFD]" size={18} />
            <h3 className="text-sm font-semibold text-[#10213F]">Peer Position</h3>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              Current skill percentile is {peers.percentile}%. Compare against subject toppers and contest leaders to set the next benchmark.
            </p>
          </div>
          <div className="border border-[#E5E7EB] bg-[#F8FAFC] p-4">
            <FlaskConical className="mb-3 text-[#0D6EFD]" size={18} />
            <h3 className="text-sm font-semibold text-[#10213F]">Forecast</h3>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">
              Maintain consistency while targeting {priority.skill}; the model forecasts a stronger profile score in the next cycle.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
