import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import LatexRenderer from "@/components/LatexRenderer";

type Announcement = {
  _id: string;
  title: string;
  link?: string;
  type: "important" | "recent";
  showNewBadge: boolean;
  isActive: boolean;
  sortOrder: number;
  publishedAt: string;
};

type ApprovedQuestion = {
  _id: string;
  title: string;
  contentId?: string;
  difficulty: string;
  status: string;
};

export default function AdminHomeSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [approvedQuestions, setApprovedQuestions] = useState<ApprovedQuestion[]>([]);
  const [potdId, setPotdId] = useState<string | null>(null);
  const [potdPreview, setPotdPreview] = useState<ApprovedQuestion | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [loading, setLoading] = useState(true);

  const [annForm, setAnnForm] = useState({
    title: "",
    link: "",
    type: "important" as "important" | "recent",
    isNew: false,
    sortOrder: 0,
  });

  const fetchAll = useCallback(async () => {
    try {
      const [annRes, settingsRes, qRes] = await Promise.all([
        fetch("/api/admin/announcements", { credentials: "include" }),
        fetch("/api/admin/home-settings", { credentials: "include" }),
        fetch("/api/admin/questions", { credentials: "include" }),
      ]);

      if (annRes.ok) setAnnouncements(await annRes.json());

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setPotdId(s.problemOfTheDayId);
        setPotdPreview(s.problemOfTheDay);
        if (s.problemOfTheDayId) setSelectedQuestionId(s.problemOfTheDayId);
      }

      if (qRes.ok) {
        const qs = await qRes.json();
        setApprovedQuestions(qs.filter((q: ApprovedQuestion) => q.status === "approved"));
      }
    } catch {
      toast.error("Failed to load home management data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const setProblemOfTheDay = async (questionId: string | null) => {
    try {
      const res = await fetch("/api/admin/home-settings/problem-of-the-day", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchAll();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...annForm,
          showNewBadge: annForm.isNew,
        }),
      });
      if (res.ok) {
        toast.success("Announcement created");
        setAnnForm({ title: "", link: "", type: "important", isNew: false, sortOrder: 0 });
        fetchAll();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to create");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const toggleAnnouncement = async (id: string, patch: Partial<Announcement>) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (res.ok) fetchAll();
      else toast.error("Update failed");
    } catch {
      toast.error("Network error");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Deleted");
        fetchAll();
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8">Loading home settings…</p>;
  }

  return (
    <div className="space-y-8 w-full">
      <div>
        <h2 className="text-lg font-bold font-serif text-foreground">Home Page Management</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Control the problem of the day and announcements shown on the public home page.
        </p>
      </div>

      {/* Problem of the Day */}
      <div className="academic-card p-6">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Star size={16} className="text-primary" />
          Problem of the Day
        </h3>

        {potdPreview && (
          <div className="mb-4 p-3 border border-border rounded-sm bg-secondary/20 text-xs">
            <span className="text-muted-foreground">Current: </span>
            <span className="font-medium text-foreground">
              <LatexRenderer latex={potdPreview.title || ""} />
            </span>
            <span className="ml-2 px-1.5 py-0.5 border border-border rounded-sm text-[10px]">
              {potdPreview.difficulty}
            </span>
            {potdPreview.contentId && (
              <span className="ml-2 font-mono text-muted-foreground">{potdPreview.contentId}</span>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={selectedQuestionId}
            onChange={(e) => setSelectedQuestionId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
          >
            <option value="">Select an approved problem…</option>
            {approvedQuestions.map((q) => (
              <option key={q._id} value={q._id}>
                {q.title} ({q.difficulty})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setProblemOfTheDay(selectedQuestionId || null)}
            className="btn-primary px-4 py-2 text-xs shrink-0 w-full md:w-auto"
          >
            Set as Problem of the Day
          </button>
          {potdId && (
            <button
              type="button"
              onClick={() => {
                setSelectedQuestionId("");
                setProblemOfTheDay(null);
              }}
              className="px-4 py-2 text-xs border border-border rounded-sm hover:bg-secondary flex items-center justify-center gap-1 shrink-0 w-full md:w-auto"
            >
              <StarOff size={14} /> Clear
            </button>
          )}
        </div>
        {approvedQuestions.length === 0 && (
          <p className="mt-3 text-xs text-amber-600">
            No approved problems yet. Approve problems in the Approval Dashboard first.
          </p>
        )}
      </div>

      {/* Create announcement */}
      <div className="academic-card p-6">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Plus size={16} className="text-primary" />
          Add Announcement
        </h3>
        <form onSubmit={createAnnouncement} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold mb-1">Title</label>
            <input
              value={annForm.title}
              onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
              placeholder="Announcement title"
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Link (optional)</label>
            <input
              value={annForm.link}
              onChange={(e) => setAnnForm({ ...annForm, link: e.target.value })}
              placeholder="https://…"
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Section</label>
            <select
              value={annForm.type}
              onChange={(e) => setAnnForm({ ...annForm, type: e.target.value as "important" | "recent" })}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            >
              <option value="important">Important Announcements</option>
              <option value="recent">Recent Announcements</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Sort order</label>
            <input
              type="number"
              value={annForm.sortOrder}
              onChange={(e) => setAnnForm({ ...annForm, sortOrder: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isNew"
              checked={annForm.isNew}
              onChange={(e) => setAnnForm({ ...annForm, isNew: e.target.checked })}
              className="rounded-sm"
            />
            <label htmlFor="isNew" className="text-xs font-medium">
              Show &quot;New&quot; badge (recent section)
            </label>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary px-6 py-2 text-xs w-full sm:w-auto">
              Publish Announcement
            </button>
          </div>
        </form>
      </div>

      {/* Announcements list */}
      <div className="academic-card overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="font-bold text-sm">All Announcements</h3>
        </div>
        {announcements.length === 0 ? (
          <p className="p-6 text-xs text-muted-foreground text-center">
            No announcements yet. Create one above to show on the home page.
          </p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/10 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 font-medium">Title</th>
                <th className="py-2.5 px-4 font-medium">Section</th>
                <th className="py-2.5 px-4 font-medium">Active</th>
                <th className="py-2.5 px-4 font-medium">New</th>
                <th className="py-2.5 px-4 font-medium">Order</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {announcements.map((a) => (
                <tr key={a._id} className="hover:bg-secondary/20">
                  <td className="py-3 px-4 font-medium max-w-[200px] truncate">{a.title}</td>
                  <td className="py-3 px-4 capitalize">{a.type}</td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleAnnouncement(a._id, { isActive: !a.isActive })}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${a.isActive ? "bg-green-500/10 text-green-700 border-green-500/30" : "text-muted-foreground border-border"}`}
                    >
                      {a.isActive ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    {a.type === "recent" && (
                      <button
                        type="button"
                      onClick={() => toggleAnnouncement(a._id, { showNewBadge: !a.showNewBadge })}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${a.showNewBadge ? "bg-red-500/10 text-red-600 border-red-500/30" : "border-border"}`}
                    >
                      {a.showNewBadge ? "New" : "—"}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono">{a.sortOrder}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(a._id)}
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
