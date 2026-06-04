import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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

export const SubjectTimeBars = memo(function SubjectTimeBars({ data }: { data: Array<{ subject: string; averageTime: number; timeShare: number }> }) {
  return (
    <div className="h-72 min-w-[620px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 42 }}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" horizontal={false} />
          <XAxis type="number" {...axis} />
          <YAxis type="category" dataKey="subject" width={132} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="averageTime" fill="#0D6EFD" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const PacingGraph = memo(function PacingGraph({ data }: { data: Array<{ bucket: string; attempts: number; accuracy: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="bucket" {...axis} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="attempts" fill="#EAF4FF" stroke="#0D6EFD" radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="accuracy" stroke="#0D6EFD" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

export const EfficiencyRadar = memo(function EfficiencyRadar({ data }: { data: Array<{ subject: string; accuracy: number; hesitationScore: number; timeShare: number }> }) {
  const radar = data.map((item) => ({
    subject: item.subject,
    efficiency: Math.max(0, Math.round(item.accuracy * 0.55 + (100 - item.hesitationScore) * 0.3 + (100 - item.timeShare) * 0.15)),
  }));
  return (
    <div className="h-72 min-w-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radar}>
          <PolarGrid stroke="rgba(13,110,253,0.12)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#4B5563", fontSize: 11 }} />
          <Radar dataKey="efficiency" stroke="#0D6EFD" fill="#EAF4FF" fillOpacity={0.68} />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const TimeAccuracyMap = memo(function TimeAccuracyMap({ data }: { data: Array<{ topic: string; time: number; accuracy: number; hesitation: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" />
          <XAxis dataKey="time" name="Time" {...axis} />
          <YAxis dataKey="accuracy" name="Accuracy" domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Scatter data={data} fill="#0D6EFD" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});

export const SessionTimeline = memo(function SessionTimeline({ data }: { data: Array<{ date: string; minutes: number; efficiency: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="date" {...axis} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="minutes" stroke="#0D6EFD" fill="#EAF4FF" />
          <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export const TimeDistributionCurve = memo(function TimeDistributionCurve({ data }: { data: Array<{ bucket: string; count: number; accuracy: number }> }) {
  return (
    <div className="h-64 min-w-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="bucket" {...axis} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="#BFDBFE" radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="accuracy" stroke="#0D6EFD" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
