import { BookOpenCheck, Calculator, Flag, LineChart, Medal, ShieldCheck, Trophy } from "lucide-react";

const contestTypes = [
  {
    title: "Practice Contest",
    tag: "Unrated",
    Icon: BookOpenCheck,
    use: "Revision rounds, topic drills, classroom practice, and low-pressure timed solving.",
    rules: ["Registration can stay optional.", "Instant feedback may be enabled.", "No rating change is applied."],
  },
  {
    title: "Rated Live Contest",
    tag: "Rated",
    Icon: Trophy,
    use: "Scheduled competitive rounds where rank and rating both matter.",
    rules: ["Registration and check-in are required.", "Ranks are finalized after review.", "Rating changes apply only once."],
  },
  {
    title: "GATE Mock Test",
    tag: "Exam Style",
    Icon: Medal,
    use: "Full-length or sectional GATE DA simulations with exam-style marking.",
    rules: ["Supports MCQ, MSQ, and NAT.", "Score follows question marking schemes.", "Solutions unlock after answer-key release."],
  },
  {
    title: "Challenge Round",
    tag: "Claims",
    Icon: ShieldCheck,
    use: "High-stakes rounds where answer keys can be challenged before final ranks.",
    rules: ["Open claims after key release.", "Review each claim with an admin response.", "Finalize ranks after claims close."],
  },
];

const lifecycle = [
  ["Draft", "Prepare title, timing, rules, and problem set."],
  ["Published", "Contest appears in the public hub."],
  ["Registration", "Users register before the contest window."],
  ["Live", "Registered users enter and submit answers."],
  ["Ended", "Submissions close and standings are computed."],
  ["Answer Key", "Official answers and solutions are released."],
  ["Claims", "Users submit answer-key or marking claims."],
  ["Finalized", "Ranks are locked and ratings can be applied."],
];

const rankExample = [
  ["Aarav", "62.00", "18", "82", "#1"],
  ["Meera", "62.00", "18", "96", "#2"],
  ["Kabir", "59.33", "17", "70", "#3"],
];

export default function AdminContestGuide() {
  return (
    <div className="w-full space-y-6">
      <section className="rounded-sm border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-1 text-xs font-mono uppercase tracking-wide text-muted-foreground">Contest Protocol</div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Rules, Ranking, Rating, and Strategy</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Use this page as the admin operating guide before publishing a contest. The manager page is for actions; this page explains the formula and the lifecycle in simple terms.
            </p>
          </div>
          <div className="rounded-sm border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
            Industry-style flow: register, compete, review, finalize
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {contestTypes.map(({ title, tag, Icon, use, rules }) => (
          <article key={title} className="rounded-sm border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-secondary/30 text-primary">
                <Icon size={18} />
              </span>
              <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                {tag}
              </span>
            </div>
            <h3 className="font-serif text-base font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{use}</p>
            <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {rules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <div className="academic-card p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Calculator size={16} className="text-primary" />
              <h3 className="font-serif text-lg font-bold text-foreground">Ranking Formula</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-sm border border-border bg-background p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Primary</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Higher score wins</div>
                <p className="mt-1 text-xs text-muted-foreground">Score is calculated from each problem marking scheme.</p>
              </div>
              <div className="rounded-sm border border-border bg-background p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Tie 1</div>
                <div className="mt-1 text-sm font-semibold text-foreground">More solved wins</div>
                <p className="mt-1 text-xs text-muted-foreground">Useful when scores are equal after partial marking.</p>
              </div>
              <div className="rounded-sm border border-border bg-background p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Tie 2</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Lower penalty wins</div>
                <p className="mt-1 text-xs text-muted-foreground">Penalty rewards faster correct solving with fewer wrong attempts.</p>
              </div>
            </div>
            <div className="mt-4 rounded-sm border border-border bg-secondary/20 p-3 font-mono text-xs text-foreground">
              penalty = accepted minute + wrong attempts before correct x wrong penalty minutes
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    <th className="px-3 py-2 text-right">Solved</th>
                    <th className="px-3 py-2 text-right">Penalty</th>
                    <th className="px-3 py-2 text-right">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rankExample.map(([name, score, solved, penalty, rank]) => (
                    <tr key={name}>
                      <td className="px-3 py-2 font-semibold text-foreground">{name}</td>
                      <td className="px-3 py-2 text-right font-mono">{score}</td>
                      <td className="px-3 py-2 text-right font-mono">{solved}</td>
                      <td className="px-3 py-2 text-right font-mono">{penalty}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary">{rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="academic-card p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <LineChart size={16} className="text-primary" />
              <h3 className="font-serif text-lg font-bold text-foreground">Rating Formula</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Rating uses an Elo-style expectation. A contestant gains more rating by finishing above stronger contestants and loses more by finishing below weaker contestants. Changes are capped so one contest cannot create extreme movement.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-sm border border-border bg-background p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Expectation</div>
                <div className="mt-1 break-words font-mono text-xs text-foreground">
                  E = 1 / (1 + 10^((opponentRating - rating) / 400))
                </div>
              </div>
              <div className="rounded-sm border border-border bg-background p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Delta</div>
                <div className="mt-1 break-words font-mono text-xs text-foreground">delta = K x (actual - expected)</div>
              </div>
            </div>
            <div className="mt-4 rounded-sm border border-primary/20 bg-primary/10 p-3 text-xs leading-relaxed text-primary">
              Example: a 1500-rated user beating a 1600-rated user gains more than beating a 1400-rated user. New users move faster; high-rated users move slower.
            </div>
          </div>
        </div>

        <aside className="academic-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Flag size={16} className="text-primary" />
            <h3 className="font-serif text-lg font-bold text-foreground">Lifecycle Checklist</h3>
          </div>
          <div>
            {lifecycle.map(([title, description], index) => (
              <div key={title} className="relative flex gap-3 pb-4 last:pb-0">
                {index < lifecycle.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" />}
                <span className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border border-primary bg-background shadow-[0_0_9px_hsl(var(--primary)/0.28)]" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{title}</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
