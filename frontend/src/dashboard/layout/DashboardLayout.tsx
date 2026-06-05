import { type ReactNode, useState } from "react";
import "../styles/dashboard.css";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopNav from "./DashboardTopNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-theme relative min-h-[calc(100vh-4rem)] overflow-hidden px-3 py-4 sm:px-5 lg:px-6">
      <div className="dashboard-canvas relative z-10 mx-auto flex max-w-[1600px] overflow-hidden">
        <DashboardSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="min-w-0 flex-1 bg-white">
          <DashboardTopNav onOpenMobile={() => setMobileOpen(true)} />
          <main className="dashboard-scrollbar min-h-[calc(100vh-9rem)] overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mx-auto max-w-[1500px] space-y-5">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
