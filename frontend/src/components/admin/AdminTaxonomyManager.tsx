import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileJson,
  FolderTree,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { SubjectNode } from "@/types/taxonomy";
import TaxonomyBulkJsonManager from "./TaxonomyBulkJsonManager";

type TaxLevel = "subjects" | "chapters" | "topics" | "subtopics";
type TaxonomyItem = Record<string, any>;
type ParentOption = { id: string; name: string; enabled?: boolean; context?: string };

type TaxonomyForm = {
  id: string;
  name: string;
  code: string;
  order: string;
  description: string;
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  enabled: boolean;
};

const levelMeta: Record<TaxLevel, { label: string; singular: string; idField: string; icon: typeof BookOpen; description: string }> = {
  subjects: {
    label: "Subjects",
    singular: "subject",
    idField: "subjectId",
    icon: BookOpen,
    description: "Top-level syllabus areas.",
  },
  chapters: {
    label: "Chapters",
    singular: "chapter",
    idField: "chapterId",
    icon: FolderTree,
    description: "Groups that belong to one subject.",
  },
  topics: {
    label: "Topics",
    singular: "topic",
    idField: "topicId",
    icon: Layers,
    description: "Concepts that belong to one chapter.",
  },
  subtopics: {
    label: "Subtopics",
    singular: "subtopic",
    idField: "subtopicId",
    icon: FolderTree,
    description: "The precise learning targets used for content mapping.",
  },
};

const emptyForm = (): TaxonomyForm => ({
  id: "",
  name: "",
  code: "",
  order: "",
  description: "",
  difficultyLevel: "Beginner",
  enabled: true,
});

function labelFor(option?: ParentOption) {
  return option ? `${option.name} · ${option.id}` : "";
}

/** A small searchable selector that always persists the stable ID, never the typed label. */
function ParentAutocomplete({
  label,
  placeholder,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: ParentOption[];
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const selected = options.find((option) => option.id === value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(labelFor(selected));
  }, [selected?.id, selected?.name]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...options].sort((a, b) => a.name.localeCompare(b.name));
    if (!needle) return sorted.slice(0, 8);
    return sorted
      .filter((option) => `${option.id} ${option.name} ${option.context || ""}`.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [options, query]);

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(true);
  };

  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      <div className="relative">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              setQuery(labelFor(options.find((option) => option.id === value)));
            }, 150);
          }}
          className="w-full rounded-sm border border-border bg-background py-2 pl-8 pr-8 text-xs outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        {value && !disabled && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X size={12} />
          </button>
        )}
        {open && !disabled && (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-sm border border-border bg-popover p-1 shadow-lg">
            {matches.length > 0 ? matches.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.id);
                  setQuery(labelFor(option));
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left text-xs hover:bg-secondary"
              >
                <span className="min-w-0 truncate text-foreground">{option.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{option.id}</span>
              </button>
            )) : (
              <div className="px-2.5 py-3 text-xs text-muted-foreground">No matching {label.toLowerCase()}.</div>
            )}
          </div>
        )}
      </div>
      <span className="mt-1 block text-[10px] text-muted-foreground">Type a name or ID, then choose a result.</span>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border bg-background px-3 py-2 text-center">
      <div className="font-mono text-lg font-bold text-foreground">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export default function AdminTaxonomyManager() {
  const [tree, setTree] = useState<SubjectNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<TaxLevel>("subjects");
  const [parentSubjectId, setParentSubjectId] = useState("");
  const [parentChapterId, setParentChapterId] = useState("");
  const [parentTopicId, setParentTopicId] = useState("");
  const [form, setForm] = useState<TaxonomyForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [editForm, setEditForm] = useState<TaxonomyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/taxonomy/tree", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the taxonomy");
      const data = await response.json();
      setTree(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setTree([]);
      toast.error(error.message || "Could not load taxonomy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subjects = useMemo<ParentOption[]>(
    () => tree.map((subject) => ({ id: subject.subjectId, name: subject.name, enabled: subject.enabled })),
    [tree]
  );
  const selectedSubject = tree.find((subject) => subject.subjectId === parentSubjectId);
  const allChapters = useMemo(() => tree.flatMap((subject) => subject.chapters || []), [tree]);
  const chapterOptions = useMemo<ParentOption[]>(() => {
    const chapters = selectedSubject ? selectedSubject.chapters : allChapters;
    return chapters.map((chapter) => ({
      id: chapter.chapterId,
      name: chapter.name,
      enabled: chapter.enabled,
      context: selectedSubject ? undefined : tree.find((subject) => subject.subjectId === chapter.subjectId)?.name,
    }));
  }, [allChapters, selectedSubject, tree]);
  const selectedChapter = allChapters.find((chapter) => chapter.chapterId === parentChapterId);
  const allTopics = useMemo(() => allChapters.flatMap((chapter) => chapter.topics || []), [allChapters]);
  const topicOptions = useMemo<ParentOption[]>(() => {
    const topics = selectedChapter ? selectedChapter.topics : allTopics;
    return topics.map((topic) => ({
      id: topic.topicId,
      name: topic.name,
      enabled: topic.enabled,
      context: selectedChapter ? undefined : allChapters.find((chapter) => chapter.chapterId === topic.chapterId)?.name,
    }));
  }, [allChapters, allTopics, selectedChapter]);
  const selectedTopic = allTopics.find((topic) => topic.topicId === parentTopicId);
  const allSubtopics = useMemo(() => allTopics.flatMap((topic) => topic.subtopics || []), [allTopics]);

  const items = useMemo<TaxonomyItem[]>(() => {
    if (level === "subjects") return tree as TaxonomyItem[];
    if (level === "chapters") return allChapters as TaxonomyItem[];
    if (level === "topics") return allTopics as TaxonomyItem[];
    return allSubtopics as TaxonomyItem[];
  }, [allChapters, allSubtopics, allTopics, level, tree]);

  const scopedItems = useMemo(() => items.filter((item) => {
    if (level === "chapters") return !parentSubjectId || item.subjectId === parentSubjectId;
    if (level === "topics") return (!parentSubjectId || item.subjectId === parentSubjectId) && (!parentChapterId || item.chapterId === parentChapterId);
    if (level === "subtopics") {
      return (!parentSubjectId || item.subjectId === parentSubjectId)
        && (!parentChapterId || item.chapterId === parentChapterId)
        && (!parentTopicId || item.topicId === parentTopicId);
    }
    return true;
  }), [items, level, parentChapterId, parentSubjectId, parentTopicId]);

  const currentMeta = levelMeta[level];
  const idField = currentMeta.idField;
  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return scopedItems;
    return scopedItems.filter((item) => [item[idField], item.name, item.code, item.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle));
  }, [idField, scopedItems, search]);
  const selectedItem = items.find((item) => String(item[idField]) === selectedId);

  const counts = useMemo(() => ({
    subjects: tree.length,
    chapters: allChapters.length,
    topics: allTopics.length,
    subtopics: allSubtopics.length,
  }), [allChapters.length, allSubtopics.length, allTopics.length, tree.length]);

  const setSubject = (subjectId: string) => {
    setParentSubjectId(subjectId);
    setParentChapterId("");
    setParentTopicId("");
  };
  const setChapter = (chapterId: string) => {
    const chapter = allChapters.find((entry) => entry.chapterId === chapterId);
    if (chapter && chapter.subjectId !== parentSubjectId) setParentSubjectId(chapter.subjectId);
    setParentChapterId(chapterId);
    setParentTopicId("");
  };
  const setTopic = (topicId: string) => {
    const topic = allTopics.find((entry) => entry.topicId === topicId);
    if (topic) {
      setParentSubjectId(topic.subjectId);
      setParentChapterId(topic.chapterId);
    }
    setParentTopicId(topicId);
  };

  const changeLevel = (nextLevel: TaxLevel) => {
    setLevel(nextLevel);
    setForm(emptyForm());
    setSelectedId("");
    setEditForm(emptyForm());
    setSearch("");
  };

  const openEditor = (item: TaxonomyItem) => {
    setSelectedId(String(item[idField]));
    setEditForm({
      id: String(item[idField] || ""),
      name: String(item.name || ""),
      code: String(item.code || ""),
      order: String(item.order ?? ""),
      description: String(item.description || ""),
      difficultyLevel: item.difficultyLevel || "Beginner",
      enabled: item.enabled !== false,
    });
  };

  const canCreate = Boolean(
    form.id.trim()
    && form.name.trim()
    && (level !== "subjects" || form.code.trim())
    && (level !== "chapters" || parentSubjectId)
    && (level !== "topics" || parentChapterId)
    && (level !== "subtopics" || parentTopicId)
  );

  const createItem = async () => {
    if (!canCreate) {
      toast.error("Complete the required ID, name, and parent selection first.");
      return;
    }
    const body: TaxonomyItem = {
      [idField]: form.id.trim(),
      name: form.name.trim(),
      order: form.order === "" ? scopedItems.length + 1 : Number(form.order),
      enabled: form.enabled,
      description: form.description.trim(),
    };
    if (level === "subjects") body.code = form.code.trim().toUpperCase();
    if (level === "topics") body.difficultyLevel = form.difficultyLevel;
    if (level === "chapters") body.subjectId = parentSubjectId;
    if (level === "topics") {
      body.subjectId = parentSubjectId;
      body.chapterId = parentChapterId;
    }
    if (level === "subtopics") {
      body.subjectId = parentSubjectId;
      body.chapterId = parentChapterId;
      body.topicId = parentTopicId;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/taxonomy/${level}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not create taxonomy item");
      toast.success(`${currentMeta.label.slice(0, -1)} created`);
      setForm(emptyForm());
      await refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not create taxonomy item");
    } finally {
      setSaving(false);
    }
  };

  const saveEditor = async () => {
    if (!selectedItem || !editForm.name.trim()) {
      toast.error("A display name is required.");
      return;
    }
    const body: TaxonomyItem = {
      name: editForm.name.trim(),
      order: Number(editForm.order || 0),
      enabled: editForm.enabled,
      description: editForm.description.trim(),
    };
    if (level === "subjects") body.code = editForm.code.trim().toUpperCase();
    if (level === "topics") body.difficultyLevel = editForm.difficultyLevel;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/taxonomy/${level}/${encodeURIComponent(editForm.id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not save taxonomy item");
      toast.success("Changes saved");
      await refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not save taxonomy item");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!selectedItem) return;
    const label = level === "subjects" || level === "chapters" || level === "topics"
      ? " This also removes its descendants."
      : "";
    if (!window.confirm(`Delete “${selectedItem.name}”?${label}`)) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/taxonomy/${level}/${encodeURIComponent(editForm.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not delete taxonomy item");
      toast.success("Taxonomy item deleted");
      setSelectedId("");
      setEditForm(emptyForm());
      await refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not delete taxonomy item");
    } finally {
      setSaving(false);
    }
  };

  const parentTrail = (item: TaxonomyItem) => {
    const labels: string[] = [];
    const subject = tree.find((entry) => entry.subjectId === item.subjectId);
    const chapter = allChapters.find((entry) => entry.chapterId === item.chapterId);
    const topic = allTopics.find((entry) => entry.topicId === item.topicId);
    if (subject && level !== "subjects") labels.push(subject.name);
    if (chapter && (level === "topics" || level === "subtopics")) labels.push(chapter.name);
    if (topic && level === "subtopics") labels.push(topic.name);
    return labels.join(" › ");
  };

  const ActiveIcon = currentMeta.icon;

  return (
    <div className="space-y-5">
      <section className="rounded-sm border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-sm border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-primary">
              <FolderTree size={13} /> Taxonomy workspace
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Build a clean syllabus hierarchy</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Create in order, choose parents by name or ID, then edit the selected item without touching its stable mapping ID.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Subjects" value={counts.subjects} />
            <Stat label="Chapters" value={counts.chapters} />
            <Stat label="Topics" value={counts.topics} />
            <Stat label="Subtopics" value={counts.subtopics} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Taxonomy level">
        {(Object.keys(levelMeta) as TaxLevel[]).map((key) => {
          const meta = levelMeta[key];
          const Icon = meta.icon;
          const active = level === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => changeLevel(key)}
              className={`rounded-sm border p-3 text-left transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
            >
              <Icon size={16} />
              <div className="mt-3 text-sm font-semibold">{meta.label}</div>
              <div className={`mt-1 text-[10px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{meta.description}</div>
            </button>
          );
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(20rem,.9fr)_minmax(28rem,1.35fr)]">
        <section className="space-y-4 rounded-sm border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-sm border border-primary/20 bg-primary/5 p-2 text-primary"><Plus size={17} /></div>
            <div>
              <h3 className="font-semibold text-foreground">Create a {currentMeta.singular}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Parent choices filter themselves as you work down the hierarchy.</p>
            </div>
          </div>

          {level !== "subjects" && (
            <div className="space-y-3 rounded-sm border border-border bg-secondary/15 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">1. Select the parent path</div>
              <ParentAutocomplete
                label="Subject"
                placeholder="Type a subject name or subjectId"
                value={parentSubjectId}
                options={subjects}
                onChange={setSubject}
              />
              {(level === "topics" || level === "subtopics") && (
                <ParentAutocomplete
                  label="Chapter"
                  placeholder={parentSubjectId ? "Type a chapter name or chapterId" : "Select a subject first"}
                  value={parentChapterId}
                  options={chapterOptions}
                  disabled={!parentSubjectId}
                  onChange={setChapter}
                />
              )}
              {level === "subtopics" && (
                <ParentAutocomplete
                  label="Topic"
                  placeholder={parentChapterId ? "Type a topic name or topicId" : "Select a chapter first"}
                  value={parentTopicId}
                  options={topicOptions}
                  disabled={!parentChapterId}
                  onChange={setTopic}
                />
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{level === "subjects" ? "1" : "2"}. Enter details</div>
            <label className="block text-[11px] font-semibold text-muted-foreground">
              Stable ID <span className="text-destructive">*</span>
              <input
                value={form.id}
                onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                placeholder={`${idField} e.g. ${level === "subjects" ? "SUBJECT_AI" : level === "chapters" ? "CHAPTER_SEARCH" : level === "topics" ? "TOPIC_A_STAR" : "SUBTOPIC_HEURISTICS"}`}
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
              />
            </label>
            <label className="block text-[11px] font-semibold text-muted-foreground">
              Display name <span className="text-destructive">*</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={`e.g. ${level === "subjects" ? "Artificial Intelligence" : level === "chapters" ? "Search and Planning" : level === "topics" ? "A* Search" : "Admissible Heuristics"}`}
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {level === "subjects" && (
                <label className="block text-[11px] font-semibold text-muted-foreground">
                  Short code <span className="text-destructive">*</span>
                  <input
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                    placeholder="e.g. AI"
                    className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                  />
                </label>
              )}
              {level === "topics" && (
                <label className="block text-[11px] font-semibold text-muted-foreground">
                  Difficulty level
                  <select
                    value={form.difficultyLevel}
                    onChange={(event) => setForm((current) => ({ ...current, difficultyLevel: event.target.value as TaxonomyForm["difficultyLevel"] }))}
                    className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
              )}
              <label className="block text-[11px] font-semibold text-muted-foreground">
                Display order
                <input
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
                  placeholder={`Default: ${scopedItems.length + 1}`}
                  className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                />
              </label>
            </div>
            <label className="block text-[11px] font-semibold text-muted-foreground">
              Description <span className="font-normal text-muted-foreground/80">(optional)</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={2}
                placeholder="A short note about this syllabus area."
                className="mt-1.5 w-full resize-y rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />
              Enabled and visible to learners
            </label>
          </div>

          <button
            type="button"
            disabled={!canCreate || saving}
            onClick={createItem}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} /> Create {currentMeta.singular}
          </button>
        </section>

        <section className="overflow-hidden rounded-sm border border-border bg-card">
          <div className="border-b border-border p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-sm border border-border bg-secondary/30 p-2 text-muted-foreground"><ActiveIcon size={16} /></div>
                <div>
                  <h3 className="font-semibold text-foreground">Edit {currentMeta.label.toLowerCase()}</h3>
                  <p className="text-xs text-muted-foreground">Choose an item from the organized list, then save its details.</p>
                </div>
              </div>
              <button type="button" onClick={refresh} className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-border px-3 py-2 text-xs hover:bg-secondary">
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {level !== "subjects" && (parentSubjectId || parentChapterId || parentTopicId) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Scoped to:</span>
                {[selectedSubject?.name, selectedChapter?.name, selectedTopic?.name].filter(Boolean).map((name) => (
                  <span key={name} className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-foreground">{name}</span>
                ))}
              </div>
            )}
          </div>

          <div className="grid min-h-[38rem] lg:grid-cols-[minmax(15rem,.85fr)_minmax(20rem,1.15fr)]">
            <div className="border-b border-border lg:border-b-0 lg:border-r">
              <div className="border-b border-border p-3">
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`Search ${currentMeta.label.toLowerCase()}`}
                    className="w-full rounded-sm border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">{filteredItems.length} of {scopedItems.length} items shown</div>
              </div>
              <div className="max-h-[32rem] overflow-auto p-2">
                {loading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading taxonomy…</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No {currentMeta.label.toLowerCase()} found in this scope.</div>
                ) : filteredItems.map((item) => {
                  const itemId = String(item[idField]);
                  const active = itemId === selectedId;
                  return (
                    <button
                      key={itemId}
                      type="button"
                      onClick={() => openEditor(item)}
                      className={`mb-1 w-full rounded-sm border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-transparent hover:border-border hover:bg-secondary/30"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-semibold text-foreground">{item.name}</span>
                        {item.enabled === false && <span className="shrink-0 rounded-sm border border-amber-500/30 bg-amber-500/10 px-1 py-0.5 text-[9px] text-amber-700">Hidden</span>}
                      </div>
                      <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{itemId}</div>
                      {parentTrail(item) && <div className="mt-1 truncate text-[10px] text-muted-foreground">{parentTrail(item)}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Editing</div>
                      <div className="mt-1 font-mono text-xs text-foreground">{editForm.id}</div>
                    </div>
                    <button type="button" onClick={() => { setSelectedId(""); setEditForm(emptyForm()); }} className="rounded-sm p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close editor"><X size={15} /></button>
                  </div>
                  {parentTrail(selectedItem) && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Parent path:</span><span className="font-medium text-foreground">{parentTrail(selectedItem)}</span>
                    </div>
                  )}
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Display name
                    <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {level === "subjects" && (
                      <label className="block text-[11px] font-semibold text-muted-foreground">
                        Short code
                        <input value={editForm.code} onChange={(event) => setEditForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary" />
                      </label>
                    )}
                    {level === "topics" && (
                      <label className="block text-[11px] font-semibold text-muted-foreground">
                        Difficulty level
                        <select value={editForm.difficultyLevel} onChange={(event) => setEditForm((current) => ({ ...current, difficultyLevel: event.target.value as TaxonomyForm["difficultyLevel"] }))} className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary">
                          <option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option>
                        </select>
                      </label>
                    )}
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      Display order
                      <input type="number" min="1" value={editForm.order} onChange={(event) => setEditForm((current) => ({ ...current, order: event.target.value }))} className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary" />
                    </label>
                  </div>
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Description
                    <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="mt-1.5 w-full resize-y rounded-sm border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                    <input type="checkbox" checked={editForm.enabled} onChange={(event) => setEditForm((current) => ({ ...current, enabled: event.target.checked }))} />
                    Enabled and visible to learners
                  </label>
                  <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
                    <button type="button" disabled={saving} onClick={deleteItem} className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-destructive/30 px-3 py-2 text-xs text-destructive hover:bg-destructive/5 disabled:opacity-50"><Trash2 size={13} /> Delete</button>
                    <button type="button" disabled={saving} onClick={saveEditor} className="btn-primary inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs disabled:opacity-50"><Save size={13} /> Save changes</button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                  <div className="rounded-full border border-border bg-secondary/30 p-3 text-muted-foreground"><ChevronRight size={20} /></div>
                  <div className="mt-3 text-sm font-semibold text-foreground">Select an item to edit</div>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">Stable IDs and parent paths stay locked so existing questions and theory remain correctly mapped.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /><span>Creation now validates the full parent path on the server. A topic inherits its subject from the chosen chapter, and a subtopic inherits its chapter and subject from the chosen topic.</span></div>
      </section>

      <details className="rounded-sm border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-foreground"><FileJson size={16} /> Advanced: bulk JSON import <CircleHelp size={14} className="text-muted-foreground" /></summary>
        <div className="border-t border-border"><TaxonomyBulkJsonManager onImported={refresh} /></div>
      </details>
    </div>
  );
}
