import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sigma, X } from "lucide-react";
import { dashboardNavigation } from "./dashboardNavigation";

interface DashboardSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export default function DashboardSidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: DashboardSidebarProps) {
  const { pathname } = useLocation();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[#10213F]/30 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full border-r border-[var(--dash-border)] bg-white transition-all duration-200 lg:sticky lg:top-0 lg:z-auto ${
          collapsed ? "lg:w-[5.25rem]" : "lg:w-72"
        } ${mobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-[var(--dash-border)] px-4">
            <Link to="/dashboard/overview" className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#bfdbfe] bg-[#EAF4FF] text-[#0b6fe8]">
                <Sigma size={18} />
              </div>
              {!collapsed && <span className="font-semibold tracking-wide text-[var(--dash-text)]">Analytics Lab</span>}
            </Link>
            <button className="lg:hidden text-[var(--dash-muted)]" onClick={onCloseMobile} aria-label="Close dashboard menu">
              <X size={20} />
            </button>
          </div>

          <nav className="dashboard-scrollbar flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-3 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
              {!collapsed ? "Modules" : "M"}
            </div>
            <div className="space-y-1">
              {dashboardNavigation.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    to={href}
                    onClick={onCloseMobile}
                    className={`group flex min-h-10 items-center gap-3 border px-3 text-sm transition ${
                      active
                        ? "border-[#bfdbfe] bg-[#EAF4FF] text-[#10213F]"
                        : "border-transparent text-[var(--dash-muted)] hover:border-[var(--dash-border)] hover:bg-[#F8FAFC] hover:text-[#10213F]"
                    }`}
                  >
                    <Icon size={17} className={active ? "text-[#0b6fe8]" : "text-[#64748B] group-hover:text-[#0b6fe8]"} />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {active && !collapsed && <span className="ml-auto h-6 w-0.5 bg-[#0b6fe8]" />}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden border-t border-[var(--dash-border)] p-3 lg:block">
            <button
              onClick={onToggleCollapse}
              className="flex w-full items-center justify-center gap-2 border border-[var(--dash-border)] bg-[#F8FAFC] px-3 py-2 text-xs text-[var(--dash-muted)] transition hover:border-[#bfdbfe] hover:text-[#10213F]"
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              {!collapsed && "Collapse"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
