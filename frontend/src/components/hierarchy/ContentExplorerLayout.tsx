import type { CSSProperties, ReactNode } from "react";
import { useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react";
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
  hideStats?: boolean;
  resetLabel?: string;
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
  hideStats = false,
  resetLabel = "All problems",
}: ContentExplorerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const hasSelection = Boolean(
    selection.subjectId || selection.chapterId || selection.topicId || selection.subtopicId
  );

  const resetSelection = () => {
    onSelect({});
    onBreadcrumbNavigate?.("root");
  };

  return (
    <div
      className="w-full"
      style={{ "--taxonomy-sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <header className="page-header">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
            aria-expanded={sidebarOpen}
            aria-controls="taxonomy-sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            {sidebarOpen ? "Close subjects" : "Show subjects"}
          </button>
        </div>
      </header>

      <div className={`layout-sidebar-main layout-taxonomy-explorer ${!sidebarOpen ? "taxonomy-sidebar-closed" : ""}`}>
        {sidebarOpen && (
        <aside id="taxonomy-sidebar" ref={sidebarRef} className="layout-taxonomy-aside relative">
          <div className="taxonomy-explorer-toolbar flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
              Subjects
            </span>
            <button
              type="button"
              onClick={resetSelection}
              className="shrink-0 rounded-sm border border-border px-2 py-1 text-[10px] font-medium hover:bg-secondary"
            >
              All
            </button>
          </div>
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
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize subject sidebar"
            className="taxonomy-resize-handle"
            onPointerDown={(event) => {
              if (!sidebarRef.current) return;
              event.preventDefault();
              const startX = event.clientX;
              const startWidth = sidebarRef.current.getBoundingClientRect().width;

              const handleMove = (moveEvent: PointerEvent) => {
                const next = Math.min(520, Math.max(240, startWidth + moveEvent.clientX - startX));
                setSidebarWidth(next);
              };

              const handleUp = () => {
                document.removeEventListener("pointermove", handleMove);
                document.removeEventListener("pointerup", handleUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
              };

              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
              document.addEventListener("pointermove", handleMove);
              document.addEventListener("pointerup", handleUp);
            }}
          />
        </aside>
        )}

        <div className="layout-main-col">
          <div className="taxonomy-explorer-toolbar flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <HierarchyBreadcrumbs labels={labels} onNavigate={onBreadcrumbNavigate} />
            <div className="flex flex-wrap items-center gap-2">
              {hasSelection && (
                <button
                  type="button"
                  onClick={resetSelection}
                  className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  <RotateCcw size={13} />
                  {resetLabel}
                </button>
              )}
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  <PanelLeftOpen size={14} />
                  Show subjects
                </button>
              )}
            </div>
          </div>
          {!hideStats && <HierarchyStatsPanel stats={stats ?? null} loading={statsLoading} />}
          {filters}
          {children}
        </div>
      </div>
    </div>
  );
}
