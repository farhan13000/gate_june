import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  overview: "Overview",
  performance: "Performance",
  skills: "Skills",
  problems: "Problem Analytics",
  "learning-intelligence": "Learning Intelligence",
  subjects: "Subjects",
  "time-analysis": "Time Analysis",
  "weak-areas": "Weak Areas",
  recommendations: "Recommendations",
  "contest-performance": "Contest Performance",
  leaderboard: "Leaderboard",
};

export default function DashboardBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-[var(--dash-muted)]" aria-label="Breadcrumb">
      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join("/")}`;
        const isLast = index === parts.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={12} className="opacity-60" />}
            {isLast ? (
              <span className="text-[var(--dash-text)]">{labelMap[part] ?? part}</span>
            ) : (
              <Link to={href} className="hover:text-[#0b6fe8]">{labelMap[part] ?? part}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
