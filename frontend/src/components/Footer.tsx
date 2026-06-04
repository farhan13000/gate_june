import { Link } from "react-router-dom";
import { ArrowUpRight, BarChart3, BookOpen, CalendarDays, Mail, Trophy } from "lucide-react";
import { SiteContainer } from "@/components/layout";

const studyLinks = [
  { label: "Problems", href: "/problems", icon: BookOpen },
  { label: "Theory", href: "/theory", icon: BookOpen },
  { label: "Contests", href: "/contests", icon: Trophy },
  { label: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
];

const platformLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Announcements", href: "/announcements" },
  { label: "Discuss", href: "/discuss" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#dbe4ee] bg-[#f8fafc] text-sm text-[#64748b]">
      <SiteContainer className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(13rem,0.55fr)] lg:items-start">
          <div className="border border-[#dbe4ee] bg-white p-5 shadow-sm">
            <Link to="/" className="inline-flex text-lg font-bold uppercase tracking-[0.1em] text-[#10213f]">
              GATE <span className="text-[#0b6fe8]">DA</span>
            </Link>
            <p className="mt-3 max-w-lg leading-6">
              Focused preparation for GATE Data Science and AI with structured practice, contests, theory, and performance analytics.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase text-[#0b6fe8]">
                Exam aligned
              </span>
              <span className="rounded-sm border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase text-[#64748b]">
                Practice driven
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-[#dbe4ee] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#10213f]">Study</h3>
              <nav className="mt-4 grid gap-2" aria-label="Study links">
                {studyLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    to={href}
                    className="group flex items-center justify-between rounded-sm border border-transparent px-0 py-1.5 transition hover:border-[#dbeafe] hover:bg-[#f8fbff] hover:px-2 hover:text-[#0b6fe8]"
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={15} className="text-[#0b6fe8]" />
                      {label}
                    </span>
                    <ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border border-[#dbe4ee] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#10213f]">Platform</h3>
              <nav className="mt-4 grid gap-2" aria-label="Platform links">
                {platformLinks.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex items-center justify-between rounded-sm border border-transparent px-0 py-1.5 transition hover:border-[#dbeafe] hover:bg-[#f8fbff] hover:px-2 hover:text-[#0b6fe8]"
                  >
                    {item.label}
                    <ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="border border-[#dbe4ee] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#10213f]">Stay Updated</h3>
            <p className="mt-3 leading-6">
              Check announcements for contest notices, platform changes, and study updates.
            </p>
            <Link
              to="/announcements"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#0b6fe8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0959bb]"
            >
              <CalendarDays size={16} />
              View Updates
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[#dbe4ee] pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[#64748b]">Copyright {new Date().getFullYear()} GATE DA. All rights reserved.</div>
          <a
            href="mailto:support@gateda.example.org"
            className="inline-flex w-fit items-center gap-2 font-medium text-[#475569] transition hover:text-[#0b6fe8]"
          >
            <Mail size={14} />
            support@gateda.example.org
          </a>
        </div>
      </SiteContainer>
    </footer>
  );
}
