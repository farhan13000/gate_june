import { useEffect, useMemo, useRef, useState } from "react";
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
const heatmapCellGapPx = 3;
const heatmapCellMaxPx = 16;

const emptyActivityStats: HeatmapStats = {
  solvedAllTime: 0,
  solvedLastYear: 0,
  solvedLastMonth: 0,
  maxStreak: 0,
  streakLastYear: 0,
  streakLastMonth: 0,
};

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
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildYearHeatmapWeeks(days: HeatmapDay[]) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return [];

  const byDate = new Map(sorted.map((day) => [day.date, day]));
  const firstDate = new Date(`${sorted[0].date}T00:00:00`);
  const lastDate = new Date(`${sorted[sorted.length - 1].date}T00:00:00`);
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDate.getDay());
  const totalDays = Math.floor((lastDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const weekCount = Math.ceil(totalDays / 7);

  return Array.from({ length: weekCount }, (_, weekIndex) => (
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + weekIndex * 7 + dayIndex);
      if (date < firstDate || date > lastDate) return null;
      const dateKey = date.toISOString().split("T")[0];
      return byDate.get(dateKey) ?? {
        date: dateKey,
        count: 0,
        studyTimeMinutes: 0,
        accuracy: 0,
      };
    })
  ));
}

function buildMonthLabels(weeks: HeatmapCell[][]) {
  const labels: Array<{ label: string; week: number }> = [];
  weeks.forEach((week, weekIndex) => {
    week.forEach((day) => {
      if (!day) return;
      const date = new Date(`${day.date}T00:00:00`);
      const label = date.toLocaleDateString("en-US", { month: "short" });
      if ((date.getDate() === 1 || labels.length === 0) && labels[labels.length - 1]?.label !== label) {
        labels.push({ label, week: weekIndex });
      }
    });
  });
  return labels.filter((item, index) => {
    const next = labels[index + 1];
    if (!next) return true;
    return next.week - item.week >= 3;
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

  const activeSegment = active ? slices.find((item) => item.level === active) : null;

  return (
    <div className="flex h-full flex-col border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#10213f]">Problems Solved</h2>
        <span className="flex h-6 w-6 items-center justify-center border border-[#e4e7ec] text-[#94a3b8]">
          <Info size={13} />
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-4">
        <div className="relative flex min-h-[16.5rem] w-full items-center justify-center">
          <svg viewBox="0 0 320 270" className="h-full max-h-[17.5rem] w-full max-w-[22rem]" role="img" aria-label="Problems solved by difficulty">
            {segments.map((segment) => {
              const isActive = active === segment.level;
              return (
                <g
                  key={segment.level}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={() => setActive(segment.level)}
                  onMouseLeave={() => setActive(null)}
                  >
                  <path
                    d={describeArc(arcCenterX, arcCenterY, arcRadius, segment.segmentStart, segment.segmentEnd)}
                    fill="none"
                    stroke={segment.light}
                    strokeWidth={18}
                    strokeLinecap="round"
                    opacity={active && !isActive ? 0.42 : 1}
                  />
                  <path
                    d={describeArc(arcCenterX, arcCenterY, arcRadius, segment.segmentStart, segment.solvedEnd)}
                    fill="none"
                    stroke={segment.dark}
                    strokeWidth={18}
                    strokeLinecap="round"
                    opacity={active && !isActive ? 0.5 : 1}
                    className="dashboard-arc-draw"
                  />
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-[#111827]">
                {totalSolved}
                <span className="text-xs font-semibold text-[#475569]">/{totalProblems}</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-[#16a34a]">
                <CheckCircle2 size={13} />
                Solved
              </div>
              <div className="mt-5 text-xs font-medium text-[#64748b]">{totalAttempting} Attempting</div>
            </div>
          </div>

          {activeSegment && (
            <div className="absolute left-1/2 top-2 w-44 -translate-x-1/2 border border-[#e4e7ec] bg-white px-3 py-2 text-xs shadow-lg">
              <div className="font-semibold text-[#10213f]">{activeSegment.level}</div>
              <div className="mt-1 text-[#64748b]">{activeSegment.solved} solved of {activeSegment.total}</div>
              <div className="text-[#64748b]">{activeSegment.total ? Math.round((activeSegment.solved / activeSegment.total) * 100) : 0}% solved</div>
              <div className="text-[#64748b]">{activeSegment.attempting} attempting</div>
            </div>
          )}
        </div>

        <div className="grid w-full max-w-[24rem] grid-cols-3 gap-2">
          {slices.map((item) => {
            const visual = difficultyVisuals[item.level];
            return (
              <button
                type="button"
                key={item.level}
                onMouseEnter={() => setActive(item.level)}
                onMouseLeave={() => setActive(null)}
                className="border border-transparent bg-[#f8fafc] px-3 py-4 text-center transition hover:border-[#bfdbfe] hover:bg-white hover:shadow-sm"
              >
                <div className="text-xs font-bold" style={{ color: visual.dark }}>{item.level}</div>
                <div className="mt-2 font-mono text-sm font-bold text-[#10213f]">{item.solved}/{item.total}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
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

  return (
    <div className="border border-[#e2e8f0] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="border-b border-[#e2e8f0] bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#bfdbfe] bg-[#eaf4ff] text-[#0b6fe8]">
              <CircleUserRound size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#10213f]">Learner Profile</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#64748b]">Preparation identity and live progress</p>
            </div>
          </div>
          <button className="inline-flex shrink-0 items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-[#0b6fe8] transition hover:bg-[#eaf4ff]" aria-label="Edit profile">
            <Pencil size={16} />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </div>

      <div className="grid items-stretch gap-0 md:grid-cols-[minmax(12rem,0.42fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center border-b border-[#e2e8f0] bg-white p-5 text-center md:border-b-0 md:border-r">
          <div className="flex h-[6.4rem] w-[6.4rem] shrink-0 items-center justify-center overflow-hidden border border-[#e2e8f0] bg-[#f1f5f9] text-[#94a3b8] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
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
          <h3 className="mt-4 max-w-full truncate text-xl font-bold text-[#10213f]">{userName}</h3>
          <p className="mt-1 max-w-full truncate text-xs font-medium text-[#64748b]">{fullName || email || "GATE DA learner"}</p>
          <div className="mt-2 inline-flex border border-[#bfdbfe] bg-[#eaf4ff] px-2 py-1 text-[11px] font-bold text-[#0b6fe8]">
            Student
          </div>
          <div className="mt-5 w-full border-t border-[#e2e8f0] pt-4">
            <p className="text-xs font-semibold text-[#64748b]">Current Rating</p>
            <p className="font-mono text-4xl font-bold leading-tight text-[#0b6fe8]">{rating}</p>
            <p className="mt-1 text-[11px] font-medium text-[#64748b]">Keep practicing to improve!</p>
          </div>
        </div>

        <div className="flex min-w-0 p-4 sm:p-5">
          <div className="grid min-h-[18rem] w-full content-stretch border border-[#e2e8f0] bg-[#fcfdfd]">
            {profileItems.map(([label, value], index) => (
              <div
                key={label}
                className={`grid min-h-[3.4rem] grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition hover:bg-white sm:grid-cols-[9rem_minmax(0,1fr)] ${
                  index === 0 ? "" : "border-t border-[#e2e8f0]"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">{label}</span>
                <span className="min-w-0 break-words text-sm font-bold text-[#10213f]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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

function ActivityHeatmap({ days, stats, updatedAt }: { days: HeatmapDay[]; stats: HeatmapStats; updatedAt?: Date | null }) {
  const heatmapRef = useRef<HTMLDivElement | null>(null);
  const [heatmapWidth, setHeatmapWidth] = useState(900);
  const visibleDayCount = heatmapWidth < 520 ? 98 : heatmapWidth < 760 ? 182 : 371;
  const visibleDays = useMemo(() => days.slice(-visibleDayCount), [days, visibleDayCount]);
  const weeks = useMemo(() => buildYearHeatmapWeeks(visibleDays), [visibleDays]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);
  const currentYear = new Date().getFullYear();
  const dayLabelWidth = heatmapWidth < 520 ? 30 : chartAxisWidthPx;
  const dynamicGap = heatmapWidth < 520 ? 2 : heatmapCellGapPx;

  const colorFor = (count: number) => {
    if (count <= 0) return "bg-[#edf0f3]";
    if (count <= 1) return "bg-[#dff7e8]";
    if (count <= 3) return "bg-[#86e0a2]";
    return "bg-[#36bf68]";
  };

  useEffect(() => {
    if (!heatmapRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setHeatmapWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(heatmapRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#10213f]">Activity Heatmap</h2>
            <Info size={14} className="text-[#94a3b8]" />
          </div>
          <p className="mt-1 text-sm text-[#64748b]">Daily solving consistency from your live submission history.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[#64748b]">
          <span className="border border-[#dbe3ee] bg-[#f8fafc] px-2 py-1 font-semibold text-[#475569]">
            {visibleDayCount >= 371 ? currentYear : `${Math.round(visibleDayCount / 7)} weeks`}
          </span>
          <span className="border border-[#dbe3ee] bg-white px-2 py-1 font-medium">
            Updated {updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "live"}
          </span>
        </div>
      </div>

      <div ref={heatmapRef} className="mt-5 overflow-hidden border border-[#e4e7ec] bg-[#f8fafc] p-2 pb-3 sm:p-3 sm:pb-4">
        <div className="min-w-0">
          <div className="grid" style={{ gridTemplateColumns: `${dayLabelWidth}px minmax(0, 1fr)` }}>
            <div />
            <div className="relative h-6 text-[12px] font-semibold text-[#334155]">
              {monthLabels.map((item) => (
                <span
                  key={`${item.label}-${item.week}`}
                  className="absolute top-0 whitespace-nowrap"
                  style={{ left: `${weeks.length ? (item.week / weeks.length) * 100 : 0}%` }}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-1 grid" style={{ gridTemplateColumns: `${dayLabelWidth}px minmax(0, 1fr)` }}>
            <div
              className="grid pr-2 text-right text-[11px] font-medium text-[#64748b] sm:pr-3 sm:text-[12px]"
              style={{
                gridTemplateRows: "repeat(7, minmax(12px, 1fr))",
                rowGap: dynamicGap,
              }}
            >
              <span />
              <span className="leading-none">Mon</span>
              <span />
              <span className="leading-none">Wed</span>
              <span />
              <span className="leading-none">Fri</span>
              <span />
            </div>
            <div
              className="grid min-w-0 justify-stretch"
              style={{
                gridTemplateColumns: `repeat(${Math.max(weeks.length, 1)}, minmax(0, 1fr))`,
                gridTemplateRows: "repeat(7, auto)",
                columnGap: dynamicGap,
                rowGap: dynamicGap,
              }}
            >
              {weeks.map((week, weekIndex) => (
                week.map((day, dayIndex) => day ? (
                    <div
                      key={`${day.date}-${dayIndex}`}
                      title={`${formatDate(day.date)}: ${day.count} solved, ${day.studyTimeMinutes} min, ${day.accuracy}% accuracy`}
                      className={`border border-white transition hover:scale-125 hover:ring-2 hover:ring-[#1976d2]/20 ${colorFor(day.count)}`}
                      style={{
                        alignSelf: "center",
                        aspectRatio: "1 / 1",
                        gridColumn: weekIndex + 1,
                        gridRow: dayIndex + 1,
                        justifySelf: "center",
                        maxWidth: heatmapWidth < 520 ? 18 : heatmapCellMaxPx,
                        width: "100%",
                      }}
                    />
                  ) : (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="bg-transparent"
                      style={{
                        alignSelf: "center",
                        aspectRatio: "1 / 1",
                        gridColumn: weekIndex + 1,
                        gridRow: dayIndex + 1,
                        justifySelf: "center",
                        maxWidth: heatmapWidth < 520 ? 18 : heatmapCellMaxPx,
                        width: "100%",
                      }}
                    />
                  ))
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [`${stats.solvedAllTime} problems`, "solved for all time"],
          [`${stats.solvedLastYear} problems`, "solved for the last year"],
          [`${stats.solvedLastMonth} ${stats.solvedLastMonth === 1 ? "problem" : "problems"}`, "solved for the last month"],
          [`${stats.maxStreak} days`, "in a row max."],
          [`${stats.streakLastYear} ${stats.streakLastYear === 1 ? "day" : "days"}`, "in a row for the last year"],
          [`${stats.streakLastMonth} ${stats.streakLastMonth === 1 ? "day" : "days"}`, "in a row for the last month"],
        ].map(([value, meta]) => (
          <div key={`${value}-${meta}`} className="border border-[#e4e7ec] bg-[#f8fafc] px-3 py-3">
            <div className="font-mono text-xl font-bold leading-none text-[#10213f]">{value}</div>
            <div className="mt-1.5 text-xs font-medium leading-5 text-[#64748b]">{meta}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [liveActivity, setLiveActivity] = useState<{
    activity: HeatmapDay[];
    stats: HeatmapStats;
  } | null>(null);
  const [activityUpdatedAt, setActivityUpdatedAt] = useState<Date | null>(null);

  const { data, loading, error } = useDashboardQuery(async () => {
    const [overview, streak, activity, contestPerformance] = await Promise.all([
      dashboardApi.overview(),
      dashboardApi.streakTracking(),
      dashboardApi.activity(),
      dashboardApi.contestPerformance(),
    ]);

    return { overview, streak, activity, contestPerformance };
  }, []);

  useEffect(() => {
    if (!data) return undefined;
    setLiveActivity(data.activity);
    setActivityUpdatedAt(new Date());
    const refreshActivity = () => {
      dashboardApi.activity().then((activity) => {
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
  }, [data]);

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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
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
      <ActivityHeatmap days={activityPayload.activity ?? []} stats={activityPayload.stats ?? emptyActivityStats} updatedAt={activityUpdatedAt} />
    </div>
  );
}
