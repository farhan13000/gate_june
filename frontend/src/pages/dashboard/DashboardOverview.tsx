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
};

type HeatmapCell = HeatmapDay | null;

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
    <div className="border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#10213f]">Problems Solved</h2>
        <span className="flex h-6 w-6 items-center justify-center border border-[#e4e7ec] text-[#94a3b8]">
          <Info size={13} />
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(14rem,1fr)_8rem] lg:items-center">
        <div className="relative min-h-[13rem]">
          <svg viewBox="0 0 300 230" className="mx-auto h-full max-h-[14rem] w-full max-w-[19rem]" role="img" aria-label="Problems solved by difficulty">
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
                    d={describeArc(150, 130, 78, segment.segmentStart, segment.segmentEnd)}
                    fill="none"
                    stroke={segment.light}
                    strokeWidth={14}
                    strokeLinecap="round"
                    opacity={active && !isActive ? 0.42 : 1}
                  />
                  <path
                    d={describeArc(150, 130, 78, segment.segmentStart, segment.solvedEnd)}
                    fill="none"
                    stroke={segment.dark}
                    strokeWidth={14}
                    strokeLinecap="round"
                    opacity={active && !isActive ? 0.5 : 1}
                    className="dashboard-arc-draw"
                  />
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-3">
            <div className="text-center">
              <div className="font-mono text-2xl font-bold text-[#111827]">
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
            <div className="absolute left-1/2 top-0 w-44 -translate-x-1/2 border border-[#e4e7ec] bg-white px-3 py-2 text-xs shadow-lg">
              <div className="font-semibold text-[#10213f]">{activeSegment.level}</div>
              <div className="mt-1 text-[#64748b]">{activeSegment.solved} solved of {activeSegment.total}</div>
              <div className="text-[#64748b]">{activeSegment.total ? Math.round((activeSegment.solved / activeSegment.total) * 100) : 0}% solved</div>
              <div className="text-[#64748b]">{activeSegment.attempting} attempting</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
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
  authProvider,
  avatarUrl,
}: {
  userName: string;
  rating: number;
  fullName?: string;
  email?: string;
  institution?: string;
  targetGateYear?: number;
  joinedAt?: string;
  authProvider?: string;
  avatarUrl?: string;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const memberSince = joinedAt
    ? new Date(joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";
  const infoGroups = [
    {
      title: "Identity",
      rows: [
        ["Name", fullName || "Student"],
        ["Email", email || "Not linked"],
        ["Role", "Student"],
      ],
    },
    {
      title: "Preparation",
      rows: [
        ["Target", targetGateYear ? `GATE DA ${targetGateYear}` : "GATE DA"],
        ["Institution", institution || "Not specified"],
        ["Track", "Data Science & AI"],
      ],
    },
    {
      title: "Account",
      rows: [
        ["Member Since", memberSince],
        ["Auth", authProvider ? authProvider.replace(/\b\w/g, (char) => char.toUpperCase()) : "Local"],
        ["Presence", "Online now"],
      ],
    },
  ];

  return (
    <div className="border border-[#e4e7ec] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="border-b border-[#e4e7ec] bg-[#f8fbff] px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1976d2]">Learner profile</p>
            <h2 className="mt-1 text-base font-bold text-[#10213f]">Preparation identity and live progress</h2>
          </div>
          <button className="shrink-0 p-2 text-[#94a3b8] transition hover:bg-white hover:text-[#1976d2]" aria-label="Edit profile">
            <Pencil size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 2xl:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1fr)] 2xl:items-stretch">
        <div className="flex min-w-0 gap-4 border border-[#e4e7ec] bg-white p-4">
          <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center border border-[#e4e7ec] bg-[#f1f5f9] text-[#94a3b8] sm:h-20 sm:w-20">
            {avatarUrl && !avatarFailed ? (
              <img
                src={avatarUrl}
                alt={fullName || userName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <CircleUserRound size={58} strokeWidth={1.4} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-[#10213f]">{userName}</h3>
            <p className="mt-1 truncate text-xs text-[#64748b]">{fullName || email || "GATE DA learner"}</p>
            <div className="mt-3 inline-flex border border-[#bfdbfe] bg-[#eaf4ff] px-2 py-1 text-[11px] font-bold text-[#1976d2]">
              Student
            </div>
            <div className="mt-4 border-t border-[#e4e7ec] pt-3">
              <p className="text-xs font-semibold text-[#1976d2]">Current Rating</p>
              <p className="font-mono text-3xl font-bold leading-tight text-[#1976d2]">{rating}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border border-[#e4e7ec] md:grid-cols-3">
          {infoGroups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? "border-t border-[#e4e7ec] md:border-l md:border-t-0" : ""}>
              <div className="border-b border-[#e4e7ec] bg-[#f8fafc] px-3 py-2">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1976d2]">{group.title}</div>
              </div>
              <div className="divide-y divide-[#e4e7ec]">
                {group.rows.map(([label, value]) => (
                  <div key={`${group.title}-${label}`} className="min-w-0 px-3 py-2.5">
                    <div className="text-[11px] font-semibold text-[#64748b]">{label}</div>
                    <div className="mt-1 min-w-0 break-words text-xs font-bold leading-5 text-[#10213f]" title={value}>
                      {label === "Presence" && <span className="mr-1 inline-block h-2 w-2 bg-[#16a34a]" />}
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

function RatingProgress({ data, userName }: { data: Array<{ date: string; rating: number }>; userName: string }) {
  const ratings = data.map((item) => item.rating);
  const maxRating = Math.max(2000, ...ratings, 1200);
  const minRating = Math.min(900, ...ratings, 1200);
  const yMin = Math.max(0, Math.floor((minRating - 120) / 100) * 100);
  const yMax = Math.ceil((maxRating + 120) / 100) * 100;
  const currentRating = ratings[ratings.length - 1] ?? 0;

  return (
    <section className="border border-[#e4e7ec] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#10213f]">Rating Progress</h2>
        <select className="border border-[#e4e7ec] bg-white px-3 py-2 text-xs font-semibold text-[#475569] outline-none transition focus:border-[#1976d2]">
          <option>Only rated</option>
          <option>All contests</option>
        </select>
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
                dataKey="date"
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

function ActivityHeatmap({ days, stats }: { days: HeatmapDay[]; stats: HeatmapStats }) {
  const weeks = useMemo(() => buildYearHeatmapWeeks(days), [days]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);
  const currentYear = new Date().getFullYear();

  const colorFor = (count: number) => {
    if (count <= 0) return "bg-[#edf0f3]";
    if (count <= 1) return "bg-[#dff7e8]";
    if (count <= 3) return "bg-[#86e0a2]";
    return "bg-[#36bf68]";
  };

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
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
          <span>What activity will be shown to other users:</span>
          <select className="border border-[#64748b] bg-white px-2 py-0.5 text-xs text-[#10213f]">
            <option>All</option>
          </select>
          <select className="border border-[#64748b] bg-white px-2 py-0.5 text-xs text-[#10213f]">
            <option>{currentYear}</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto border border-[#e4e7ec] bg-[#f8fafc] p-3 pb-4">
        <div className="min-w-[58rem]">
          <div className="grid" style={{ gridTemplateColumns: `${chartAxisWidthPx}px minmax(0, 1fr)` }}>
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
          <div className="mt-1 grid" style={{ gridTemplateColumns: `${chartAxisWidthPx}px minmax(0, 1fr)` }}>
            <div
              className="grid pr-3 text-right text-[12px] font-medium text-[#64748b]"
              style={{
                gridTemplateRows: "repeat(7, minmax(12px, 1fr))",
                rowGap: heatmapCellGapPx,
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
              className="grid justify-stretch"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, minmax(10px, 1fr))`,
                gridTemplateRows: "repeat(7, auto)",
                columnGap: heatmapCellGapPx,
                rowGap: heatmapCellGapPx,
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
                        maxWidth: heatmapCellMaxPx,
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
                        maxWidth: heatmapCellMaxPx,
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
    const timer = window.setInterval(() => {
      dashboardApi.activity().then(setLiveActivity).catch(() => {
        // Keep the latest successful heatmap snapshot.
      });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [data]);

  const stats = (data?.overview.stats ?? {}) as {
    totalAttempted?: number;
    totalCorrect?: number;
    problemsSolved?: number;
    currentStreakDays?: number;
    rating?: number;
    problemSolvedByDifficulty?: DifficultySlice[];
  };

  const rating = Number(user?.rating || stats.rating || 0);
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
    : [{ date: "Now", rating }];
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
          authProvider={user?.authProvider}
          avatarUrl={user?.avatarUrl}
        />
        <ProblemSolvedArc slices={difficultySlices} />
      </section>

      <RatingProgress data={ratingData} userName={userName} />
      <ActivityHeatmap days={activityPayload.activity ?? []} stats={activityPayload.stats ?? emptyActivityStats} />
    </div>
  );
}
