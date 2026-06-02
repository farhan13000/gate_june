import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-none shadow-sm p-5 flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-[#0f172a] text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        {children}
      </div>
    </div>
  );
}
