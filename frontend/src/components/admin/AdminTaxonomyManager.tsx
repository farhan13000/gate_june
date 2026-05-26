import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type TaxLevel = "subjects" | "chapters" | "topics" | "subtopics";

export default function AdminTaxonomyManager() {
  const [level, setLevel] = useState<TaxLevel>("subjects");
  const [items, setItems] = useState<any[]>([]);
  const [parentSubjectId, setParentSubjectId] = useState("");
  const [parentChapterId, setParentChapterId] = useState("");
  const [parentTopicId, setParentTopicId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});

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
    if (res.ok) setItems(await res.json());
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
      <p className="text-xs text-muted-foreground mb-2">
        Manage subjects, chapters, topics, and subtopics with semantic IDs.
      </p>

      <div className="flex flex-wrap gap-2">
        {(["subjects", "chapters", "topics", "subtopics"] as TaxLevel[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={`px-3 py-1.5 text-xs rounded-sm border capitalize ${
              level === l
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-secondary"
            }`}
          >
            {l}
          </button>
        ))}
        <button
          type="button"
          onClick={loadItems}
          className="w-full sm:w-auto sm:ml-auto px-3 py-1.5 text-xs border border-border rounded-sm hover:bg-secondary flex items-center justify-center gap-1"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {level !== "subjects" && (
        <div className="flex flex-wrap gap-3">
          <select
            value={parentSubjectId}
            onChange={(e) => {
              setParentSubjectId(e.target.value);
              setParentChapterId("");
              setParentTopicId("");
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs border border-border rounded-sm bg-card"
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
              className="w-full px-3 py-2 text-xs border border-border rounded-sm bg-card font-mono flex-1 min-w-0 sm:min-w-[200px]"
            />
          ) : null}
          {level === "subtopics" ? (
            <input
              placeholder="Parent topic ID"
              value={parentTopicId}
              onChange={(e) => setParentTopicId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-sm bg-card font-mono flex-1 min-w-0 sm:min-w-[200px]"
            />
          ) : null}
        </div>
      )}

      <div className="academic-card p-4 space-y-3">
        <div className="text-xs font-medium text-foreground">Create new {level.slice(0, -1)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            placeholder={`${idField} e.g. SUBJECT_NEW`}
            value={String(form[idField] || "")}
            onChange={(e) => setForm({ ...form, [idField]: e.target.value })}
            className="px-3 py-2 text-xs border border-border rounded-sm font-mono"
          />
          <input
            placeholder="Display name"
            value={String(form.name || "")}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 text-xs border border-border rounded-sm"
          />
          {level === "subjects" && (
            <input
              placeholder="Code e.g. DS"
              value={String(form.code || "")}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 text-xs border border-border rounded-sm font-mono"
            />
          )}
          <input
            type="number"
            placeholder="Order"
            value={String(form.order ?? "")}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
            className="px-3 py-2 text-xs border border-border rounded-sm"
          />
          {level === "topics" && (
            <select
              value={String(form.difficultyLevel || "Beginner")}
              onChange={(e) => setForm({ ...form, difficultyLevel: e.target.value })}
              className="px-3 py-2 text-xs border border-border rounded-sm"
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
          className="btn-primary px-4 py-2 text-xs flex items-center justify-center gap-1 w-full sm:w-auto"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      <div className="academic-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left py-2 px-3 font-normal text-muted-foreground">ID</th>
              <th className="text-left py-2 px-3 font-normal text-muted-foreground">Name</th>
              <th className="text-left py-2 px-3 font-normal text-muted-foreground">Order</th>
              <th className="text-right py-2 px-3 font-normal text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item[idField]} className="border-b border-border-faint">
                <td className="py-2 px-3 font-mono text-muted-foreground">{item[idField]}</td>
                <td className="py-2 px-3">{item.name}</td>
                <td className="py-2 px-3 font-mono">{item.order}</td>
                <td className="py-2 px-3 text-right space-x-1">
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
  );
}
