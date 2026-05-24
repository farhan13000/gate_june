import type { TaxonomyStats } from "@/types/taxonomy";

interface HierarchyStatsPanelProps {
  stats: TaxonomyStats | null;
  loading?: boolean;
}

export default function HierarchyStatsPanel({ stats, loading }: HierarchyStatsPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-secondary/40 rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Some sites expose solved/attempts/accuracy per-selection. Use safe defaults when absent.
  const solved = (stats as any).solvedCount ?? 0;
  const attempts = (stats as any).attempts ?? 0;
  const accuracy = (stats as any).accuracy ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
      <div className="academic-card px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Questions</div>
        <div className="text-lg font-serif font-bold text-foreground">{stats.questionCount}</div>
      </div>

      <div className="academic-card px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Solved</div>
        <div className="text-lg font-serif font-bold text-foreground">{solved}</div>
      </div>

      <div className="academic-card px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Attempts</div>
        <div className="text-lg font-serif font-bold text-foreground">{attempts}</div>
      </div>

      <div className="academic-card px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Accuracy</div>
        <div className="text-lg font-serif font-bold text-foreground">{accuracy}%</div>
      </div>

      <div className="academic-card px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Difficulty</div>
        <div className="flex gap-3 text-xs font-mono">
          <span className="text-emerald-600">E: {stats.difficultyDistribution.Easy}</span>
          <span className="text-blue-600">M: {stats.difficultyDistribution.Medium}</span>
          <span className="text-red-600">H: {stats.difficultyDistribution.Hard}</span>
        </div>
      </div>
    </div>
  );
}
