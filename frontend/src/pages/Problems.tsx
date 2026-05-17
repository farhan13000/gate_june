import { useState } from "react";
import { Link } from "react-router-dom";
import { Filter, ChevronDown } from "lucide-react";

const problems = [
  { id: "DA001", title: "Maximum Likelihood Estimation", topic: "Statistics", difficulty: "Easy", solves: 1842 },
  { id: "DA002", title: "Eigenvalue Decomposition", topic: "Linear Algebra", difficulty: "Medium", solves: 956 },
  { id: "DA003", title: "Gradient Descent Convergence", topic: "Optimization", difficulty: "Hard", solves: 423 },
  { id: "DA004", title: "Bayes' Theorem Application", topic: "Probability", difficulty: "Easy", solves: 2104 },
  { id: "DA005", title: "PCA Dimensionality Reduction", topic: "Machine Learning", difficulty: "Medium", solves: 788 },
  { id: "DA006", title: "SQL Window Functions", topic: "Databases", difficulty: "Medium", solves: 1233 },
  { id: "DA007", title: "Hypothesis Testing — Type II Error", topic: "Statistics", difficulty: "Hard", solves: 312 },
  { id: "DA008", title: "Pandas GroupBy Aggregation", topic: "Python", difficulty: "Easy", solves: 3210 },
  { id: "DA009", title: "Random Variable Transformations", topic: "Probability", difficulty: "Medium", solves: 611 },
  { id: "DA010", title: "Singular Value Decomposition", topic: "Linear Algebra", difficulty: "Hard", solves: 298 },
  { id: "DA011", title: "Decision Tree Gini Index", topic: "Machine Learning", difficulty: "Medium", solves: 874 },
  { id: "DA012", title: "Normal Distribution CDF", topic: "Statistics", difficulty: "Easy", solves: 2567 },
];

const topics = ["All Topics", "Statistics", "Linear Algebra", "Probability", "Machine Learning", "Databases", "Python", "Optimization"];
const difficulties = ["All Difficulties", "Easy", "Medium", "Hard"];
const statuses = ["All", "Solved", "Unsolved"];

export default function Problems() {
  const [topic, setTopic] = useState("All Topics");
  const [difficulty, setDifficulty] = useState("All Difficulties");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = problems.filter(p => {
    if (topic !== "All Topics" && p.topic !== topic) return false;
    if (difficulty !== "All Difficulties" && p.difficulty !== difficulty) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const diffClass = (d: string) => {
    if (d === "Easy") return "difficulty-easy";
    if (d === "Medium") return "difficulty-medium";
    return "difficulty-hard";
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
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal w-20">ID</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Title</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal hidden sm:table-cell">Topic</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Difficulty</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal hidden md:table-cell">Solves</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="problem-row">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.id}</td>
                    <td className="py-3 px-4">
                      <Link to={`/problems/${p.id}`} className="text-foreground hover:text-primary transition-colors duration-150 font-medium">
                        {p.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="tag-pill">{p.topic}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={diffClass(p.difficulty)}>{p.difficulty}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">{p.solves.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-muted-foreground text-sm">No problems match the selected filters.</div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {problems.length} problems</span>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">←</button>
              <button className="px-3 py-1.5 border border-border rounded-sm bg-secondary font-medium text-foreground">1</button>
              <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">2</button>
              <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
