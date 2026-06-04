interface ProgressBarProps {
  value: number;
  label?: string;
  tone?: "accent" | "success" | "warning" | "danger";
}

const toneClass = {
  accent: "bg-[#0D6EFD]",
  success: "bg-[#10B981]",
  warning: "bg-[#F59E0B]",
  danger: "bg-[#EF4444]",
};

export default function ProgressBar({ value, label, tone = "accent" }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-[var(--dash-muted)]">{label}</span>
          <span className="font-mono text-[var(--dash-text)]">{normalized}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden bg-[#E5E7EB]">
        <div className={`h-full ${toneClass[tone]} transition-all duration-500`} style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
