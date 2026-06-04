import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
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

const axis = {
  stroke: "#94A3B8",
  tickLine: false,
  axisLine: false,
  fontSize: 11,
};

export const WeeklyActivityGraph = memo(function WeeklyActivityGraph({ data }: { data: Array<{ day: string; attempts: number; accuracy: number; hours: number }> }) {
  return (
    <div className="h-64 min-w-[620px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="day" {...axis} />
          <YAxis yAxisId="left" {...axis} />
          <YAxis yAxisId="right" orientation="right" {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar yAxisId="left" dataKey="attempts" fill="#EAF4FF" stroke="#0D6EFD" radius={[2, 2, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#0D6EFD" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

export const SubjectCompletionChart = memo(function SubjectCompletionChart({ data }: { data: Array<{ subject: string; completion: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} {...axis} />
          <YAxis type="category" dataKey="subject" width={112} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="completion" fill="#0D6EFD" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const AccuracySpeedChart = memo(function AccuracySpeedChart({ data }: { data: Array<{ day: string; accuracy: number; hours: number; attempts: number }> }) {
  const scatter = data.map((item) => ({
    speed: item.hours ? Math.round((item.attempts / item.hours) * 10) / 10 : item.attempts,
    accuracy: item.accuracy,
    day: item.day,
  }));

  return (
    <div className="h-64 min-w-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" />
          <XAxis dataKey="speed" name="Speed" {...axis} />
          <YAxis dataKey="accuracy" name="Accuracy" domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Scatter data={scatter} fill="#0D6EFD" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});

export const RecentPerformanceTrends = memo(function RecentPerformanceTrends({ data }: { data: Array<{ day: string; accuracy: number; attempts: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="day" {...axis} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="accuracy" stroke="#0D6EFD" fill="#EAF4FF" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export const ContestSnapshotChart = memo(function ContestSnapshotChart({ data }: { data: Array<{ label: string; score: number; solved: number }> }) {
  return (
    <div className="h-64 min-w-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="score" radius={[2, 2, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index === 0 ? "#0D6EFD" : "#93C5FD"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
