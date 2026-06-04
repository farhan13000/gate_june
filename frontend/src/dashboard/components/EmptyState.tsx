import type { LucideIcon } from "lucide-react";
import { Sigma } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export default function EmptyState({ title, description, icon: Icon = Sigma }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-[var(--dash-border-strong)] bg-[#F8FAFC] p-6 text-center">
      <Icon className="mx-auto text-[#0D6EFD]" size={26} />
      <h3 className="mt-3 text-sm font-semibold text-[var(--dash-text)]">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--dash-muted)]">{description}</p>
    </div>
  );
}
