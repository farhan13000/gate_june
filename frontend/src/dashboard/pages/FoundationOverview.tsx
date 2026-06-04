import { Activity, BarChart3, Target, Trophy } from "lucide-react";
import { EmptyState, HeatmapGrid, SectionCard, StatCard } from "../components";

const heatmap = Array.from({ length: 98 }).map((_, index) => ({
  date: `D-${98 - index}`,
  count: index % 9 === 0 ? 5 : index % 5,
}));

export default function FoundationOverview() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Accuracy" value={74} suffix="%" trend="+4.2% over recent attempts" icon={Target} />
        <StatCard label="Problems Solved" value={128} trend="Indexed by unique correct solves" icon={BarChart3} />
        <StatCard label="Contest Rating" value={1510} trend="Stable analytical baseline" icon={Trophy} />
        <StatCard label="Active Days" value={21} trend="Rolling 30-day consistency" icon={Activity} />
      </div>
      <SectionCard title="Activity Heatmap" eyebrow="Consistency">
        <HeatmapGrid data={heatmap} />
      </SectionCard>
      <EmptyState title="Analytics modules ready" description="Phase 1 foundation is ready for deeper aggregation, AI recommendations, and advanced charts." />
    </div>
  );
}
