import { Link } from "react-router-dom";
import { BookOpen, Clock, BarChart3, CheckSquare, Cpu } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Topic-wise Practice", desc: "Structured problems organized by GATE syllabus topics and subtopics." },
  { icon: BookOpen, title: "Structured Theory", desc: "Rigorous theory pages written in research-paper style with theorems and proofs." },
  { icon: Clock, title: "Timed Contests", desc: "Full-length and sectional mock tests with real GATE exam conditions." },
  { icon: CheckSquare, title: "Detailed Solutions", desc: "Step-by-step editorial solutions with mathematical derivations." },
  { icon: BarChart3, title: "AI Performance Analysis", desc: "Identify weak topics and track rating progress over time." },
  { icon: Cpu, title: "Data Analytics Focus", desc: "Specialized content for GATE DA: Statistics, ML, Python, SQL, and more." },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="text-xs font-mono text-muted-foreground mb-4 tracking-widest uppercase">
            GATE 2025 — Data Analytics
          </div>
          <h1 className="font-serif text-5xl font-bold leading-tight text-foreground mb-6">
            A Structured Platform for GATE Data Analytics
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Prepare with rigour. Practice with purpose. Master the GATE DA syllabus through structured theory, curated problems, and analytical feedback designed for serious aspirants.
          </p>
          <div className="flex gap-3">
            <Link to="/problems" className="btn-primary px-6 py-2.5 text-sm">
              Browse Problems
            </Link>
            <Link to="/theory" className="btn-outline px-6 py-2.5 text-sm">
              Read Theory
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-8 border-t border-border pt-8">
            {[["1,200+", "Problems"], ["85+", "Theory Articles"], ["40+", "Mock Contests"]].map(([val, label]) => (
              <div key={label}>
                <div className="font-serif text-2xl font-bold text-foreground">{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wireframe illustration */}
        <div className="hidden md:block">
          <div className="border border-border bg-card p-6 rounded-sm">
            <div className="text-xs font-mono text-muted-foreground mb-4">— problem statement</div>
            <div className="space-y-2 mb-6">
              <div className="h-3 bg-secondary rounded-sm w-full" />
              <div className="h-3 bg-secondary rounded-sm w-5/6" />
              <div className="h-3 bg-secondary rounded-sm w-4/6" />
            </div>
            <div className="border border-border rounded-sm p-3 mb-4 bg-secondary/30">
              <div className="text-xs font-mono text-muted-foreground mb-2">Given: X ~ N(μ, σ²)</div>
              <div className="text-xs font-mono text-foreground">P(X &gt; μ + σ) = 1 − Φ(1) ≈ 0.1587</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["Easy", "Medium", "Hard"].map((d, i) => (
                <div key={d} className={`text-center py-2 border rounded-sm text-xs ${i === 2 ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-secondary rounded-sm" />
              <div className="w-20 h-8 bg-primary rounded-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary border-t border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Platform Features</h2>
          <p className="text-muted-foreground text-sm mb-10">Everything you need for a focused, structured GATE DA preparation.</p>
          <div className="grid md:grid-cols-3 gap-px bg-border">
            {features.map((f) => (
              <div key={f.title} className="bg-card p-6 hover:bg-secondary/40 transition-colors duration-150">
                <f.icon size={18} className="text-primary mb-3" strokeWidth={1.5} />
                <h3 className="font-serif font-bold text-foreground mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent contests preview */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-serif text-xl font-bold mb-6 text-foreground">Upcoming Contests</h2>
          <div className="space-y-3">
            {[
              { name: "GATE DA Mock — Full Length #12", date: "Mar 2, 2025", duration: "3 hrs" },
              { name: "Statistics Sprint #8", date: "Mar 5, 2025", duration: "90 min" },
              { name: "Linear Algebra Weekly", date: "Mar 9, 2025", duration: "60 min" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between border border-border p-4 bg-card rounded-sm hover:bg-secondary/30 transition-colors duration-150">
                <div>
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.date} · {c.duration}</div>
                </div>
                <Link to="/contests" className="btn-outline text-xs py-1 px-3">Register</Link>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold mb-6 text-foreground">Top Rated This Month</h2>
          <div className="academic-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Rank</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">User</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal">Rating</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["1", "arjun_stat", "2481"],
                  ["2", "priya_ml", "2356"],
                  ["3", "rohit_da", "2291"],
                  ["4", "sanjana_cs", "2188"],
                  ["5", "deepak_g", "2102"],
                ].map(([rank, user, rating]) => (
                  <tr key={user} className="problem-row">
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{rank}</td>
                    <td className="py-3 px-4 text-foreground">{user}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-foreground">{rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <span className="font-serif font-bold text-lg">GATE <span className="text-primary">DA</span></span>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
              A focused preparation platform for GATE Data Analytics aspirants.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div className="space-y-2">
              <div className="text-xs font-medium text-foreground mb-3">Practice</div>
              {["Problems", "Contests", "Archives"].map(l => (
                <Link key={l} to="/" className="block text-muted-foreground hover:text-foreground transition-colors duration-150 text-xs">{l}</Link>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-foreground mb-3">Learn</div>
              {["Theory", "Editorials", "Discuss"].map(l => (
                <Link key={l} to="/" className="block text-muted-foreground hover:text-foreground transition-colors duration-150 text-xs">{l}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-3 text-xs text-muted-foreground">
            © 2025 GATE DA Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
