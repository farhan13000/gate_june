import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Lightbulb,
  Trophy,
  Activity,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Subjects Progress", href: "/dashboard/subjects", icon: BookOpen },
  { label: "Tests & Contests", href: "/dashboard/contest-performance", icon: Trophy },
  { label: "Skills & Mastery", href: "/dashboard/skills", icon: Target },
  { label: "Problem Analytics", href: "/dashboard/problems", icon: Activity },
  { label: "Learning Intelligence", href: "/dashboard/learning-intelligence", icon: Lightbulb },
];

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`border-r border-border bg-card transition-all duration-300 flex flex-col hidden md:flex ${collapsed ? "w-20" : "w-64"}`}>
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && <span className="font-serif font-bold text-foreground truncate">Analytics</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mx-auto"
        >
          <ChevronRight size={16} className={`transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
