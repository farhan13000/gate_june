import type { LucideIcon } from "lucide-react";
import AnimatedMetricCounter from "./AnimatedMetricCounter";

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  trend?: string;
  tone?: "accent" | "success" | "warning" | "danger";
  icon?: LucideIcon;
}

const toneClass = {
  accent: "text-[#0D6EFD]",
  success: "text-[#10B981]",
  warning: "text-[#F59E0B]",
  danger: "text-[#EF4444]",
};

export default function StatCard({ label, value, suffix, trend, tone = "accent", icon: Icon }: StatCardProps) {
  return (
    <div className="border border-[var(--dash-border)] bg-white p-4 shadow-sm transition duration-200 hover:border-[#bfdbfe] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--dash-muted)]">{label}</p>
          <div className="mt-2 flex items-end gap-1 font-mono text-2xl font-semibold text-[var(--dash-text)]">
            {typeof value === "number" ? <AnimatedMetricCounter value={value} /> : value}
            {suffix && <span className="pb-1 text-sm text-[var(--dash-muted)]">{suffix}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center border border-[#dbeafe] bg-[#EAF4FF] ${toneClass[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {trend && <p className={`mt-3 text-xs ${toneClass[tone]}`}>{trend}</p>}
    </div>
  );
}
