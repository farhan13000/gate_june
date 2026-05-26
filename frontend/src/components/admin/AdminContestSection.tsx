import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

type Contest = {
  _id: string;
  title: string;
  description: string;
  meta?: string;
  startTime: string;
  endTime: string;
  status: string;
  showOnHome: boolean;
};

const emptyForm = {
  title: "",
  description: "",
  meta: "",
  startTime: "",
  endTime: "",
  showOnHome: true,
};

export default function AdminContestSection() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contests", { credentials: "include" });
      if (res.ok) setContests(await res.json());
    } catch {
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const toLocalInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.startTime || !form.endTime) {
      toast.error("Fill all required fields");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      meta: form.meta,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      showOnHome: form.showOnHome,
      status: "approved",
    };

    try {
      const url = editingId ? `/api/admin/contests/${editingId}` : "/api/admin/contests";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingId ? "Contest updated" : "Contest created");
        resetForm();
        fetchContests();
      } else {
        const data = await res.json();
        toast.error(data.message || "Save failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const startEdit = (c: Contest) => {
    setEditingId(c._id);
    setForm({
      title: c.title,
      description: c.description,
      meta: c.meta || "",
      startTime: toLocalInput(c.startTime),
      endTime: toLocalInput(c.endTime),
      showOnHome: c.showOnHome,
    });
  };

  const deleteContest = async (id: string) => {
    if (!confirm("Delete this contest?")) return;
    try {
      const res = await fetch(`/api/admin/contests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Contest deleted");
        fetchContests();
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8">Loading contests…</p>;
  }

  return (
    <div className="space-y-8 w-full">
      <div>
        <h2 className="text-lg font-bold font-serif text-foreground">Contest Configuration</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Scheduled contests appear on the home page with live countdown timers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="academic-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">Contest Name</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. GATE DA Weekly Mock #25"
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Display meta (home card)</label>
            <input
              value={form.meta}
              onChange={(e) => setForm({ ...form, meta: e.target.value })}
              placeholder="Full Length · 65 Questions · 3 Hours"
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">Start date & time</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">End date & time</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.showOnHome}
            onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })}
          />
          Show on home page (Upcoming Contests)
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-border pt-4">
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs border border-border rounded-sm">
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary px-6 py-2 text-xs flex items-center justify-center gap-1">
            <Plus size={14} />
            {editingId ? "Update Contest" : "Save Contest"}
          </button>
        </div>
      </form>

      <div className="academic-card overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="font-bold text-sm">All Contests</h3>
        </div>
        {contests.length === 0 ? (
          <p className="p-6 text-xs text-muted-foreground text-center">
            No contests scheduled. Create one above to show on the home page.
          </p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/10 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 font-medium">Title</th>
                <th className="py-2.5 px-4 font-medium">Starts</th>
                <th className="py-2.5 px-4 font-medium">Home</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contests.map((c) => (
                <tr key={c._id} className="hover:bg-secondary/20">
                  <td className="py-3 px-4 font-medium">{c.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(c.startTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">{c.showOnHome ? "Yes" : "No"}</td>
                  <td className="py-3 px-4 capitalize">{c.status}</td>
                  <td className="py-3 px-4 text-right flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="p-1.5 hover:bg-secondary rounded-sm"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteContest(c._id)}
                      className="p-1.5 text-red-600 hover:bg-red-500/10 rounded-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
