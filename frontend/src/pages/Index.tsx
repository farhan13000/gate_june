import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  Calculator,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Cpu,
  FileText,
  Loader2,
  MessageCircle,
  PieChart,
  Sigma,
  Sparkles,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";
import EmptyState from "@/components/home/EmptyState";
import type { HomeData } from "@/types/home";

const POLL_MS = 30_000;

const topicCards = [
  { title: "Probability", icon: BarChart3, count: "120+ Problems" },
  { title: "Statistics", icon: PieChart, count: "150+ Problems" },
  { title: "Linear Algebra", icon: Calculator, count: "90+ Problems" },
  { title: "Calculus", icon: Sigma, count: "80+ Problems" },
  { title: "Data Analysis", icon: TrendingUp, count: "110+ Problems" },
  { title: "Machine Learning", icon: Cpu, count: "70+ Problems" },
];

const quickAccessItems = [
  { title: "Browse Problems", description: "Practice topic-wise problems", icon: BookOpen, path: "/problems" },
  { title: "Read Theory", description: "Learn concepts with deep notes", icon: FileText, path: "/theory" },
  { title: "Formula Sheet", description: "Important formulas at your fingertips", icon: Sigma, path: "/" },
  { title: "Practice Sets", description: "Curated sets for targeted practice", icon: ClipboardList, path: "/contests" },
  { title: "Performance", description: "Track your strengths and growth", icon: BarChart3, path: "/dashboard" },
  { title: "Discuss", description: "Ask, share and learn with peers", icon: MessageCircle, path: "/discuss" },
];

function NormalCurveChart() {
  return (
    <svg
      viewBox="0 0 360 140"
      className="block h-auto w-full max-w-[220px]"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M24 120 C90 50 150 25 210 65 C250 95 292 120 336 120" fill="none" stroke="#2563eb" strokeWidth="2.5" />
      <path
        d="M26 120 C90 60 150 35 214 70 C250 98 292 118 334 120 L334 128 L26 128 Z"
        fill="url(#curveGradient)"
      />
      <line x1="120" y1="8" x2="120" y2="120" stroke="#4f46e5" strokeDasharray="3 3" strokeWidth="1" />
      <line x1="240" y1="18" x2="240" y2="120" stroke="#4f46e5" strokeDasharray="3 3" strokeWidth="1" />
      <circle cx="120" cy="65" r="2.5" fill="#2563eb" />
      <circle cx="240" cy="82" r="2.5" fill="#2563eb" />
      <text x="118" y="6" fill="#475569" fontSize="10" textAnchor="middle">
        μ-σ
      </text>
      <text x="180" y="6" fill="#475569" fontSize="10" textAnchor="middle">
        μ
      </text>
      <text x="242" y="12" fill="#475569" fontSize="10" textAnchor="middle">
        μ+σ
      </text>
    </svg>
  );
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K+`;
  return `${n}+`;
}

const diffStyles: Record<string, string> = {
  Easy: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  Medium: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  Hard: "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]",
};

function AnnouncementLink({
  title,
  link,
  date,
  isNew,
}: {
  title: string;
  link?: string;
  date: string;
  isNew?: boolean;
}) {
  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span className="font-medium text-[#2563eb]">{title}</span>
        {isNew && (
          <span className="shrink-0 rounded-none bg-[#fef2f2] px-1 py-0.5 text-[9px] font-semibold uppercase text-[#dc2626]">
            New
          </span>
        )}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-[#94a3b8]">[{date}]</span>
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-2 text-xs hover:underline"
      >
        {inner}
      </a>
    );
  }

  return <div className="flex items-start justify-between gap-2 text-xs">{inner}</div>;
}

export default function Index() {
  const [home, setHome] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHome = useCallback(async () => {
    try {
      const res = await fetch("/api/home");
      if (res.ok) {
        const data: HomeData = await res.json();
        setHome(data);
      }
    } catch (err) {
      console.error("Failed to load home data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHome();
    const id = setInterval(fetchHome, POLL_MS);
    return () => clearInterval(id);
  }, [fetchHome]);

  const potd = home?.problemOfTheDay;
  const contests = home?.contests ?? [];
  const important = home?.importantAnnouncements ?? [];
  const recent = home?.recentAnnouncements ?? [];
  const stats = home?.stats;

  const statsItems = stats
    ? [
        { label: formatStat(stats.problems), description: "Problems", icon: BookOpen },
        { label: formatStat(stats.theories), description: "Theory Articles", icon: FileText },
        { label: formatStat(stats.contests), description: "Mock Contests", icon: Trophy },
        { label: formatStat(stats.users), description: "Active Aspirants", icon: Users },
      ]
    : [];

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#111111]">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
          <div className="space-y-6">
            {/* Problem of the Day */}
            <section className="rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-[#0f172a]">Problem of the Day</h2>
                {potd && (
                  <span
                    className={`rounded-none border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${diffStyles[potd.difficulty] || diffStyles.Medium}`}
                  >
                    {potd.difficulty}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-[#64748b]">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading today&apos;s problem…</span>
                </div>
              ) : potd ? (
                <>
                  <div className={potd.imageUrl ? "grid gap-4 md:grid-cols-[1fr_auto] md:items-start" : "space-y-3"}>
                    <div className="min-w-0 space-y-3">
                      <div className="text-sm leading-relaxed text-[#0f172a]">
                        <LatexRenderer latex={potd.statement} />
                      </div>
                      {potd.topic && (
                        <div className="rounded-none border border-[#e2e8f0] bg-[#f0f6ff] px-3 py-2 text-xs text-[#475569]">
                          Topic: <span className="font-medium text-[#0f172a]">{potd.topic}</span>
                        </div>
                      )}
                    </div>

                    {potd.imageUrl && (
                      <div className="h-fit shrink-0 self-start rounded-none border border-[#e2e8f0] bg-[#f8fbff] p-2">
                        <div className="rounded-none border border-[#e2e8f0] bg-white p-2">
                          <img
                            src={potd.imageUrl}
                            alt="Problem illustration"
                            className="max-h-[140px] w-full max-w-[220px] object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {potd.questionType !== "NAT" && potd.options && potd.options.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {potd.options.slice(0, 4).map((opt, idx) => (
                        <div
                          key={opt._id || idx}
                          className="rounded-none border border-[#e2e8f0] bg-white px-3 py-2"
                        >
                          <div className="text-[9px] font-medium uppercase tracking-wider text-[#94a3b8]">
                            Option {optionLabels[idx]}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-[#0f172a]">
                            <LatexRenderer latex={opt.text} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : potd.questionType === "NAT" ? (
                    <p className="mt-4 text-xs text-[#64748b]">Numerical answer — open the problem to submit your value.</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/problems/${potd._id}`}
                      className="inline-flex items-center justify-center rounded-none border border-[#2563eb] bg-white px-4 py-2 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                    >
                      View Explanation
                    </Link>
                    <Link
                      to={`/problems/${potd._id}`}
                      className="inline-flex items-center justify-center rounded-none bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
                    >
                      Try Now
                    </Link>
                  </div>
                </>
              ) : (
                <EmptyState
                  variant="panel"
                  icon={BookOpen}
                  title="Today's featured problem coming soon"
                  description="A hand-picked GATE DA question will appear here each day—complete with options, difficulty tag, and a direct link to practice."
                  hints={[
                    "MCQ, MSQ, and NAT formats from the live bank",
                    "Curated for exam-level rigor and syllabus coverage",
                  ]}
                  action={{ label: "Browse all problems", to: "/problems" }}
                />
              )}
            </section>

            {/* Stats bar */}
            <section className="rounded-none border border-[#e2e8f0] bg-white px-5 py-4 shadow-sm">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {statsItems.map((item) => (
                    <div key={item.description} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-[#eff6ff] text-[#2563eb]">
                        <item.icon size={18} />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#0f172a]">{item.label}</p>
                        <p className="text-xs text-[#64748b]">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-[#0f172a]">Your Progress</h2>
                <div className="mt-5 space-y-5">
                  {[
                    { label: "Problems Solved", value: "342 / 1200", percent: 28, color: "bg-[#2563eb]" },
                    { label: "Accuracy", value: "78.6%", percent: 79, color: "bg-[#22c55e]" },
                    { label: "Mock Score (Avg.)", value: "62.4 / 100", percent: 62, color: "bg-[#2563eb]" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#64748b]">
                        <span>{item.label}</span>
                        <span className="font-semibold text-[#0f172a]">{item.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-none bg-[#e2e8f0]">
                        <div className={`h-full rounded-none ${item.color}`} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 rounded-none border border-[#e2e8f0] bg-[#f8fbff] px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-none bg-[#eff6ff] text-[#2563eb]">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0f172a]">Current Streak</p>
                      <p className="text-sm text-[#475569]">
                        <Link to="/dashboard" className="text-[#2563eb] hover:underline">
                          View on Dashboard
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-[#0f172a]">Topic Navigator</h2>
                  <Link to="/problems" className="text-xs font-semibold text-[#2563eb] hover:underline">
                    View All
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {topicCards.map((topic) => {
                    const Icon = topic.icon;
                    return (
                      <Link
                        key={topic.title}
                        to="/problems"
                        className="group rounded-none border border-[#e2e8f0] bg-[#f8fbff] p-3 transition hover:border-[#2563eb] hover:bg-white"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-none bg-[#eff6ff] text-[#2563eb]">
                          <Icon size={16} />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-[#0f172a]">{topic.title}</p>
                        <p className="mt-0.5 text-[10px] text-[#64748b]">{topic.count}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#0f172a]">Upcoming Contests</h2>
                <Link to="/contests" className="text-xs font-semibold text-[#2563eb] hover:underline">
                  View All
                </Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
                </div>
              ) : contests.length > 0 ? (
                <div className="space-y-3">
                  {contests.map((contest) => (
                    <Link
                      key={contest._id}
                      to="/contests"
                      className="flex items-center justify-between gap-3 rounded-none border border-[#e2e8f0] bg-[#f8fbff] p-3 transition hover:border-[#2563eb] hover:bg-white"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-none border border-[#e2e8f0] bg-white text-center">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                            {contest.month}
                          </span>
                          <span className="text-sm font-bold text-[#2563eb]">{contest.day}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#0f172a]">{contest.title}</p>
                          <p className="mt-0.5 text-[10px] text-[#64748b]">{contest.meta}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[9px] font-medium text-[#64748b]">Starts in</p>
                        <p className="mt-0.5 font-mono text-[10px] font-semibold text-[#0f172a]">
                          {contest.countdown}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  variant="panel"
                  icon={CalendarDays}
                  title="No contests scheduled yet"
                  description="Weekly mocks, sectional tests, and full-length GATE DA simulations will be listed here with live countdowns."
                  hints={[
                    "Full-length mocks (65 questions · 3 hours)",
                    "Topic-wise sectional challenges",
                    "Rated practice windows with leaderboards",
                  ]}
                  action={{ label: "Explore contest hub", to: "/contests" }}
                />
              )}
            </section>

            <section className="rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-none bg-[#eff6ff] text-[#2563eb]">
                  <Award size={16} />
                </div>
                <h2 className="text-sm font-semibold text-[#0f172a]">Important Announcements</h2>
              </div>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
                </div>
              ) : important.length > 0 ? (
                <ul className="space-y-2">
                  {important.map((item) => (
                    <li key={item._id}>
                      <AnnouncementLink title={item.title} link={item.link} date={item.date} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  variant="compact"
                  icon={Award}
                  title="No critical updates right now"
                  statusLabel="Clear"
                  description="Important exam notices—registration windows, syllabus changes, and official GATE DA deadlines—will be highlighted here as they are published."
                  hints={[
                    "GATE 2026 registration & admit card dates",
                    "Syllabus revisions and exam pattern changes",
                    "Official mock schedules and proctoring rules",
                  ]}
                />
              )}
            </section>

            <section className="rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-none bg-[#eff6ff] text-[#2563eb]">
                  <MessageCircle size={16} />
                </div>
                <h2 className="text-sm font-semibold text-[#0f172a]">Recent Announcements</h2>
              </div>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
                </div>
              ) : recent.length > 0 ? (
                <ul className="space-y-2">
                  {recent.map((item) => (
                    <li key={item._id}>
                      <AnnouncementLink title={item.title} link={item.link} date={item.date} isNew={item.isNew} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  variant="compact"
                  icon={MessageCircle}
                  title="You're up to date"
                  statusLabel="Fresh"
                  description="Latest platform news, new problem drops, and contest openings appear in this feed—newest items marked when published."
                  hints={[
                    "New mock tests and weekly challenge drops",
                    "Fresh theory chapters and problem sets",
                    "Community highlights and preparation tips",
                  ]}
                />
              )}
            </section>
          </div>
        </div>

        <section className="mt-6 rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#0f172a]">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  className="group flex flex-col rounded-none border border-[#e2e8f0] bg-[#f8fbff] p-3 transition hover:border-[#2563eb] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-none bg-[#eff6ff] text-[#2563eb]">
                      <Icon size={16} />
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-[#2563eb] opacity-0 transition group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#0f172a]">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#64748b]">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
