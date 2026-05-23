import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Filter } from "lucide-react";
import LatexRenderer from "../components/LatexRenderer";

const topics = ["All Topics", "Statistics", "Linear Algebra", "Probability", "Machine Learning", "Databases", "Python", "Optimization"];
const difficulties = ["All Difficulties", "Easy", "Medium", "Hard"];
const statuses = ["All", "Solved", "Unsolved"];

const parseTopics = (topicString?: string) => {
  if (!topicString) return [];
  return topicString
    .split(/\s*(?:[,+&\/])\s*/)
    .map((topic) => topic.trim())
    .filter(Boolean);
};

const getProblemNumber = (id: string) => {
  try {
    const hex = id.slice(-6);
    const n = parseInt(hex, 16);
    return String(n).padStart(6, "0");
  } catch (e) {
    return id.slice(0, 6);
  }
};

export default function Problems() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [topic, setTopic] = useState("All Topics");
  const [difficulty, setDifficulty] = useState("All Difficulties");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/problems")
      .then(res => res.json())
      .then(data => {
        setProblems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching problems", err);
        setLoading(false);
      });
  }, []);

  const filtered = problems.filter(p => {
    if (topic !== "All Topics") {
      const pTopics = parseTopics(p.topic).map(t => t.toLowerCase());
      if (!pTopics.includes(topic.toLowerCase())) return false;
    }
    if (difficulty !== "All Difficulties" && p.difficulty !== difficulty) return false;
    // allow searching by title or numeric id (e.g. #123 or 123)
    if (search) {
      const s = search.trim();
      const asNum = s.replace(/^#/, "");
      const pn = getProblemNumber(p._id);
      if (/^#?\d+$/.test(s)) {
        if (!pn.includes(asNum)) return false;
      } else {
        if (!p.title.toLowerCase().includes(s.toLowerCase())) return false;
      }
    }
    // status filter (requires problem to include solved boolean; fallback: treat as unsolved)
    if (status === "Solved") {
      if (!p.solved) return false;
    }
    if (status === "Unsolved") {
      if (p.solved) return false;
    }
    return true;
  });

  const diffClass = (d: string) => {
    if (d === "Easy") return "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
    if (d === "Medium") return "bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
    return "bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 rounded-sm font-sans font-semibold text-[11px] px-2 py-0.5";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Problems</h1>
        <p className="text-muted-foreground text-sm">Practice GATE DA questions organized by topic and difficulty.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="w-52 shrink-0 hidden md:block">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-medium text-foreground mb-3 flex items-center gap-1.5">
                <Filter size={12} /> Topic
              </div>
              <div className="space-y-1">
                {topics.map(t => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`block w-full text-left text-xs py-1.5 px-2 rounded-sm transition-colors duration-150 ${topic === t ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="section-divider my-4" />

            <div>
              <div className="text-xs font-medium text-foreground mb-3">Difficulty</div>
              <div className="space-y-1">
                {difficulties.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`block w-full text-left text-xs py-1.5 px-2 rounded-sm transition-colors duration-150 ${difficulty === d ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="section-divider my-4" />

            <div>
              <div className="text-xs font-medium text-foreground mb-3">Status</div>
              <div className="space-y-1">
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`block w-full text-left text-xs py-1.5 px-2 rounded-sm transition-colors duration-150 ${status === s ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main table */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border bg-card rounded-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>

          <div className="academic-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">ID</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Title</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal hidden sm:table-cell">Topic</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Difficulty</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal hidden md:table-cell">Upvotes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">Loading problems...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">No problems match the selected filters.</td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p._id} className="problem-row">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">#{getProblemNumber(p._id)}</td>
                      <td className="py-3 px-4">
                        <Link to={`/problems/${p._id}`} className="text-foreground hover:text-primary transition-colors duration-150 font-medium">
                          <LatexRenderer latex={p.title} />
                        </Link>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {p.topic ? parseTopics(p.topic).map((subTopic: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-0.5 border border-border bg-card text-foreground/80 rounded-sm font-sans font-semibold transition-all"
                            >
                              {subTopic}
                            </span>
                          )) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={diffClass(p.difficulty)}>{p.difficulty}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">{p.upvotes || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {filtered.length} of {problems.length} problems</span>
              <div className="flex gap-1">
                <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">←</button>
                <button className="px-3 py-1.5 border border-border rounded-sm bg-secondary font-medium text-foreground">1</button>
                <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
