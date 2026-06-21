import FeatureLocked from "@/dashboard/components/FeatureLocked";

export function AccuracyBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = value >= 75 ? "#0D6EFD" : value >= 55 ? "#F59E0B" : "#EF4444";

  return (
    <div className="h-1.5 w-full overflow-hidden bg-[#E5E7EB]">
      <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function PerformanceAnalytics() {
  return (
    <div className="min-w-0 space-y-5">
      <FeatureLocked
        title="Performance Analytics"
        description="Performance analytics are currently being prepared. Check back soon for accuracy insights, difficulty pressure analysis, and subject balance recommendations."
      />
    </div>
  );
}
