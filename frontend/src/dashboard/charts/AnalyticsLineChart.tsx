import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AnalyticsLineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
}

export default function AnalyticsLineChart({ data, xKey, yKey }: AnalyticsLineChartProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey={xKey} stroke="#64748B" tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#10213F" }} />
          <Line type="monotone" dataKey={yKey} stroke="#0D6EFD" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
