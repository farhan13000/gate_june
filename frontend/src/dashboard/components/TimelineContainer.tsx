import type { ReactNode } from "react";

export default function TimelineContainer({ children }: { children: ReactNode }) {
  return <div className="space-y-3 border-l border-[#D1D5DB] pl-4">{children}</div>;
}
