import { useMemo } from "react";
import {
  Activity,
  BarChart3,
  Clock3,
  Gauge,
  Layers3,
  ListChecks,
  Target,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

type SubjectPerformance = {
  subject: string;
  attempted: number;
  correct: number;
  accuracy: number;
  avgTime: number;
  weak: boolean;
};

type DifficultyPerformance = {
  level: "Easy" | "Medium" | "Hard";
  attempted: number;
  correct: number;
  accuracy: number;
};

type QuestionTypePerformance = {
  type: string;
  attempted: number;
  accuracy: number;
  avgTime: number;
};

const axis = {
  stroke: "#94A3B8",
  tickLine: false,
  axisLine: false,
  fontSize: 11,
};

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  color: "#10213F",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
};

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function subjectTone(accuracy: number) {
  if (accuracy >= 75) return "#0D6EFD";
  if (accuracy >= 60) return "#F59E0B";
  return "#EF4444";
}

export function AccuracyBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = value >= 75 ? "#0D6EFD" : value >= 55 ? "#F59E0B" : "#EF4444";

  return (
    <div className="h-1.5 w-full overflow-hidden bg-[#E5E7EB]">
      <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function normalizeSubject(item: Record<string, unknown>): SubjectPerformance {
  const attempted = toNumber(item.attempted);
  const correct = toNumber(item.correct);
  const accuracy = toNumber(item.accuracy);
  return {
    subject: String(item.subject ?? "Unknown"),
    attempted,
    correct,
    accuracy,
    avgTime: toNumber(item.avgTime, 0),
    weak: Boolean(item.weak) || (attempted > 0 && accuracy < 60),
  };
}

function normalizeDifficulty(item: Record<string, unknown>): DifficultyPerformance {
  return {
    level: String(item.level ?? "Medium") as DifficultyPerformance["level"],
    attempted: toNumber(item.attempted),
    correct: toNumber(item.correct),
    accuracy: toNumber(item.accuracy),
  };
}

function normalizeQuestionType(item: Record<string, unknown>): QuestionTypePerformance {
  return {
    type: String(item.type ?? "Format"),
    attempted: toNumber(item.attempted),
    accuracy: toNumber(item.accuracy),
    avgTime: toNumber(item.avgTime),
  };
}

export default function PerformanceAnalytics() {
  const { data, loading, error } = useDashboardQuery(async () => {
    const [subject, difficulty, questionType] = await Promise.all([
      dashboardApi.performanceSummary("subject"),
      dashboardApi.performanceSummary("difficulty"),
      dashboardApi.performanceSummary("questionType"),
    ]);

    return {
      subjects: subject.data.map(normalizeSubject),
      difficulties: difficulty.data.map(normalizeDifficulty),
      questionTypes: questionType.data.map(normalizeQuestionType),
    };
  }, []);

  const model = useMemo(() => {
    const subjects = data?.subjects ?? [];
    const difficulties = data?.difficulties ?? [];
    const questionTypes = data?.questionTypes ?? [];
    const activeSubjects = subjects.filter((subject) => subject.attempted > 0);
    const totalAttempts = activeSubjects.reduce((sum, subject) => sum + subject.attempted, 0);
    const totalCorrect = activeSubjects.reduce((sum, subject) => sum + subject.correct, 0);
    const overallAccuracy = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const weightedTime = totalAttempts
      ? activeSubjects.reduce((sum, subject) => sum + subject.avgTime * subject.attempted, 0) / totalAttempts
      : 0;
    const subjectAccuracies = activeSubjects.map((subject) => subject.accuracy);
    const balanceIndex = clamp(100 - standardDeviation(subjectAccuracies) * 1.35);
    const hardAccuracy = difficulties.find((item) => item.level === "Hard")?.accuracy ?? 0;
    const volumeScore = clamp((totalAttempts / 120) * 100);
    const readiness = clamp(overallAccuracy * 0.42 + hardAccuracy * 0.18 + balanceIndex * 0.2 + volumeScore * 0.2);
    const weakSubjects = activeSubjects.filter((subject) => subject.weak);
    const slowestSubject = activeSubjects.slice().sort((a, b) => b.avgTime - a.avgTime)[0];
    const weakestSubject = activeSubjects.slice().sort((a, b) => a.accuracy - b.accuracy)[0];
    const bestSubject = activeSubjects.slice().sort((a, b) => b.accuracy - a.accuracy || b.attempted - a.attempted)[0];
    const pressureQueue = activeSubjects
      .map((subject) => ({
        ...subject,
        priority: clamp((100 - subject.accuracy) * 0.55 + subject.avgTime * 8 + Math.min(subject.attempted, 30) * 0.5),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    return {
      subjects,
      difficulties,
      questionTypes,
      activeSubjects,
      totalAttempts,
      overallAccuracy,
      weightedTime,
      balanceIndex,
      readiness,
      weakSubjects,
      slowestSubject,
      weakestSubject,
      bestSubject,
      pressureQueue,
    };
  }, [data]);

  if (loading) return <SkeletonLoader rows={8} />;
  if (error || !data) {
    return (
      <EmptyState
        title="Performance analytics unavailable"
        description="The performance intelligence service could not be loaded."
      />
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <section className="relative min-w-0 overflow-hidden border border-[var(--dash-border)] bg-white p-4 shadow-sm sm:p-5">
        <div className="absolute inset-0 dashboard-grid-bg opacity-80" aria-hidden="true" />
        <div className="pointer-events-none absolute right-6 top-5 hidden font-mono text-[11px] leading-6 text-[#0D6EFD]/20 lg:block" aria-hidden="true">
          {"readiness = accuracy x pressure x balance\nrisk = low accuracy + slow time + volume\nmastery needs subject balance"}
        </div>
        <div className="relative flex min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D6EFD]">
              Performance intelligence
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#10213F] sm:text-3xl">
              Diagnostic Performance Cockpit
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B5563]">
              Convert attempts into a study strategy by combining accuracy, difficulty pressure, speed, and subject balance.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:min-w-[28rem]">
            <AnalyticsCard title="Best Signal" value={`${model.bestSubject?.accuracy ?? 0}%`} meta={model.bestSubject?.subject ?? "No attempts yet"} />
            <AnalyticsCard title="Highest Risk" value={`${model.weakestSubject?.accuracy ?? 0}%`} meta={model.weakestSubject?.subject ?? "No risk signal"} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Readiness" value={model.readiness} suffix="/100" icon={Gauge} />
        <StatCard label="Accuracy" value={model.overallAccuracy} suffix="%" icon={Target} />
        <StatCard label="Attempts" value={model.totalAttempts} icon={Activity} />
        <StatCard label="Avg Time" value={model.weightedTime ? model.weightedTime.toFixed(1) : "0"} suffix="m" icon={Clock3} />
        <StatCard label="Weak Zones" value={model.weakSubjects.length} tone={model.weakSubjects.length ? "danger" : "success"} icon={Zap} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <ChartContainer title="Subject Balance Board" eyebrow="Accuracy / volume / weakness" minWidth={760}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.subjects} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid stroke="rgba(13,110,253,0.07)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} {...axis} />
                <YAxis type="category" dataKey="subject" width={112} {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine x={70} stroke="#10B981" strokeDasharray="4 4" />
                <Bar dataKey="accuracy" radius={[0, 2, 2, 0]}>
                  {model.subjects.map((subject) => (
                    <Cell key={subject.subject} fill={subjectTone(subject.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        <SectionCard title="Strategic Snapshot" eyebrow="Decision metrics">
          <div className="space-y-4">
            <ProgressBar label="Readiness score" value={model.readiness} />
            <ProgressBar label="Subject balance" value={model.balanceIndex} tone="success" />
            <ProgressBar label="Overall accuracy" value={model.overallAccuracy} tone={model.overallAccuracy >= 65 ? "success" : "warning"} />
            <div className="grid gap-3 border-t border-[#E5E7EB] pt-4 text-sm">
              <div className="flex items-start gap-3">
                <Layers3 className="mt-0.5 text-[#0D6EFD]" size={17} />
                <p className="text-[#4B5563]">
                  Balance index is {model.balanceIndex}/100. A high score means your subject graph is stable, not dependent on a single strong area.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ListChecks className="mt-0.5 text-[#0D6EFD]" size={17} />
                <p className="text-[#4B5563]">
                  Next study block should start with {model.pressureQueue[0]?.subject ?? "the lowest-signal subject"} and use timed mixed practice.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <ChartContainer title="Difficulty Pressure Curve" eyebrow="Attempts vs accuracy" minWidth={620}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={model.difficulties}>
                <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
                <XAxis dataKey="level" {...axis} />
                <YAxis yAxisId="left" {...axis} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar yAxisId="left" dataKey="attempted" fill="#EAF4FF" stroke="#0D6EFD" radius={[2, 2, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#0D6EFD" strokeWidth={2.5} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        <ChartContainer title="Format Speed-Accuracy Matrix" eyebrow="Question type efficiency" minWidth={620}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 6 }}>
                <CartesianGrid stroke="rgba(13,110,253,0.07)" />
                <XAxis dataKey="avgTime" name="Avg time" type="number" unit="m" {...axis} />
                <YAxis dataKey="accuracy" name="Accuracy" type="number" unit="%" domain={[0, 100]} {...axis} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
                <ReferenceLine y={70} stroke="#10B981" strokeDasharray="4 4" />
                <Scatter name="Format" data={model.questionTypes} fill="#0D6EFD" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      <SectionCard title="Learning Risk Queue" eyebrow="What to fix first">
        <div className="grid gap-4 lg:grid-cols-5">
          {model.pressureQueue.map((subject, index) => (
            <div key={subject.subject} className="border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0D6EFD]">
                    #{index + 1} priority
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-[#10213F]">{subject.subject}</h3>
                </div>
                <BarChart3 size={16} className="text-[#0D6EFD]" />
              </div>
              <div className="mt-4 space-y-3">
                <ProgressBar label="Accuracy" value={subject.accuracy} tone={subject.accuracy >= 65 ? "success" : "danger"} />
                <ProgressBar label="Risk weight" value={subject.priority} tone="warning" />
                <p className="text-xs leading-5 text-[#4B5563]">
                  {subject.attempted} attempts, {subject.avgTime}m avg time. Use focused review followed by 20-minute mixed drills.
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
