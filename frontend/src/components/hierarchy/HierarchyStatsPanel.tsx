import type { TaxonomyStats } from "@/types/taxonomy";

interface HierarchyStatsPanelProps {
  stats: TaxonomyStats | null;
  loading?: boolean;
}

export default function HierarchyStatsPanel({ stats, loading }: HierarchyStatsPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-secondary/40 rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div className="academic-card px-3 py-2.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-0.5">
          Questions
        </div>
        <div className="text-lg font-serif font-bold text-foreground">{stats.questionCount}</div>
      </div>
      <div className="academic-card px-3 py-2.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-0.5">
          Theory
        </div>
        <div className="text-lg font-serif font-bold text-foreground">{stats.theoryCount}</div>
      </div>
      <div className="academic-card px-3 py-2.5 col-span-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">
          Difficulty
        </div>
        <div className="flex gap-3 text-xs font-mono">
          <span className="text-emerald-600">E: {stats.difficultyDistribution.Easy}</span>
          <span className="text-blue-600">M: {stats.difficultyDistribution.Medium}</span>
          <span className="text-red-600">H: {stats.difficultyDistribution.Hard}</span>
        </div>
      </div>
    </div>
  );
}
