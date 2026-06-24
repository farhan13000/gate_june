import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleUserRound,
  Flame,
  Info,
  Medal,
  Pencil,
} from "lucide-react";
import { EmptyState, SkeletonLoader } from "@/dashboard/components";
import { useDashboardQuery } from "@/dashboard/hooks";
import { dashboardApi } from "@/dashboard/services";
import { useAuth } from "@/contexts/AuthContext";

type MetricCardData = {
  label: string;
  value: string;
  meta: string;
  icon: LucideIcon;
  tone: string;
};

type DifficultyLevel = "Easy" | "Medium" | "Hard";

type DifficultySlice = {
  level: DifficultyLevel;
  solved: number;
  total: number;
  attempting: number;
};

type HeatmapDay = {
  date: string;
  count: number;
  studyTimeMinutes: number;
  accuracy: number;
};

type HeatmapStats = {
  solvedAllTime: number;
  solvedLastYear: number;
  solvedLastMonth: number;
  maxStreak: number;
  streakLastYear: number;
  streakLastMonth: number;
  activeDays?: number;
  totalSubmissions?: number;
  averageAccuracy?: number;
  bestDay?: HeatmapDay;
};

type ActivityPayload = {
  activity: HeatmapDay[];
  year?: number;
  availableYears?: number[];
  startDate?: string;
  endDate?: string;
  stats: HeatmapStats;
};

type HeatmapCell = HeatmapDay | null;

type RatingPoint = {
  date: string;
  label?: string;
  rating: number;
  contestTitle?: string;
};

const difficultyVisuals: Record<DifficultyLevel, { key: "easy" | "medium" | "hard"; light: string; dark: string }> = {
  Easy: { key: "easy", light: "#DDF6F7", dark: "#00B8A9" },
  Medium: { key: "medium", light: "#FFF4E5", dark: "#FFA500" },
  Hard: { key: "hard", light: "#FFE8E8", dark: "#FF4D4F" },
};

const chartAxisWidthPx = 48;
const dayMs = 24 * 60 * 60 * 1000;
const emptyActivityStats: HeatmapStats = {
  solvedAllTime: 0,
  solvedLastYear: 0,
  solvedLastMonth: 0,
  maxStreak: 0,
  streakLastYear: 0,
  streakLastMonth: 0,
};

function dateFromKeyUTC(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKeyFromUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysUTC(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(" ");
}

function formatDate(date: string) {
  return dateFromKeyUTC(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function MetricCard({ label, value, meta, icon: Icon, tone }: MetricCardData) {
  return (
    <div className="group border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${tone}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#475569]">{label}</p>
          <p className="mt-1 font-mono text-3xl font-bold leading-none text-[#10213f]">{value}</p>
          <p className="mt-1.5 text-xs text-[#64748b]">{meta}</p>
        </div>
      </div>
    </div>
  );
}

function ProblemSolvedArc({ slices }: { slices: DifficultySlice[] }) {
  const [active, setActive] = useState<DifficultyLevel | null>(null);
  const totalProblems = slices.reduce((sum, item) => sum + item.total, 0);
  const totalSolved = slices.reduce((sum, item) => sum + item.solved, 0);
  const totalAttempting = slices.reduce((sum, item) => sum + item.attempting, 0);
  const completionRate = totalProblems ? Math.round((totalSolved / totalProblems) * 100) : 0;
  const arcCenterX = 160;
  const arcCenterY = 145;
  const arcRadius = 104;
  const startAngle = 160;
  const totalAngle = 220;
  const gap = totalProblems > 0 ? 7 : 0;
  let cursor = startAngle;

  const segments = slices.map((item) => {
    const visual = difficultyVisuals[item.level];
    const rawAngle = totalProblems ? (item.total / totalProblems) * totalAngle : totalAngle / slices.length;
    const segmentStart = cursor;
    const segmentEnd = cursor + Math.max(0, rawAngle - gap);
    const solvedEnd = segmentStart + (segmentEnd - segmentStart) * (item.total ? item.solved / item.total : 0);
    cursor += rawAngle;
    return { ...item, ...visual, segmentStart, segmentEnd, solvedEnd };
  });

  const activeSegment = active ? segments.find((item) => item.level === active) : null;
  const summaryLabel = activeSegment ? `${activeSegment.level} progress` : "Overall progress";
  const summarySolved = activeSegment ? activeSegment.solved : totalSolved;
  const summaryTotal = activeSegment ? activeSegment.total : totalProblems;
  const summaryAttempting = activeSegment ? activeSegment.attempting : totalAttempting;
  const summaryRate = summaryTotal ? Math.round((summarySolved / summaryTotal) * 100) : 0;

  return (
    <section className="flex h-full min-h-[28rem] flex-col border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5" aria-labelledby="problems-solved-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="problems-solved-heading" className="text-base font-bold text-[#10213f]">Problems Solved</h2>
          <p className="mt-1 text-xs font-medium text-[#64748b]">Completion across your current practice set</p>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#e4e7ec] bg-[#f8fafc] text-[#94a3b8]" title="Hover or tap a difficulty to inspect its progress">
          <Info size={13} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-y border-[#edf0f4] py-3">
        <div className="min-w-0 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b]">Completion</p>
          <p className="mt-1 font-mono text-xl font-bold leading-none text-[#10213f]">{completionRate}%</p>
        </div>
        <div className="min-w-0 border-l border-[#edf0f4] px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b]">In progress</p>
          <p className="mt-1 font-mono text-xl font-bold leading-none text-[#10213f]">{totalAttempting}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-1 flex-col justify-between gap-4">
        <div className="relative mx-auto flex min-h-[13.5rem] w-full max-w-[22rem] items-center justify-center">
          <svg viewBox="0 0 320 270" className="h-[14.5rem] w-full" role="img" aria-label={`${totalSolved} of ${totalProblems} problems solved`}>
            {segments.map((segment, index) => {
              const isActive = active === segment.level;
              return (
                <g
                  key={segment.level}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={() => setActive(segment.level)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive((current) => current === segment.level ? null : segment.level)}
                >
                  <path
                    d={describeArc(arcCenterX, arcCenterY, arcRadius, segment.segmentStart, segment.segmentEnd)}
                    fill="none"
                    stroke={segment.light}
                    strokeWidth={17}
                    strokeLinecap="round"
                    opacity={active && !isActive ? 0.34 : 1}
                  />
                  {segment.solved > 0 && (
                    <path
                      d={describeArc(arcCenterX, arcCenterY, arcRadius, segment.segmentStart, segment.solvedEnd)}
                      fill="none"
                      stroke={segment.dark}
                      strokeWidth={17}
                      strokeLinecap="round"
                      opacity={active && !isActive ? 0.46 : 1}
                      pathLength="100"
                      className="dashboard-arc-draw"
                      style={{ animationDelay: `${index * 110}ms` }}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-[2.1rem] font-bold leading-none text-[#111827]">
                {summarySolved}
                <span className="text-sm font-semibold text-[#475569]">/{summaryTotal}</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-[#16a34a]">
                <CheckCircle2 size={13} />
                {activeSegment ? activeSegment.level : "Solved"}
              </div>
              <div className="mt-3 text-[11px] font-medium text-[#64748b]">{summaryRate}% complete</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2" aria-live="polite">
          {segments.map((item) => {
            const isActive = active === item.level;
            const percentage = item.total ? Math.round((item.solved / item.total) * 100) : 0;
            return (
              <button
                type="button"
                key={item.level}
                onMouseEnter={() => setActive(item.level)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(item.level)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((current) => current === item.level ? null : item.level)}
                aria-pressed={isActive}
                className={`min-w-0 border px-2 py-3 text-left transition duration-200 sm:px-3 ${
                  isActive ? "border-[#93c5fd] bg-[#f8fbff] shadow-sm" : "border-[#edf0f4] bg-[#fbfcfe] hover:border-[#bfdbfe] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-bold" style={{ color: item.dark }}>{item.level}</span>
                  <span className="font-mono text-[10px] font-semibold text-[#64748b]">{percentage}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden bg-white">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, background: item.dark }} />
                </div>
                <div className="mt-2 font-mono text-xs font-bold text-[#10213f]">{item.solved}<span className="text-[#94a3b8]">/{item.total}</span></div>
              </button>
            );
          })}
        </div>
        <p className="text-center text-[11px] font-medium text-[#64748b]">{summaryLabel} / {summaryAttempting} currently attempting</p>
      </div>
    </section>
  );
}

function ProfileCard({
  userName,
  rating,
  fullName,
  email,
  institution,
  targetGateYear,
  joinedAt,
  avatarUrl,
}: {
  userName: string;
  rating: number;
  fullName?: string;
  email?: string;
  institution?: string;
  targetGateYear?: number;
  joinedAt?: string;
  avatarUrl?: string;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const memberSince = joinedAt
    ? new Date(joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";
  const profileItems = [
    ["Name", fullName || "Student"],
    ["Target", targetGateYear ? `GATE DA ${targetGateYear}` : "GATE DA"],
    ["Email", email || "Not linked"],
    ["Institution", institution || "Not specified"],
    ["Member Since", memberSince],
  ];
  const getProfileItemBorder = (index: number) => {
    if (index === 0) return "";
    if (index === 1) return "border-t border-[#e2e8f0] sm:border-l sm:border-t-0";
    return index % 2 === 0 ? "border-t border-[#e2e8f0]" : "border-l border-t border-[#e2e8f0]";
  };

  return (
    <section className="flex h-full flex-col overflow-hidden border border-[#e2e8f0] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]" aria-labelledby="learner-profile-heading">
      <div className="border-b border-[#e2e8f0] bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#bfdbfe] bg-[#eaf4ff] text-[#0b6fe8]">
              <CircleUserRound size={18} />
            </span>
            <div className="min-w-0">
              <h2 id="learner-profile-heading" className="text-base font-bold text-[#10213f]">Learner Profile</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#64748b]">Preparation identity and live progress</p>
            </div>
          </div>
          <button className="inline-flex shrink-0 items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-[#0b6fe8] transition hover:bg-[#eaf4ff]" aria-label="Edit profile">
            <Pencil size={16} />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </div>

      <div className="grid flex-1 items-stretch gap-0 lg:grid-cols-[minmax(13rem,0.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center border-b border-[#e2e8f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:p-5 lg:text-center">
          <div className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-hidden border border-[#d9e3ef] bg-[#f1f5f9] text-[#94a3b8] shadow-[0_8px_18px_rgba(15,23,42,0.08)] lg:h-[6.25rem] lg:w-[6.25rem]">
            {avatarUrl && !avatarFailed ? (
              <img
                src={avatarUrl}
                alt={fullName || userName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="relative h-full w-full overflow-hidden bg-[#10213f]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(11,111,232,0.55),transparent_28%),linear-gradient(180deg,#10213f_0%,#1e3a5f_46%,#1f6f5f_70%,#0f172a_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#172554]" />
                <div className="absolute bottom-6 left-1/2 h-7 w-10 -translate-x-1/2 bg-[#f97316] shadow-[0_0_18px_rgba(249,115,22,0.55)] [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
              </div>
            )}
          </div>
          <div className="min-w-0 sm:flex-1 lg:mt-4 lg:flex-none">
            <h3 className="max-w-full truncate text-lg font-bold text-[#10213f] lg:text-xl">{userName}</h3>
            <p className="mt-1 max-w-full truncate text-xs font-medium text-[#64748b]">{fullName || email || "GATE DA learner"}</p>
            <div className="mt-2 inline-flex border border-[#bfdbfe] bg-[#eaf4ff] px-2 py-1 text-[11px] font-bold text-[#0b6fe8]">
              Student
            </div>
          </div>
          <div className="mt-4 grid w-full grid-cols-[1fr_auto] items-center gap-3 border-t border-[#e2e8f0] pt-3 text-left sm:mt-0 sm:w-auto sm:min-w-[9rem] sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:mt-5 lg:w-full lg:grid-cols-1 lg:border-l-0 lg:border-t lg:pt-4 lg:text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748b]">Current rating</p>
              <p className="mt-1 font-mono text-3xl font-bold leading-none text-[#0b6fe8]">{rating}</p>
            </div>
            <p className="text-right text-[11px] font-medium text-[#64748b] lg:text-center">Keep practicing to improve</p>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:flex sm:flex-col sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b]">Profile details</p>
            <p className="hidden text-[11px] font-medium text-[#94a3b8] sm:block">Manage details from account settings</p>
          </div>
          <dl className="grid overflow-hidden border border-[#e2e8f0] bg-[#fcfdfd] sm:min-h-0 sm:flex-1 sm:grid-cols-2 sm:grid-rows-3">
            {profileItems.map(([label, value], index) => (
              <div
                key={label}
                className={`min-w-0 px-4 py-3.5 transition hover:bg-white ${getProfileItemBorder(index)} ${
                  index === profileItems.length - 1 ? "sm:col-span-2" : ""
                }`}
              >
                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748b]">{label}</dt>
                <dd className="mt-1.5 min-w-0 break-words text-sm font-bold leading-snug text-[#10213f]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function ratingTitle(rating: number) {
  if (rating >= 1900) return "elite";
  if (rating >= 1600) return "expert";
  if (rating >= 1400) return "specialist";
  if (rating >= 1200) return "pupil";
  return "newbie";
}

function RatingProgress({ data, userName }: { data: RatingPoint[]; userName: string }) {
  const ratings = data.map((item) => item.rating);
  const maxRating = Math.max(2000, ...ratings, 1200);
  const minRating = Math.min(900, ...ratings, 1200);
  const yMin = Math.max(0, Math.floor((minRating - 120) / 100) * 100);
  const yMax = Math.ceil((maxRating + 120) / 100) * 100;
  const currentRating = ratings[ratings.length - 1] ?? 0;

  return (
    <section className="border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#10213f]">Contest Rating Progress</h2>
          <p className="mt-1 text-xs font-semibold text-[#64748b]">Rating changes only after rated contest results are applied.</p>
        </div>
        <span className="border border-[#e4e7ec] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#475569]">
          Rated contests only
        </span>
      </div>
      <div className="border border-[#e4e7ec] bg-[#f8fafc] p-3">
        <div className="h-[20rem] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <ReferenceArea y1={yMin} y2={1200} fill="#eef1f4" fillOpacity={1} strokeOpacity={0} />
              <ReferenceArea y1={1200} y2={1400} fill="#dcfce7" fillOpacity={0.9} strokeOpacity={0} />
              <ReferenceArea y1={1400} y2={1600} fill="#ccfbf1" fillOpacity={0.88} strokeOpacity={0} />
              <ReferenceArea y1={1600} y2={1900} fill="#dbeafe" fillOpacity={0.9} strokeOpacity={0} />
              <ReferenceArea y1={1900} y2={yMax} fill="#f3e8ff" fillOpacity={0.92} strokeOpacity={0} />
              <CartesianGrid stroke="#94a3b8" strokeOpacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#475569" }}
                axisLine={{ stroke: "#94a3b8" }}
                tickLine={{ stroke: "#cbd5e1" }}
                minTickGap={28}
              />
              <YAxis
                domain={[yMin, yMax]}
                ticks={[1200, 1400, 1600, 1900].filter((tick) => tick >= yMin && tick <= yMax)}
                tick={{ fontSize: 11, fill: "#475569" }}
                axisLine={{ stroke: "#94a3b8" }}
                tickLine={{ stroke: "#cbd5e1" }}
                width={chartAxisWidthPx}
              />
              <Tooltip
                cursor={{ stroke: "#1976d2", strokeWidth: 1 }}
                contentStyle={{
                  border: "1px solid #bfdbfe",
                  borderRadius: 0,
                  background: "rgba(248, 250, 252, 0.96)",
                  boxShadow: "0 14px 30px rgba(15,23,42,0.12)",
                }}
                formatter={(value) => {
                  const numeric = Number(value);
                  return [`${numeric} (${ratingTitle(numeric)})`, "Rating"];
                }}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as RatingPoint | undefined;
                  return point?.contestTitle ? `${point.contestTitle} - ${point.date}` : point?.date || "Current rating";
                }}
                labelStyle={{ color: "#10213f", fontWeight: 700 }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#ffffff", stroke: "#f59e0b", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#ef4444", stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-xs font-semibold text-[#475569]">
        <span className="h-3 w-3 border border-[#b45309] bg-[#f2c94c]" />
        <span>{userName}</span>
        <span className="font-mono text-[#10213f]">{currentRating}</span>
      </div>
    </section>
  );
}

function ActivityHeatmap({
  days,
  stats,
  year,
  availableYears,
  onYearChange,
  updatedAt,
  startDate,
  endDate,
}: {
  days: HeatmapDay[];
  stats: HeatmapStats;
  year: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  updatedAt?: Date | null;
  startDate?: string;
  endDate?: string;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const normalizedDays = useMemo(
    () => [...days].sort((a, b) => a.date.localeCompare(b.date)),
    [days]
  );
  const maxCount = useMemo(
    () => Math.max(0, ...normalizedDays.map((day) => day.count)),
    [normalizedDays]
  );
  const weeks = useMemo<HeatmapCell[][]>(() => {
    if (!normalizedDays.length) return [];
    const byDate = new Map(normalizedDays.map((day) => [day.date, day]));
    const firstDate = dateFromKeyUTC(normalizedDays[0].date);
    const lastDate = dateFromKeyUTC(normalizedDays[normalizedDays.length - 1].date);
    const startDateAligned = new Date(firstDate);
    const mondayOffset = (firstDate.getUTCDay() + 6) % 7;
    startDateAligned.setUTCDate(firstDate.getUTCDate() - mondayOffset);
    const totalDays = Math.floor((lastDate.getTime() - startDateAligned.getTime()) / dayMs) + 1;
    const weekCount = Math.ceil(totalDays / 7);

    return Array.from({ length: weekCount }, (_, weekIndex) => (
      Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDaysUTC(startDateAligned, weekIndex * 7 + dayIndex);
        if (date < firstDate || date > lastDate) return null;
        const dateKey = dateKeyFromUTC(date);
        return byDate.get(dateKey) ?? {
          date: dateKey,
          count: 0,
          studyTimeMinutes: 0,
          accuracy: 0,
        };
      })
    ));
  }, [normalizedDays]);

  useEffect(() => {
    if (!normalizedDays.length) {
      setSelectedDate(null);
      return;
    }
    const currentSelectionExists = selectedDate && normalizedDays.some((day) => day.date === selectedDate);
    if (currentSelectionExists) return;
    const lastActiveDay = [...normalizedDays].reverse().find((day) => day.count > 0);
    setSelectedDate(lastActiveDay?.date ?? null);
  }, [normalizedDays, selectedDate]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; week: number }> = [];
    weeks.forEach((week, weekIndex) => {
      week.forEach((day) => {
        if (!day) return;
        const date = dateFromKeyUTC(day.date);
        const label = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
        if ((date.getUTCDate() === 1 || labels.length === 0) && labels[labels.length - 1]?.label !== label) {
          labels.push({ label, week: weekIndex });
        }
      });
    });
    return labels.filter((item, index) => {
      const next = labels[index + 1];
      if (!next) return true;
      return next.week - item.week >= 3;
    });
  }, [weeks]);
  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];
  const safeAvailableYears = availableYears.length ? availableYears : [year];
  const dateRangeLabel = startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : `${year}`;
  const selectedDay = normalizedDays.find((day) => day.date === selectedDate && day.count > 0) ?? null;
  const activeDayRows = useMemo(
    () => normalizedDays.filter((day) => day.count > 0).reverse(),
    [normalizedDays]
  );
  const activeDays = stats.activeDays ?? normalizedDays.filter((day) => day.count > 0).length;
  const totalSubmissions = stats.totalSubmissions ?? normalizedDays.reduce((sum, day) => sum + day.count, 0);
  const averageAccuracy = stats.averageAccuracy ?? (
    totalSubmissions
      ? Math.round(
          normalizedDays.reduce((sum, day) => sum + (day.count * day.accuracy) / 100, 0) /
            totalSubmissions *
            100
        )
      : 0
  );
  const bestDay = stats.bestDay?.date
    ? stats.bestDay
    : normalizedDays.reduce(
        (best, day) => (day.count > best.count ? day : best),
        { date: "", count: 0, studyTimeMinutes: 0, accuracy: 0 }
      );

  const colorFor = (count: number) => {
    if (count <= 0) return "#eef2f7";
    const ratio = maxCount ? count / maxCount : 0;
    if (ratio <= 0.25) return "#dbeafe";
    if (ratio <= 0.5) return "#93c5fd";
    if (ratio <= 0.75) return "#3b82f6";
    return "#0b6fe8";
  };

  return (
    <section className="border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#10213f]">Activity Heatmap</h2>
            <Info size={14} className="text-[#94a3b8]" />
          </div>
          <p className="mt-1 text-sm text-[#64748b]">
            Local-calendar activity from practice and contest submission history.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[#64748b]">
          <label className="inline-flex items-center gap-2 border border-[#bfdbfe] bg-[#eaf4ff] px-2 py-1 font-bold text-[#0b6fe8]">
            Year
            <select
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="border border-[#bfdbfe] bg-white px-2 py-1 text-xs font-bold text-[#10213f] outline-none focus:border-[#0b6fe8]"
            >
              {safeAvailableYears.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <span className="border border-[#dbe3ee] bg-[#f8fafc] px-2 py-1 font-semibold text-[#475569]">
            {dateRangeLabel}
          </span>
          <span className="border border-[#dbe3ee] bg-white px-2 py-1 font-medium">
            Updated {updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "live"}
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto border border-[#e4e7ec] bg-[#f8fafc] p-3 shadow-sm sm:p-4">
        {normalizedDays.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#64748b]">
            No activity data is available for this year yet.
          </div>
        ) : (
          <div className="w-max min-w-full">
            <div className="grid" style={{ gridTemplateColumns: "30px max-content" }}>
              <div />
              <div className="relative h-5 text-[10px] font-medium text-[#64748b]">
                {monthLabels.map((item) => (
                  <span
                    key={`${item.label}-${item.week}`}
                    className="absolute top-0 whitespace-nowrap"
                    style={{ left: `${item.week * 16}px` }}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-1 grid" style={{ gridTemplateColumns: "30px max-content" }}>
              <div className="grid pr-2 text-[10px] font-medium leading-none text-[#64748b]" style={{ gridTemplateRows: "repeat(7, 13px)", rowGap: 3 }}>
                {dayLabels.map((label, index) => (
                  <div key={`${label}-${index}`} className="flex h-full items-center">{label}</div>
                ))}
              </div>
              <div
                className="relative grid"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(weeks.length, 1)}, 13px)`,
                  gridTemplateRows: "repeat(7, 13px)",
                  columnGap: 3,
                  rowGap: 3,
                }}
              >
                {weeks.map((week, weekIndex) => (
                  week.map((day, dayIndex) => {
                    const selected = Boolean(day && day.date === selectedDate);
                    return (
                      <button
                        key={day?.date || `${weekIndex}-${dayIndex}`}
                        type="button"
                        disabled={!day || day.count === 0}
                        title={day && day.count > 0 ? `${formatDate(day.date)}: ${day.count} submissions, ${day.studyTimeMinutes} min tracked, ${day.accuracy}% accuracy` : ""}
                        aria-label={day ? `${formatDate(day.date)}: ${day.count} submissions` : "Outside selected year"}
                        onClick={() => day?.count && setSelectedDate(day.date)}
                        className={`relative z-10 h-[13px] w-[13px] rounded-[2px] border transition disabled:cursor-default ${
                          selected
                            ? "border-[#10213f] ring-2 ring-[#0b6fe8]/25"
                            : day?.count
                              ? "border-white/80 hover:border-[#0b6fe8] hover:ring-2 hover:ring-[#1976d2]/20"
                              : "border-white/80"
                        }`}
                        style={{
                          background: day ? colorFor(day.count) : "transparent",
                          gridColumn: weekIndex + 1,
                          gridRow: dayIndex + 1,
                        }}
                      />
                    );
                  })
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-3 text-xs text-[#64748b] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="h-3 w-3 rounded-[3px] border border-white"
                style={{ background: level === 0 ? colorFor(0) : colorFor(Math.max(1, Math.ceil((maxCount || 4) * (level / 4)))) }}
              />
            ))}
            <span>More</span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#94a3b8]">
            One cell = one local calendar day
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="border border-[#e4e7ec] bg-[#fcfdff] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Active day detail
              </p>
              <h3 className="mt-1 text-sm font-bold text-[#10213f]">
                {selectedDay ? formatDate(selectedDay.date) : "No active day selected"}
              </h3>
            </div>
            <span className="w-fit border border-[#dbe4ee] bg-white px-2 py-1 font-mono text-[10px] font-semibold text-[#475569]">
              {selectedDay?.count ?? 0} submissions
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              [selectedDay?.count ?? 0, "Attempts"],
              [`${selectedDay?.accuracy ?? 0}%`, "Accuracy"],
              [selectedDay?.studyTimeMinutes ?? 0, "Minutes"],
            ].map(([value, label]) => (
              <div key={label} className="border border-[#e4e7ec] bg-white px-2 py-2.5">
                <div className="font-mono text-sm font-semibold text-[#10213f]">{value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-[#64748b]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#e4e7ec] bg-[#fcfdff] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Active days only
              </p>
              <h3 className="mt-1 text-sm font-bold text-[#10213f]">Recent activity days</h3>
            </div>
            <span className="text-xs font-medium text-[#64748b]">{activeDays} active days</span>
          </div>

          {activeDayRows.length === 0 ? (
            <div className="mt-4 border border-dashed border-[#dbe4ee] bg-white px-3 py-4 text-sm text-[#64748b]">
              No active days in this view yet.
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {activeDayRows.slice(0, 6).map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex items-center justify-between gap-3 border px-3 py-2 text-left text-xs transition ${
                    selectedDate === day.date
                      ? "border-[#bfdbfe] bg-[#eff6ff]"
                      : "border-[#e4e7ec] bg-white hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
                  }`}
                >
                  <span className="font-medium text-[#10213f]">{formatDate(day.date)}</span>
                  <span className="font-mono text-[#64748b]">{day.count} submits</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          [`${activeDays}`, "active days"],
          [`${totalSubmissions}`, "submissions"],
          [`${averageAccuracy}%`, "accuracy"],
          [`${stats.solvedLastMonth}`, "solved/month"],
          [`${stats.maxStreak}`, "max streak"],
          [bestDay.date ? `${bestDay.count}` : "0", "best day submits"],
        ].map(([value, meta]) => (
          <div key={`${value}-${meta}`} className="border border-[#e4e7ec] bg-[#f8fafc] px-3 py-2.5">
            <div className="font-mono text-sm font-semibold leading-none text-[#10213f]">{value}</div>
            <div className="mt-1.5 text-[11px] font-medium leading-4 text-[#64748b]">{meta}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [selectedActivityYear, setSelectedActivityYear] = useState(new Date().getFullYear());
  const [liveActivity, setLiveActivity] = useState<ActivityPayload | null>(null);
  const [activityUpdatedAt, setActivityUpdatedAt] = useState<Date | null>(null);

  const { data, loading, error } = useDashboardQuery(async () => {
    const [overview, streak, activity, contestPerformance] = await Promise.all([
      dashboardApi.overview(),
      dashboardApi.streakTracking(),
      dashboardApi.activity(selectedActivityYear),
      dashboardApi.contestPerformance(),
    ]);

    return { overview, streak, activity, contestPerformance };
  }, [selectedActivityYear]);

  useEffect(() => {
    if (!data) return undefined;
    setLiveActivity(data.activity);
    setActivityUpdatedAt(new Date());
    const refreshActivity = () => {
      dashboardApi.activity(selectedActivityYear).then((activity) => {
        setLiveActivity(activity);
        setActivityUpdatedAt(new Date());
      }).catch(() => {
        // Keep the latest successful heatmap snapshot.
      });
    };
    const timer = window.setInterval(() => {
      refreshActivity();
    }, 10000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshActivity();
    };
    window.addEventListener("focus", refreshActivity);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshActivity);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [selectedActivityYear, data]);

  const stats = (data?.overview.stats ?? {}) as {
    totalAttempted?: number;
    totalCorrect?: number;
    problemsSolved?: number;
    currentStreakDays?: number;
    rating?: number;
    problemSolvedByDifficulty?: DifficultySlice[];
  };

  const contestRatingData = data?.contestPerformance.ratingData ?? [];
  const rating = Number(contestRatingData[contestRatingData.length - 1]?.rating ?? stats.rating ?? user?.rating ?? 0);
  const difficultySlices = (stats.problemSolvedByDifficulty?.length ? stats.problemSolvedByDifficulty : [
    { level: "Easy", solved: 0, total: 0, attempting: 0 },
    { level: "Medium", solved: 0, total: 0, attempting: 0 },
    { level: "Hard", solved: 0, total: 0, attempting: 0 },
  ]) as DifficultySlice[];

  const metrics: MetricCardData[] = [
    { label: "Total Attempted", value: String(stats.totalAttempted ?? 0), meta: "all tests", icon: BarChart3, tone: "bg-[#eaf4ff] text-[#1976d2]" },
    { label: "Correct", value: String(stats.totalCorrect ?? 0), meta: "answers", icon: CheckCircle2, tone: "bg-[#dcfce7] text-[#16a34a]" },
    { label: "Problems Solved", value: String(stats.problemsSolved ?? 0), meta: "unique", icon: BookOpen, tone: "bg-[#eaf4ff] text-[#1976d2]" },
    { label: "Current Streak", value: `${data?.streak.currentStreak ?? stats.currentStreakDays ?? 0}d`, meta: "days active", icon: Flame, tone: "bg-[#fff4e5] text-[#f97316]" },
    { label: "GATE DA Rating", value: String(rating), meta: "current rating", icon: Medal, tone: "bg-[#f3e8ff] text-[#9333ea]" },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonLoader rows={6} />
      </div>
    );
  }

  if (error || !data) {
    return <EmptyState title="Dashboard unavailable" description="The overview dashboard could not be loaded. Please retry after a moment." />;
  }

  const userName = user?.email?.split("@")[0] || user?.fullName?.toLowerCase().replace(/\s+/g, "_") || "student";
  const ratingData = data.contestPerformance.ratingData?.length
    ? data.contestPerformance.ratingData
    : [{ date: "No rated contest", label: "Start", rating, contestTitle: "Rating starts after your first rated contest" }];
  const activityPayload = liveActivity ?? data.activity;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(21rem,0.88fr)]">
        <ProfileCard
          userName={userName}
          rating={rating}
          fullName={user?.fullName}
          email={user?.email}
          institution={user?.institution}
          targetGateYear={user?.targetGateYear}
          joinedAt={user?.createdAt}
          avatarUrl={user?.avatarUrl}
        />
        <ProblemSolvedArc slices={difficultySlices} />
      </section>

      <RatingProgress data={ratingData} userName={userName} />
      <ActivityHeatmap
        days={activityPayload.activity ?? []}
        stats={activityPayload.stats ?? emptyActivityStats}
        year={activityPayload.year ?? selectedActivityYear}
        availableYears={activityPayload.availableYears ?? [selectedActivityYear]}
        onYearChange={setSelectedActivityYear}
        updatedAt={activityUpdatedAt}
        startDate={activityPayload.startDate}
        endDate={activityPayload.endDate}
      />
    </div>
  );
}
