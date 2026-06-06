import { Menu, Search, UserCircle } from "lucide-react";
import DashboardBreadcrumbs from "./DashboardBreadcrumbs";

interface DashboardTopNavProps {
  onOpenMobile: () => void;
}

export default function DashboardTopNav({ onOpenMobile }: DashboardTopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--dash-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-full items-center gap-4 px-4 sm:px-5 lg:px-6">
        <button
          className="inline-flex h-10 w-10 items-center justify-center border border-[var(--dash-border)] text-[var(--dash-muted)] transition hover:border-[#bfdbfe] hover:bg-[#EAF4FF] hover:text-[#0b6fe8] lg:hidden"
          onClick={onOpenMobile}
          aria-label="Open dashboard menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <DashboardBreadcrumbs />
          <div className="mt-1 hidden text-xs text-[var(--dash-muted)] sm:block">Mathematical performance intelligence for GATE DA preparation</div>
        </div>
        <div className="hidden min-w-[18rem] items-center gap-2 border border-[var(--dash-border)] bg-[#F8FAFC] px-3 py-2 text-[var(--dash-muted)] md:flex">
          <Search size={15} />
          <span className="text-xs">Search analytics, topics, contests</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center border border-[#bfdbfe] bg-[#EAF4FF] text-[#0b6fe8]">
          <UserCircle size={20} />
        </div>
      </div>
    </header>
  );
}
