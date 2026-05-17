import { useState } from "react";
import { Link } from "react-router-dom";

const problems = [
  { id: "A", title: "Moment Generating Functions", topic: "Statistics", difficulty: "Easy", solves: 0 },
  { id: "B", title: "Matrix Rank and Nullity", topic: "Linear Algebra", difficulty: "Medium", solves: 0 },
  { id: "C", title: "Logistic Regression — Log-Likelihood", topic: "Machine Learning", difficulty: "Medium", solves: 0 },
  { id: "D", title: "Markov Chain Steady State", topic: "Probability", difficulty: "Hard", solves: 0 },
  { id: "E", title: "Pandas Multi-Index Operations", topic: "Python", difficulty: "Hard", solves: 0 },
];

const topParticipants = [
  { rank: 1, user: "priya_ml", solved: 4, score: 1200 },
  { rank: 2, user: "arjun_stat", solved: 4, score: 1150 },
  { rank: 3, user: "rohit_da", solved: 3, score: 900 },
  { rank: 4, user: "sanjana_cs", solved: 3, score: 870 },
  { rank: 5, user: "deepak_g", solved: 2, score: 600 },
];

export default function Contests() {
  const [registered, setRegistered] = useState(false);
  const [timeLeft] = useState({ h: 1, m: 42, s: 17 });
  const progress = ((3600 - timeLeft.h * 3600 - timeLeft.m * 60 - timeLeft.s) / 10800) * 100;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs font-mono text-muted-foreground mb-2">Contest · Active</div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            GATE DA Mock — Full Length #12
          </h1>
          <p className="text-muted-foreground text-sm">
            3-hour comprehensive mock examination covering the full GATE DA 2025 syllabus.
          </p>
        </div>
        <button
          onClick={() => setRegistered(!registered)}
          className={registered ? "btn-outline px-6 py-2" : "btn-primary px-6 py-2"}
        >
          {registered ? "Registered ✓" : "Register"}
        </button>
      </div>

      {/* Timer */}
      <div className="academic-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Time Remaining</span>
          <span className="font-mono text-lg font-medium text-foreground">
            {String(timeLeft.h).padStart(2, "0")}:{String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
          </span>
        </div>
        <div className="h-0.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>Start: 10:00 AM</span>
          <span>End: 1:00 PM</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Problem list */}
        <div className="md:col-span-2">
          <h2 className="font-serif text-lg font-bold mb-4 text-foreground">Problems</h2>
          <div className="academic-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal w-12">—</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Title</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Topic</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal">Pts</th>
                </tr>
              </thead>
              <tbody>
                {problems.map(p => (
                  <tr key={p.id} className="problem-row">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-foreground">{p.id}</td>
                    <td className="py-3 px-4">
                      <Link to="/problems/DA001" className="text-foreground hover:text-primary transition-colors duration-150">
                        {p.title}
                      </Link>
                      <div className={`text-xs mt-0.5 ${p.difficulty === "Hard" ? "text-primary" : "text-muted-foreground"}`}>
                        {p.difficulty}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="tag-pill">{p.topic}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground">
                      {p.difficulty === "Easy" ? 100 : p.difficulty === "Medium" ? 200 : 300}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 academic-card p-5">
            <h3 className="font-serif font-bold text-base mb-3 text-foreground">Contest Rules</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Duration: 3 hours from start time",
                "All problems carry equal partial credit",
                "Penalty: −50 points per wrong submission",
                "Rankings updated in real-time",
                "Final results published 30 minutes after contest end",
              ].map(r => (
                <li key={r} className="flex gap-2">
                  <span className="text-primary">—</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rankings */}
        <div>
          <h2 className="font-serif text-lg font-bold mb-4 text-foreground">Live Rankings</h2>
          <div className="academic-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left py-3 px-3 text-xs text-muted-foreground font-normal">#</th>
                  <th className="text-left py-3 px-3 text-xs text-muted-foreground font-normal">User</th>
                  <th className="text-right py-3 px-3 text-xs text-muted-foreground font-normal">Score</th>
                </tr>
              </thead>
              <tbody>
                {topParticipants.map(p => (
                  <tr key={p.user} className="problem-row">
                    <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{p.rank}</td>
                    <td className="py-2.5 px-3 text-xs text-foreground">{p.user}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono text-foreground">{p.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 academic-card p-4">
            <div className="text-xs text-muted-foreground mb-3">Upcoming Contests</div>
            {[
              { name: "Statistics Sprint #8", date: "Mar 5" },
              { name: "Linear Algebra Weekly", date: "Mar 9" },
            ].map(c => (
              <div key={c.name} className="flex justify-between py-2 border-b border-border-faint last:border-0 text-xs">
                <span className="text-foreground">{c.name}</span>
                <span className="text-muted-foreground">{c.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
