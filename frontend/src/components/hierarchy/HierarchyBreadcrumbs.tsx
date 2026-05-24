import { ChevronRight } from "lucide-react";

interface HierarchyBreadcrumbsProps {
  labels: { subject?: string; chapter?: string; topic?: string; subtopic?: string };
  onNavigate?: (level: "subject" | "chapter" | "topic" | "subtopic" | "root") => void;
}

export default function HierarchyBreadcrumbs({ labels, onNavigate }: HierarchyBreadcrumbsProps) {
  const crumbs: { label: string; level: "subject" | "chapter" | "topic" | "subtopic" }[] = [];
  if (labels.subject) crumbs.push({ label: labels.subject, level: "subject" });
  if (labels.chapter) crumbs.push({ label: labels.chapter, level: "chapter" });
  if (labels.topic) crumbs.push({ label: labels.topic, level: "topic" });
  if (labels.subtopic) crumbs.push({ label: labels.subtopic, level: "subtopic" });

  if (crumbs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
        All content
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => onNavigate?.("root")}
        className="hover:text-primary transition-colors font-mono"
      >
        All
      </button>
      {crumbs.map((c, i) => (
        <span key={c.level} className="flex items-center gap-1">
          <ChevronRight size={10} className="opacity-40" />
          <button
            type="button"
            onClick={() => onNavigate?.(c.level)}
            className={`hover:text-primary transition-colors ${
              i === crumbs.length - 1 ? "text-foreground font-medium" : ""
            }`}
          >
            {c.label}
          </button>
        </span>
      ))}
    </div>
  );
}
