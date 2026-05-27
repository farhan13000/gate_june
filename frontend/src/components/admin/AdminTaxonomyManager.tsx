import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  CheckSquare,
  FolderTree,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import TaxonomyBulkJsonManager from "./TaxonomyBulkJsonManager";

type TaxLevel = "subjects" | "chapters" | "topics" | "subtopics";
type DraftMap = Record<string, Record<string, string | number | boolean>>;

const levelMeta = {
  subjects: {
    label: "Subjects",
    singular: "subject",
    icon: BookOpen,
    description: "Top-level syllabus areas used across problems and theory.",
  },
  chapters: {
    label: "Chapters",
    singular: "chapter",
    icon: FolderTree,
    description: "Groups inside a selected subject.",
  },
  topics: {
    label: "Topics",
    singular: "topic",
    icon: Layers,
    description: "Concept-level sections inside chapters.",
  },
  subtopics: {
    label: "Subtopics",
    singular: "subtopic",
    icon: FolderTree,
    description: "Fine-grained lesson targets for mapping content.",
  },
};

export default function AdminTaxonomyManager() {
  const [level, setLevel] = useState<TaxLevel>("subjects");
  const [items, setItems] = useState<any[]>([]);
  const [parentSubjectId, setParentSubjectId] = useState("");
  const [parentChapterId, setParentChapterId] = useState("");
  const [parentTopicId, setParentTopicId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [search, setSearch] = useState("");

  const loadSubjects = useCallback(async () => {
    const res = await fetch("/api/admin/taxonomy/subjects", { credentials: "include" });
    if (res.ok) setSubjects(await res.json());
  }, []);

  const loadItems = useCallback(async () => {
    let url = `/api/admin/taxonomy/${level}`;
    const params = new URLSearchParams();
    if (level === "chapters" && parentSubjectId) params.set("subjectId", parentSubjectId);
    if (level === "topics" && parentChapterId) params.set("chapterId", parentChapterId);
    if (level === "subtopics" && parentTopicId) params.set("topicId", parentTopicId);
    if (params.toString()) url += `?${params}`;
    const res = await fetch(url, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setItems(data);
      setSelectedIds([]);
      setDrafts({});
    }
  }, [level, parentSubjectId, parentChapterId, parentTopicId]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const idField =
    level === "subjects"
      ? "subjectId"
      : level === "chapters"
        ? "chapterId"
        : level === "topics"
          ? "topicId"
          : "subtopicId";

  const currentMeta = levelMeta[level];
  const ActiveLevelIcon = currentMeta.icon;
  const filteredItems = items.filter((item) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [item[idField], item.name, item.code, item.difficultyLevel, item.subjectId, item.chapterId, item.topicId]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  const selectableIds = filteredItems.map((item) => String(item[idField]));
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const setDraftValue = (id: string, key: string, value: string | number | boolean) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [key]: value,
      },
    }));
  };

  const getDraftValue = (item: any, key: string) => {
    const id = String(item[idField]);
    return drafts[id]?.[key] ?? item[key] ?? "";
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : selectableIds);
  };

  const handleCreate = async () => {
    const body = { ...form, enabled: form.enabled !== false };
    if (level === "chapters") body.subjectId = parentSubjectId;
    if (level === "topics") {
      body.chapterId = parentChapterId;
      body.subjectId = parentSubjectId;
    }
    if (level === "subtopics") {
      body.topicId = parentTopicId;
      body.chapterId = parentChapterId;
      body.subjectId = parentSubjectId;
    }
    const res = await fetch(`/api/admin/taxonomy/${level}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Created");
      setForm({});
      loadItems();
    } else {
      const d = await res.json();
      toast.error(d.message || "Failed");
    }
  };

  const handleUpdate = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/taxonomy/${level}/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast.success("Updated");
      loadItems();
    }
  };

  const handleBulkPatch = async (patch: Record<string, unknown>, successMessage: string) => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one item");
      return;
    }

    const results = await Promise.all(
      selectedIds.map((id) =>
        fetch(`/api/admin/taxonomy/${level}/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        })
      )
    );

    if (results.every((res) => res.ok)) {
      toast.success(successMessage);
      loadItems();
    } else {
      toast.error("Some items could not be updated");
    }
  };

  const handleSaveSelected = async () => {
    const editedIds = selectedIds.filter((id) => drafts[id]);
    if (editedIds.length === 0) {
      toast.error("Select edited rows before saving");
      return;
    }

    const results = await Promise.all(
      editedIds.map((id) =>
        fetch(`/api/admin/taxonomy/${level}/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(drafts[id]),
        })
      )
    );

    if (results.every((res) => res.ok)) {
      toast.success(`Saved ${editedIds.length} ${level}`);
      loadItems();
    } else {
      toast.error("Some selected edits could not be saved");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one item");
      return;
    }
    if (!confirm(`Delete ${selectedIds.length} selected ${level}? Descendants will also be removed where applicable.`)) {
      return;
    }

    const results = await Promise.all(
      selectedIds.map((id) =>
        fetch(`/api/admin/taxonomy/${level}/${id}`, {
          method: "DELETE",
          credentials: "include",
        })
      )
    );

    if (results.every((res) => res.ok)) {
      toast.success(`Deleted ${selectedIds.length} ${level}`);
      loadItems();
    } else {
      toast.error("Some selected items could not be deleted");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item and descendants?")) return;
    const res = await fetch(`/api/admin/taxonomy/${level}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Deleted");
      loadItems();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-sm border border-border bg-secondary/30 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
              <ActiveLevelIcon size={13} />
              Taxonomy Manager
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">{currentMeta.label}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{currentMeta.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:flex">
            <div className="rounded-sm border border-border bg-background px-3 py-2">
              <div className="font-mono text-lg font-bold text-foreground">{items.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Loaded</div>
            </div>
            <div className="rounded-sm border border-border bg-background px-3 py-2">
              <div className="font-mono text-lg font-bold text-primary">{selectedIds.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected</div>
            </div>
            <div className="rounded-sm border border-border bg-background px-3 py-2">
              <div className="font-mono text-lg font-bold text-foreground">{Object.keys(drafts).length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Edited</div>
            </div>
          </div>
        </div>
      </div>

      <TaxonomyBulkJsonManager
        onImported={() => {
          loadSubjects();
          loadItems();
        }}
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {(["subjects", "chapters", "topics", "subtopics"] as TaxLevel[]).map((l) => (
          (() => {
            const Icon = levelMeta[l].icon;
            const isActive = level === l;
            return (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={`min-h-20 rounded-sm border p-3 text-left transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card hover:bg-secondary/40"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Icon size={16} />
              <span className={`font-mono text-[11px] ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {l === level ? items.length : ""}
              </span>
            </div>
            <div className="text-sm font-semibold">{levelMeta[l].label}</div>
            <div className={`mt-1 text-[11px] ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {levelMeta[l].singular} level
            </div>
          </button>
            );
          })()
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${currentMeta.label.toLowerCase()} by ID, name, or parent...`}
            className="w-full rounded-sm border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={loadItems}
          className="inline-flex w-full items-center justify-center gap-1 rounded-sm border border-border bg-card px-3 py-2.5 text-xs hover:bg-secondary lg:w-auto"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {level !== "subjects" && (
        <div className="rounded-sm border border-border bg-card p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent scope</div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <select
              value={parentSubjectId}
              onChange={(e) => {
                setParentSubjectId(e.target.value);
                setParentChapterId("");
                setParentTopicId("");
              }}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs"
            >
              <option value="">Parent subject</option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.name}
                </option>
              ))}
            </select>
            {level === "topics" || level === "subtopics" ? (
              <input
                placeholder="Parent chapter ID"
                value={parentChapterId}
                onChange={(e) => setParentChapterId(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs"
              />
            ) : null}
            {level === "subtopics" ? (
              <input
                placeholder="Parent topic ID"
                value={parentTopicId}
                onChange={(e) => setParentTopicId(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs"
              />
            ) : null}
          </div>
        </div>
      )}

      <div className="academic-card space-y-4 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">Create new {currentMeta.singular}</div>
            <div className="text-xs text-muted-foreground">Use stable semantic IDs so existing content remains mapped.</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder={`${idField} e.g. SUBJECT_NEW`}
            value={String(form[idField] || "")}
            onChange={(e) => setForm({ ...form, [idField]: e.target.value })}
            className="rounded-sm border border-border px-3 py-2 text-xs font-mono"
          />
          <input
            placeholder="Display name"
            value={String(form.name || "")}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-sm border border-border px-3 py-2 text-xs"
          />
          {level === "subjects" && (
            <input
              placeholder="Code e.g. DS"
              value={String(form.code || "")}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="rounded-sm border border-border px-3 py-2 text-xs font-mono"
            />
          )}
          <input
            type="number"
            placeholder="Order"
            value={String(form.order ?? "")}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
            className="rounded-sm border border-border px-3 py-2 text-xs"
          />
          {level === "topics" && (
            <select
              value={String(form.difficultyLevel || "Beginner")}
              onChange={(e) => setForm({ ...form, difficultyLevel: e.target.value })}
              className="rounded-sm border border-border px-3 py-2 text-xs"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="btn-primary flex w-full items-center justify-center gap-1 px-4 py-2 text-xs sm:w-auto"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      <div className="academic-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border bg-secondary/20 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{selectedIds.length}</span> selected
            <span className="mx-2">-</span>
            Showing <span className="font-mono text-foreground">{filteredItems.length}</span> of{" "}
            <span className="font-mono text-foreground">{items.length}</span> {currentMeta.label.toLowerCase()}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center justify-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"
            >
              {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
              {allSelected ? "Clear all" : "Select all"}
            </button>
            <button
              type="button"
              onClick={handleSaveSelected}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center justify-center gap-1 rounded-sm border border-border px-2.5 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
            >
              <Save size={13} /> Save edits
            </button>
            <button
              type="button"
              onClick={() => handleBulkPatch({ enabled: true }, "Selected items enabled")}
              disabled={selectedIds.length === 0}
              className="rounded-sm border border-border px-2.5 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={() => handleBulkPatch({ enabled: false }, "Selected items disabled")}
              disabled={selectedIds.length === 0}
              className="rounded-sm border border-border px-2.5 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
            >
              Disable
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center justify-center gap-1 rounded-sm border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/5 disabled:opacity-40"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {filteredItems.map((item) => {
            const id = String(item[idField]);
            const isSelected = selectedIds.includes(id);
            return (
              <div key={id} className={`rounded-sm border p-3 ${isSelected ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelected(id)}
                    className="mt-0.5 text-muted-foreground hover:text-foreground"
                  >
                    {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-[11px] text-muted-foreground">{id}</div>
                    <input
                      value={String(getDraftValue(item, "name"))}
                      onChange={(e) => setDraftValue(id, "name", e.target.value)}
                      className="mt-2 w-full rounded-sm border border-border bg-card px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {level === "subjects" && (
                    <label className="text-[11px] text-muted-foreground">
                      Code
                      <input
                        value={String(getDraftValue(item, "code"))}
                        onChange={(e) => setDraftValue(id, "code", e.target.value)}
                        className="mt-1 w-full rounded-sm border border-border bg-card px-2 py-1.5 font-mono text-xs"
                      />
                    </label>
                  )}
                  {level === "topics" && (
                    <label className="text-[11px] text-muted-foreground">
                      Level
                      <select
                        value={String(getDraftValue(item, "difficultyLevel") || "Beginner")}
                        onChange={(e) => setDraftValue(id, "difficultyLevel", e.target.value)}
                        className="mt-1 w-full rounded-sm border border-border bg-card px-2 py-1.5 text-xs"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </label>
                  )}
                  <label className="text-[11px] text-muted-foreground">
                    Order
                    <input
                      type="number"
                      value={String(getDraftValue(item, "order"))}
                      onChange={(e) => setDraftValue(id, "order", parseInt(e.target.value, 10) || 0)}
                      className="mt-1 w-full rounded-sm border border-border bg-card px-2 py-1.5 font-mono text-xs"
                    />
                  </label>
                  <label className="text-[11px] text-muted-foreground">
                    State
                    <select
                      value={String(getDraftValue(item, "enabled") !== false)}
                      onChange={(e) => setDraftValue(id, "enabled", e.target.value === "true")}
                      className="mt-1 w-full rounded-sm border border-border bg-card px-2 py-1.5 text-xs"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(id, drafts[id] || {})}
                    disabled={!drafts[id]}
                    className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs hover:bg-secondary disabled:opacity-40"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate(id, { enabled: !item.enabled })}
                    className="rounded-sm border border-border px-2 py-1 text-xs hover:bg-secondary"
                  >
                    {item.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(id)}
                    className="inline-flex items-center gap-1 rounded-sm border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[760px] w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="w-10 text-left py-2 px-3 font-normal text-muted-foreground">
                <button type="button" onClick={toggleSelectAll} className="hover:text-foreground">
                  {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>
              </th>
              <th className="text-left py-2 px-3 font-normal text-muted-foreground">ID</th>
              <th className="text-left py-2 px-3 font-normal text-muted-foreground">Name</th>
              {level === "subjects" && (
                <th className="text-left py-2 px-3 font-normal text-muted-foreground">Code</th>
              )}
              {level === "topics" && (
                <th className="text-left py-2 px-3 font-normal text-muted-foreground">Level</th>
              )}
              <th className="text-left py-2 px-3 font-normal text-muted-foreground">Order</th>
              <th className="text-left py-2 px-3 font-normal text-muted-foreground">State</th>
              <th className="text-right py-2 px-3 font-normal text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item[idField]} className="border-b border-border-faint">
                <td className="py-2 px-3">
                  <button
                    type="button"
                    onClick={() => toggleSelected(String(item[idField]))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {selectedIds.includes(String(item[idField])) ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                </td>
                <td className="py-2 px-3 font-mono text-muted-foreground">{item[idField]}</td>
                <td className="py-2 px-3">
                  <input
                    value={String(getDraftValue(item, "name"))}
                    onChange={(e) => setDraftValue(String(item[idField]), "name", e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs"
                  />
                </td>
                {level === "subjects" && (
                  <td className="py-2 px-3">
                    <input
                      value={String(getDraftValue(item, "code"))}
                      onChange={(e) => setDraftValue(String(item[idField]), "code", e.target.value)}
                      className="w-24 rounded-sm border border-border bg-background px-2 py-1.5 font-mono text-xs"
                    />
                  </td>
                )}
                {level === "topics" && (
                  <td className="py-2 px-3">
                    <select
                      value={String(getDraftValue(item, "difficultyLevel") || "Beginner")}
                      onChange={(e) => setDraftValue(String(item[idField]), "difficultyLevel", e.target.value)}
                      className="rounded-sm border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </td>
                )}
                <td className="py-2 px-3">
                  <input
                    type="number"
                    value={String(getDraftValue(item, "order"))}
                    onChange={(e) => setDraftValue(String(item[idField]), "order", parseInt(e.target.value, 10) || 0)}
                    className="w-20 rounded-sm border border-border bg-background px-2 py-1.5 font-mono text-xs"
                  />
                </td>
                <td className="py-2 px-3">
                  <select
                    value={String(getDraftValue(item, "enabled") !== false)}
                    onChange={(e) => setDraftValue(String(item[idField]), "enabled", e.target.value === "true")}
                    className="rounded-sm border border-border bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </td>
                <td className="py-2 px-3 text-right space-x-1">
                  <button
                    type="button"
                    onClick={() => handleUpdate(item[idField], drafts[String(item[idField])] || {})}
                    disabled={!drafts[String(item[idField])]}
                    className="px-2 py-1 border border-border rounded-sm hover:bg-secondary disabled:opacity-40"
                  >
                    <Save size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate(item[idField], { enabled: !item.enabled })
                    }
                    className="px-2 py-1 border border-border rounded-sm hover:bg-secondary"
                  >
                    {item.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item[idField])}
                    className="px-2 py-1 border border-destructive/30 text-destructive rounded-sm hover:bg-destructive/5"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
