import { ReactNode } from "react";
import HierarchySidebar from "./HierarchySidebar";
import HierarchyBreadcrumbs from "./HierarchyBreadcrumbs";
import HierarchyStatsPanel from "./HierarchyStatsPanel";
import type { HierarchySelection, SubjectNode, TaxonomyStats } from "@/types/taxonomy";

interface ContentExplorerLayoutProps {
  title: string;
  subtitle: string;
  tree: SubjectNode[];
  treeLoading?: boolean;
  treeError?: string | null;
  onTreeRefresh?: () => void;
  selection: HierarchySelection;
  onSelect: (s: HierarchySelection) => void;
  labels: { subject?: string; chapter?: string; topic?: string; subtopic?: string };
  onBreadcrumbNavigate?: (level: "subject" | "chapter" | "topic" | "subtopic" | "root") => void;
  stats?: TaxonomyStats | null;
  statsLoading?: boolean;
  filters?: ReactNode;
  children: ReactNode;
}

export default function ContentExplorerLayout({
  title,
  subtitle,
  tree,
  treeLoading,
  treeError,
  onTreeRefresh,
  selection,
  onSelect,
  labels,
  onBreadcrumbNavigate,
  stats,
  statsLoading,
  filters,
  children,
}: ContentExplorerLayoutProps) {
  return (
    <div className="w-full">
      <header className="page-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      <div className="layout-sidebar-main layout-taxonomy-explorer">
        <aside className="layout-taxonomy-aside">
          <div className="panel-sidebar hierarchy-sidebar-panel sticky top-20">
            <HierarchySidebar
              tree={tree}
              selection={selection}
              onSelect={onSelect}
              loading={treeLoading}
              error={treeError}
              onRefresh={onTreeRefresh}
            />
          </div>
        </aside>

        <div className="layout-main-col">
          <div className="mb-4">
            <HierarchyBreadcrumbs labels={labels} onNavigate={onBreadcrumbNavigate} />
          </div>
          <HierarchyStatsPanel stats={stats ?? null} loading={statsLoading} />
          {filters}
          {children}
        </div>
      </div>
    </div>
  );
}
