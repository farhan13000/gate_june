import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function SectionCard({ title, eyebrow, action, children }: SectionCardProps) {
  return (
    <section className="border border-[var(--dash-border)] bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-[var(--dash-border)] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow && <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0D6EFD]">{eyebrow}</p>}
          <h2 className="mt-1 text-base font-semibold text-[var(--dash-text)]">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
