import { useState } from "react";

const users = [
  { rank: 1, user: "arjun_stat", rating: 2481, solved: 412, country: "IIT Bombay" },
  { rank: 2, user: "priya_ml", rating: 2356, solved: 389, country: "IIT Delhi" },
  { rank: 3, user: "rohit_da", rating: 2291, solved: 371, country: "IISc" },
  { rank: 4, user: "sanjana_cs", rating: 2188, solved: 344, country: "IIT Madras" },
  { rank: 5, user: "deepak_g", rating: 2102, solved: 312, country: "NIT Trichy" },
  { rank: 6, user: "meera_stat", rating: 2034, solved: 298, country: "IIT Kharagpur" },
  { rank: 7, user: "vikram_ml", rating: 1987, solved: 281, country: "BITS Pilani" },
  { rank: 8, user: "ananya_da", rating: 1921, solved: 267, country: "IIT Hyderabad" },
  { rank: 9, user: "kiran_python", rating: 1876, solved: 254, country: "IIT Roorkee" },
  { rank: 10, user: "pooja_stat", rating: 1823, solved: 241, country: "IIT BHU" },
  { rank: 11, user: "suresh_cs", rating: 1789, solved: 233, country: "NIT Warangal" },
  { rank: 12, user: "lakshmi_ml", rating: 1742, solved: 221, country: "IIT Guwahati" },
  { rank: 13, user: "rahul_da", rating: 1698, solved: 208, country: "IIT Indore" },
  { rank: 14, user: "divya_stat", rating: 1654, solved: 196, country: "TIFR" },
  { rank: 15, user: "arun_math", rating: 1612, solved: 184, country: "ISI Kolkata" },
];

const periods = ["All Time", "This Month", "This Week"];

export default function Leaderboard() {
  const [period, setPeriod] = useState("All Time");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs font-mono text-muted-foreground mb-1">Rankings</div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Ranked by contest rating across all GATE DA contests.</p>
        </div>
        <div className="flex border border-border rounded-sm overflow-hidden text-xs">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 transition-colors duration-150 ${period === p ? "bg-secondary text-foreground font-medium" : "bg-card text-muted-foreground hover:bg-secondary/60"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="academic-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal w-16">Rank</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal">Username</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-normal hidden md:table-cell">Institution</th>
              <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal">Rating</th>
              <th className="text-right py-3 px-4 text-xs text-muted-foreground font-normal hidden sm:table-cell">Solved</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user} className="problem-row">
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                  {u.rank <= 3 ? (
                    <span className={u.rank === 1 ? "text-foreground font-bold" : "text-foreground/70"}>
                      {u.rank}
                    </span>
                  ) : u.rank}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-foreground ${u.rank <= 3 ? "font-medium" : ""}`}>{u.user}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{u.country}</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-foreground">{u.rating}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">{u.solved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing 15 of 4,821 users</span>
        <div className="flex gap-1">
          <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">←</button>
          <button className="px-3 py-1.5 border border-border rounded-sm bg-secondary font-medium text-foreground">1</button>
          <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">2</button>
          <button className="px-3 py-1.5 border border-border rounded-sm hover:bg-secondary transition-colors">→</button>
        </div>
      </div>
    </div>
  );
}
