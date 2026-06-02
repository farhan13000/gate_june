import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  className?: string;
}

export default function MetricCard({ title, value, subtitle, icon, trend, className = "" }: MetricCardProps) {
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-none p-5 shadow-sm transition-shadow ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
        {icon && <div className="text-[#2563eb]">{icon}</div>}
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold font-mono text-[#0f172a]">{value}</div>
        
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend.positive ? "text-[#15803d] bg-[#f0fdf4] px-1.5 py-0.5" : "text-[#dc2626] bg-[#fef2f2] px-1.5 py-0.5"}`}>
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {subtitle && (
              <span className="text-[10px] uppercase font-semibold tracking-wide text-[#64748b] truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
