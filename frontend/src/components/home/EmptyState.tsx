import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; to: string };
  /** Compact row layout — fits sidebar announcement panels */
  variant?: "panel" | "compact";
  /** Short preview lines shown as muted checklist (compact variant) */
  hints?: string[];
  statusLabel?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "panel",
  hints = [],
  statusLabel = "Up to date",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className="rounded-none border border-[#e2e8f0] bg-[#fafbfc]">
        <div className="flex items-stretch gap-0 border-b border-[#e2e8f0] bg-[#f8fbff] px-4 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-white border border-[#e2e8f0] text-[#2563eb]">
            <Icon size={14} />
          </div>
          <div className="ml-3 flex min-w-0 flex-1 items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#0f172a]">{title}</p>
            <span className="shrink-0 rounded-none border border-[#d1fae5] bg-[#ecfdf5] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#059669]">
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11px] leading-relaxed text-[#64748b]">{description}</p>
          {hints.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-[#eef2f6] pt-3">
              {hints.map((hint) => (
                <li key={hint} className="flex items-start gap-2 text-[10px] text-[#94a3b8]">
                  <span className="mt-[5px] h-1 w-1 shrink-0 bg-[#cbd5e1]" aria-hidden />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          )}
          {action && (
            <Link
              to={action.to}
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563eb] hover:underline"
            >
              {action.label}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-none border border-[#e2e8f0] bg-[#fafbfc] overflow-hidden">
      <div className="border-b border-[#e2e8f0] bg-[#f8fbff] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-[#e2e8f0] bg-white text-[#2563eb]">
            <Icon size={22} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
            <p className="mt-0.5 text-[11px] text-[#64748b]">{description}</p>
          </div>
        </div>
      </div>
      {hints.length > 0 && (
        <div className="px-5 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
            What appears here
          </p>
          <ul className="space-y-1.5">
            {hints.map((hint) => (
              <li key={hint} className="flex items-center gap-2 text-[11px] text-[#475569]">
                <span className="h-px w-3 shrink-0 bg-[#2563eb]" aria-hidden />
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}
      {action && (
        <div className="border-t border-[#e2e8f0] bg-white px-5 py-3">
          <Link
            to={action.to}
            className="inline-flex w-full items-center justify-center rounded-none border border-[#2563eb] bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}
