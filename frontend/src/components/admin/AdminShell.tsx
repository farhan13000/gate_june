import {
  LayoutDashboard,
  FolderTree,
  FileQuestion,
  BookOpen,
  Home,
  Users,
  PenLine,
  Database,
  Archive,
  BookOpenCheck,
  Trophy,
  CheckSquare,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminSectionId =
  | "Overview"
  | "Taxonomy Manager"
  | "Problem Manager"
  | "Theory Manager"
  | "Home Management"
  | "User Analytics"
  | "Content Management"
  | "Problem Bank"
  | "Content Inventory"
  | "Contest Factory"
  | "Contest Guide"
  | "Approval Dashboard"
  | "Platform Logs";

interface NavItem {
  id: AdminSectionId;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Dashboard",
    items: [{ id: "Overview", label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "Syllabus & Content",
    items: [
      { id: "Taxonomy Manager", label: "Taxonomy", icon: FolderTree },
      { id: "Problem Manager", label: "Add Problems", icon: FileQuestion },
      { id: "Theory Manager", label: "Add Theory", icon: BookOpen },
      { id: "Content Management", label: "Create / Bulk", icon: PenLine },
      { id: "Content Inventory", label: "Inventory", icon: Archive },
      { id: "Problem Bank", label: "Problem Bank", icon: Database },
      { id: "Approval Dashboard", label: "Approvals", icon: CheckSquare },
    ],
  },
  {
    title: "Platform",
    items: [
      { id: "Home Management", label: "Home & News", icon: Home },
      { id: "Contest Factory", label: "Contests", icon: Trophy },
      { id: "Contest Guide", label: "Contest Guide", icon: BookOpenCheck },
      { id: "User Analytics", label: "Users", icon: Users },
      { id: "Platform Logs", label: "Logs", icon: ScrollText },
    ],
  },
];

interface AdminShellProps {
  activeSection: AdminSectionId;
  onSectionChange: (section: AdminSectionId) => void;
  pendingCount?: number;
  children: React.ReactNode;
}

export function getAdminSectionTitle(section: AdminSectionId): string {
  if (section === "Overview") return "Platform Overview";
  return section;
}

export default function AdminShell({ activeSection, onSectionChange, pendingCount = 0, children }: AdminShellProps) {
  return (
    <div className="admin-shell">
      <aside className="admin-shell-sidebar">
        <div className="admin-shell-sidebar-head">
          <span className="text-[10px] uppercase tracking-[0.15em] font-mono text-muted-foreground">
            Admin
          </span>
          <span className="text-xs font-semibold text-foreground">Control Panel</span>
        </div>
        <nav className="admin-shell-nav" aria-label="Admin sections">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="admin-shell-nav-group">
              <div className="admin-shell-nav-group-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSectionChange(item.id)}
                    className={`admin-shell-nav-item ${active ? "admin-shell-nav-item-active" : ""}`}
                  >
                    <Icon size={14} className="shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                    {item.id === "Approval Dashboard" && pendingCount > 0 && (
                      <span className="admin-pending-dot ml-auto" title={`${pendingCount} pending approvals`}>
                        <span className="sr-only">{pendingCount} pending approvals</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="admin-shell-sidebar-foot">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded-sm font-mono text-[10px] font-bold">
            v1.0
          </span>
        </div>
      </aside>

      <div className="admin-shell-content">
        <header className="admin-shell-content-header">
          <h2 className="font-serif text-xl font-bold text-foreground">
            {getAdminSectionTitle(activeSection)}
          </h2>
        </header>
        <div className="admin-shell-content-body">{children}</div>
      </div>
    </div>
  );
}
