import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  color: "#10213F",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
};

const axis = { stroke: "#94A3B8", tickLine: false, axisLine: false, fontSize: 11 };

export const SkillRadarChart = memo(function SkillRadarChart({ data }: { data: Array<{ skill: string; score: number; peerAverage: number; topPerformer: number }> }) {
  return (
    <div className="h-72 min-w-0 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(13,110,253,0.12)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#4B5563", fontSize: 10 }} />
          <Radar name="You" dataKey="score" stroke="#0D6EFD" fill="#EAF4FF" fillOpacity={0.68} />
          <Radar name="Peer" dataKey="peerAverage" stroke="#94A3B8" fill="transparent" />
          <Radar name="Top" dataKey="topPerformer" stroke="#10B981" fill="transparent" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const PeerComparisonBars = memo(function PeerComparisonBars({ data }: { data: Array<{ cohort: string; value: number }> }) {
  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="cohort" {...axis} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill="#0D6EFD" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const SkillProgressTimeline = memo(function SkillProgressTimeline({ data }: { data: Array<{ phase: string; profileScore: number; consistency: number; contestHandling: number }> }) {
  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="phase" {...axis} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="profileScore" stroke="#0D6EFD" fill="#EAF4FF" />
          <Line type="monotone" dataKey="consistency" stroke="#10B981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="contestHandling" stroke="#F59E0B" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export const StrengthDistributionChart = memo(function StrengthDistributionChart({ data }: { data: Array<{ skill: string; score: number; forecast: number }> }) {
  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} {...axis} />
          <YAxis type="category" dataKey="skill" width={112} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="score" fill="#0D6EFD" radius={[0, 2, 2, 0]} />
          <Bar dataKey="forecast" fill="#BFDBFE" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const PercentileSkillMap = memo(function PercentileSkillMap({ data }: { data: Array<{ label: string; score: number; percentile: number; weight: number }> }) {
  return (
    <div className="grid min-w-0 gap-2">
      {data.map((item) => (
        <div key={item.label} className="grid min-w-0 grid-cols-3 items-center gap-2 text-xs sm:grid-cols-[minmax(8rem,11rem)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-3 truncate font-semibold text-[#10213F] sm:col-span-1">{item.label}</div>
          {[item.score, item.percentile, item.weight].map((value, index) => (
            <div key={index} className="h-8 border border-[#E5E7EB]" style={{ backgroundColor: `rgba(13,110,253,${0.08 + value / 165})` }}>
              <span className="flex h-full items-center justify-center font-mono text-[#10213F]">{value}%</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export const SkillQuadrantMap = memo(function SkillQuadrantMap({
  data,
}: {
  data: Array<{ skill: string; score: number; percentile: number; adaptiveWeight: number }>;
}) {
  const points = data.map((item) => ({
    ...item,
    size: Math.max(44, item.adaptiveWeight),
  }));

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 18, right: 24, bottom: 18, left: 8 }}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" />
          <XAxis dataKey="percentile" name="Percentile" domain={[0, 100]} {...axis} />
          <YAxis dataKey="score" name="Score" domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine x={60} stroke="#94A3B8" strokeDasharray="4 4" />
          <ReferenceLine y={70} stroke="#94A3B8" strokeDasharray="4 4" />
          <Scatter name="Skills" data={points} fill="#0D6EFD" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});

export const TopGapLadder = memo(function TopGapLadder({
  data,
}: {
  data: Array<{ skill: string; score: number; topPerformer: number }>;
}) {
  const gaps = data
    .map((item) => ({
      skill: item.skill,
      gap: Math.max(0, item.topPerformer - item.score),
    }))
    .sort((a, b) => b.gap - a.gap);

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={gaps} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} {...axis} />
          <YAxis type="category" dataKey="skill" width={112} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="gap" radius={[0, 2, 2, 0]}>
            {gaps.map((item) => (
              <Cell key={item.skill} fill={item.gap >= 30 ? "#EF4444" : item.gap >= 18 ? "#F59E0B" : "#0D6EFD"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
