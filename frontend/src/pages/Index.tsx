import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, ExternalLink, Loader2, Megaphone, Target } from "lucide-react";
import HeroGeometry from "@/components/home/HeroGeometry";
import AnalyticsVectors from "@/components/home/AnalyticsVectors";
import OptimizationSection from "@/components/home/OptimizationSection";
import StatsStrip from "@/components/home/StatsStrip";
import type { HomeData } from "@/types/home";

const POLL_MS = 30_000;

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
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#bfdbfe] bg-[#eff6ff] text-[#0b6fe8]">
          <Megaphone size={14} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium leading-5 text-[#10213f] transition-colors group-hover:text-[#0b6fe8]">{title}</span>
            {isNew && (
              <span className="shrink-0 rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0b6fe8]">
                New
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-[#64748b]">
            <Calendar size={12} className="opacity-50" />
            {date}
          </div>
        </div>
      </div>
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex justify-between gap-3 border-b border-[#f1f5f9] px-3 py-4 text-sm transition-all hover:bg-[#f8fafc]"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="group flex justify-between gap-3 border-b border-[#f1f5f9] px-3 py-4 text-sm">
      {inner}
    </div>
  );
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
    } catch {
      setHome(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHome();
    const id = setInterval(fetchHome, POLL_MS);
    return () => clearInterval(id);
  }, [fetchHome]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const potd = home?.problemOfTheDay;
  const important = home?.importantAnnouncements ?? [];
  const recent = home?.recentAnnouncements ?? [];
  
  // Combine all announcements and take top 5
  const allAnnouncements = [...important, ...recent].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const topAnnouncements = allAnnouncements.slice(0, 5);

  return (
    <div className="w-full text-[#111111] bg-white">
      <HeroGeometry />
      
      <section className="w-full border-t border-[#e2e8f0] bg-[#f8fafc]">
        <div className="mx-auto w-full max-w-[1360px] px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16 xl:px-16">
          <div className="mb-8 flex flex-col justify-between gap-3 border-b border-[#dbe4ee] pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b6fe8]">Preparation desk</p>
              <h2 className="mt-2 text-2xl font-bold text-[#10213f] sm:text-3xl">Daily practice and platform updates</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                Pick up the next focused problem, then scan the latest notices for contests, platform changes, and study updates.
              </p>
            </div>
            <Link
              to="/announcements"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#0b6fe8] hover:underline"
            >
              View archive <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-8">
            <div className="border border-[#dbe4ee] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8fbff] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#bfdbfe] bg-[#eff6ff] text-[#0b6fe8]">
                    <Target size={17} />
                  </div>
                  <h3 className="text-lg font-bold text-[#10213f]">Problem of the Day</h3>
                </div>
                <span className="rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-2 py-1 font-mono text-[10px] font-semibold uppercase text-[#0b6fe8]">
                  Daily
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <h4 className="text-xl font-semibold text-[#10213f]">Today's Practice Problem</h4>
                <p className="mt-3 text-sm leading-7 text-[#64748b]">
                  Start the daily challenge directly and keep your preparation streak moving.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={potd ? `/problems/${potd._id}` : "/problems"}
                    className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#0b6fe8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0959bb]"
                  >
                    Go to Problem <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="border border-[#dbe4ee] bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fbff] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#bfdbfe] bg-[#eff6ff] text-[#0b6fe8]">
                    <Megaphone size={17} />
                  </div>
                  <h3 className="text-lg font-bold text-[#10213f]">Platform Announcements</h3>
                </div>
                <span className="font-mono text-[11px] text-[#64748b]">
                  {allAnnouncements.length} update{allAnnouncements.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="px-3 py-2 sm:px-4">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0b6fe8]" />
                  </div>
                ) : topAnnouncements.length > 0 ? (
                  <div className="flex flex-col">
                    <div className="border-b border-[#f1f5f9] px-3 py-3">
                      <p className="text-sm leading-6 text-[#64748b]">
                        Important alerts and recent updates are grouped here so you can check what changed before starting a session.
                      </p>
                    </div>
                    {topAnnouncements.map((item) => (
                      <AnnouncementLink
                        key={item._id}
                        title={item.title}
                        link={item.link}
                        date={item.date}
                        isNew={item.isNew}
                      />
                    ))}

                    <div className="flex flex-col gap-3 px-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-[#64748b]">
                        Showing latest {topAnnouncements.length} of {allAnnouncements.length}
                      </span>
                      <Link
                        to="/announcements"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0b6fe8] hover:underline"
                      >
                        Open all <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-[#64748b]">
                    No recent announcements.
                  </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnalyticsVectors />
      <OptimizationSection />
      <StatsStrip />
    </div>
  );
}
