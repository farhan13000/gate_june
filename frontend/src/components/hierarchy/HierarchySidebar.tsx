import HierarchyTree from "./HierarchyTree";
import type { HierarchySelection, SubjectNode } from "@/types/taxonomy";

interface HierarchySidebarProps {
  tree: SubjectNode[];
  selection: HierarchySelection;
  onSelect: (s: HierarchySelection) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export default function HierarchySidebar({
  tree,
  selection,
  onSelect,
  loading,
  error,
}: HierarchySidebarProps) {
  return (
    <div className="hierarchy-sidebar flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden taxonomy-tree-scroll">
        {error && (
          <div className="m-3 rounded-sm border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <HierarchyTree
          tree={tree}
          selection={selection}
          onSelect={onSelect}
          loading={loading}
          defaultExpanded={false}
        />
        {!loading && tree.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No taxonomy loaded. Ask an admin to seed syllabus data.
          </p>
        )}
      </div>
    </div>
  );
}
