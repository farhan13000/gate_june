import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
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

export const SubjectRadar = memo(function SubjectRadar({ data }: { data: Array<{ subject: string; mastery: number; confidenceScore: number; averageAccuracy: number }> }) {
  return (
    <div className="h-72 min-w-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(13,110,253,0.12)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#4B5563", fontSize: 11 }} />
          <Radar dataKey="mastery" stroke="#0D6EFD" fill="#EAF4FF" fillOpacity={0.65} />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const CompletionMatrix = memo(function CompletionMatrix({ data }: { data: Array<{ subject: string; syllabusCompletion: number; averageAccuracy: number; learningConsistency: number }> }) {
  return (
    <div className="grid min-w-[560px] gap-2">
      {data.map((item) => (
        <div key={item.subject} className="grid grid-cols-[10rem_repeat(3,1fr)] items-center gap-2 text-xs">
          <div className="truncate font-semibold text-[#10213F]">{item.subject}</div>
          {[item.syllabusCompletion, item.averageAccuracy, item.learningConsistency].map((value, index) => (
            <div key={index} className="h-8 border border-[#E5E7EB]" style={{ backgroundColor: `rgba(13,110,253,${0.08 + value / 160})` }}>
              <span className="flex h-full items-center justify-center font-mono text-[#10213F]">{value}%</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export const SubjectProgressTimeline = memo(function SubjectProgressTimeline({ data }: { data: Array<{ label: string; mastery: number; completion: number }> }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="completion" stroke="#93C5FD" fill="#EAF4FF" />
          <Line type="monotone" dataKey="mastery" stroke="#0D6EFD" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export const ChapterBarChart = memo(function ChapterBarChart({ data }: { data: Array<{ chapter: string; mastery: number; completion: number }> }) {
  return (
    <div className="h-72 min-w-[620px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(13,110,253,0.07)" vertical={false} />
          <XAxis dataKey="chapter" {...axis} />
          <YAxis domain={[0, 100]} {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="completion" fill="#BFDBFE" radius={[2, 2, 0, 0]} />
          <Bar dataKey="mastery" fill="#0D6EFD" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const DependencyGraph = memo(function DependencyGraph({ data }: { data: Array<{ source: string; target: string; strength: number }> }) {
  return (
    <div className="min-w-[620px] space-y-2">
      {data.map((edge, index) => (
        <div key={`${edge.source}-${edge.target}-${index}`} className="grid grid-cols-[1fr_5rem_1fr] items-center gap-3 text-xs">
          <div className="truncate border border-[#E5E7EB] bg-white px-3 py-2 text-[#10213F]">{edge.source}</div>
          <div className="relative h-px bg-[#BFDBFE]">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1 font-mono text-[#0D6EFD]">{edge.strength}</span>
          </div>
          <div className="truncate border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-[#10213F]">{edge.target}</div>
        </div>
      ))}
    </div>
  );
});
