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
  ZAxis,
} from "recharts";

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  color: "#10213F",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
};

const axis = { stroke: "#94A3B8", tickLine: false, axisLine: false, fontSize: 11 };

function heatColor(value: number) {
  if (value >= 76) return "rgba(245,158,11,0.54)";
  if (value >= 61) return "rgba(13,110,253,0.34)";
  if (value >= 44) return "rgba(13,110,253,0.2)";
  return "rgba(148,163,184,0.16)";
}

export const TopicRiskMatrix = memo(function TopicRiskMatrix({
  data,
}: {
  data: Array<{ topic: string; subject: string; weakness: number; confidence: number; time: number; decay: number; severity: string }>;
}) {
  return (
    <div className="grid min-w-[720px] gap-2">
      <div className="grid grid-cols-[13rem_repeat(4,1fr)] gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
        <span>Concept</span>
        <span>Weakness</span>
        <span>Confidence</span>
        <span>Time</span>
        <span>Decay</span>
      </div>
      {data.map((item) => (
        <div key={item.topic} className="grid grid-cols-[13rem_repeat(4,1fr)] items-center gap-2 text-xs">
          <div className="truncate border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
            <p className="truncate font-semibold text-[#10213F]">{item.topic}</p>
            <p className="truncate text-[11px] text-[#64748B]">{item.subject} / {item.severity}</p>
          </div>
          {[item.weakness, item.confidence, Math.min(100, Math.round(item.time / 3)), item.decay].map((value, index) => (
            <div key={index} className="h-10 border border-[#E5E7EB]" style={{ backgroundColor: index === 1 ? `rgba(16,185,129,${0.08 + value / 180})` : heatColor(value) }}>
              <span className="flex h-full items-center justify-center font-mono text-[#10213F]">{value}{index === 2 ? "s" : "%"}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export const ErrorFrequencyChart = memo(function ErrorFrequencyChart({ data }: { data: Array<{ type: string; count: number }> }) {
  return (
    <div className="h-64 min-w-[540px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 42 }}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" horizontal={false} />
          <XAxis type="number" {...axis} />
          <YAxis type="category" dataKey="type" width={130} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="#0D6EFD" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const ErrorClusterScatter = memo(function ErrorClusterScatter({ data }: { data: Array<{ topic: string; errors: number; repeatedErrors: number; weakness: number; time: number }> }) {
  return (
    <div className="h-72 min-w-[620px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" />
          <XAxis type="number" dataKey="errors" name="Errors" {...axis} />
          <YAxis type="number" dataKey="time" name="Time" {...axis} />
          <ZAxis type="number" dataKey="weakness" range={[80, 420]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
          <Scatter data={data} fill="#0D6EFD">
            {data.map((item) => (
              <Cell key={item.topic} fill={item.weakness > 70 ? "#F59E0B" : "#0D6EFD"} fillOpacity={0.72} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});

export const ConceptStabilityGraph = memo(function ConceptStabilityGraph({
  data,
}: {
  data: Array<{ topic: string; stability: number; confidence: number; retention: number; week: string }>;
}) {
  return (
    <div className="h-64 min-w-[580px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="week" {...axis} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="stability" stroke="#0D6EFD" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="confidence" stroke="#10B981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="retention" stroke="#F59E0B" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export const ConfidenceCurve = memo(function ConfidenceCurve({ data }: { data: Array<{ phase: string; confidence: number; retention: number; instability: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="phase" {...axis} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="confidence" stroke="#0D6EFD" fill="#EAF4FF" />
          <Line type="monotone" dataKey="retention" stroke="#10B981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="instability" stroke="#F59E0B" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export const RevisionDecayChart = memo(function RevisionDecayChart({ data }: { data: Array<{ topic: string; decay: number; retention: number }> }) {
  return (
    <div className="h-72 min-w-[620px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 20 }}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="topic" {...axis} interval={0} angle={-18} textAnchor="end" height={70} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="decay" fill="#BFDBFE" radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="retention" stroke="#0D6EFD" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

export const AccuracyCollapseChart = memo(function AccuracyCollapseChart({ data }: { data: Array<{ topic: string; accuracy: number; instability: number; weaknessScore: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="topic" {...axis} interval={0} angle={-16} textAnchor="end" height={64} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="accuracy" fill="#0D6EFD" radius={[2, 2, 0, 0]} />
          <Bar dataKey="instability" fill="#F59E0B" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
