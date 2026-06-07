import { useCallback, useEffect, useState } from "react";
import type { HierarchySelection, SubjectNode, TaxonomyStats } from "@/types/taxonomy";

export function useTaxonomy() {
  const [tree, setTree] = useState<SubjectNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/taxonomy/tree", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load taxonomy");
      const data = await res.json();
      setTree(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load taxonomy");
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tree, loading, error, refresh };
}

export function useTaxonomyStats(selection: HierarchySelection) {
  const [stats, setStats] = useState<TaxonomyStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selection.subtopicId) params.set("subtopicId", selection.subtopicId);
    else if (selection.topicId) params.set("topicId", selection.topicId);
    else if (selection.chapterId) params.set("chapterId", selection.chapterId);
    else if (selection.subjectId) params.set("subjectId", selection.subjectId);

    if ([...params.keys()].length === 0) {
      setStats(null);
      return;
    }

    setLoading(true);
    fetch(`/api/taxonomy/stats?${params}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [selection.subjectId, selection.chapterId, selection.topicId, selection.subtopicId]);

  return { stats, loading };
}

/** Resolve display labels from tree + selection */
export function resolveHierarchyLabels(
  tree: SubjectNode[],
  selection: HierarchySelection
): { subject?: string; chapter?: string; topic?: string; subtopic?: string } {
  const out: { subject?: string; chapter?: string; topic?: string; subtopic?: string } = {};
  const subj = tree.find((s) => s.subjectId === selection.subjectId);
  if (!subj) return out;
  out.subject = subj.name;
  const ch = subj.chapters.find((c) => c.chapterId === selection.chapterId);
  if (!ch) return out;
  out.chapter = ch.name;
  const tp = ch.topics.find((t) => t.topicId === selection.topicId);
  if (!tp) return out;
  out.topic = tp.name;
  const st = tp.subtopics.find((s) => s.subtopicId === selection.subtopicId);
  if (st) out.subtopic = st.name;
  return out;
}
