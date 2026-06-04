import type { ReactNode } from "react";
import SectionCard from "./SectionCard";

interface ChartContainerProps {
  title: string;
  eyebrow?: string;
  minWidth?: number;
  children: ReactNode;
}

export default function ChartContainer({ title, eyebrow, minWidth = 680, children }: ChartContainerProps) {
  return (
    <SectionCard title={title} eyebrow={eyebrow}>
      <div className="dashboard-scrollbar overflow-x-auto">
        <div style={{ minWidth }} className="h-full">
          {children}
        </div>
      </div>
    </SectionCard>
  );
}
