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
      <div className="min-w-0 overflow-hidden">
        <div style={{ minWidth: `min(${minWidth}px, 100%)` }} className="h-full min-w-0">
          {children}
        </div>
      </div>
    </SectionCard>
  );
}
