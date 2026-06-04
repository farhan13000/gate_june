import type { ReactNode } from "react";

interface AnalyticsCardProps {
  title: string;
  value?: string | number;
  meta?: string;
  children?: ReactNode;
}

export default function AnalyticsCard({ title, value, meta, children }: AnalyticsCardProps) {
  return (
    <div className="border border-[var(--dash-border)] bg-white p-4 shadow-sm transition duration-200 hover:border-[#bfdbfe] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">{title}</h3>
          {meta && <p className="mt-1 text-xs text-[var(--dash-muted)]">{meta}</p>}
        </div>
        {value !== undefined && <div className="font-mono text-lg font-semibold text-[#0D6EFD]">{value}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
