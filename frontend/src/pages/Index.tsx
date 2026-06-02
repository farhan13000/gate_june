import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";
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
      <span className="flex min-w-0 items-center gap-2">
        <span className="font-medium text-[#2563eb] truncate">{title}</span>
        {isNew && (
          <span className="shrink-0 rounded-none bg-[#eff6ff] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#2563eb] border border-[#bfdbfe]">
            New
          </span>
        )}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-[#94a3b8] flex items-center gap-1">
        <Calendar size={10} />
        {date}
      </span>
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] py-3 text-sm transition-colors hover:bg-[#f8fafc] px-2"
      >
        {inner}
      </a>
    );
  }

  return <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] py-3 text-sm px-2">{inner}</div>;
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
      
      {/* Dynamic Activity Section (POTD + Announcements) */}
      <section className="w-full max-w-[1360px] mx-auto px-16 py-16 max-lg:px-10 max-sm:px-5 border-t border-[#e2e8f0]">
        <div className="grid gap-10 lg:grid-cols-2">
          
          {/* Left Column: Problem of the Day */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-[#0b6fe8]"></div>
              <h2 className="text-xl font-bold text-[#10213f] font-serif">Problem of the Day</h2>
            </div>
            
            <div className="border border-[#e2e8f0] bg-[#fcfdfd] p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#10213f] mb-2">Challenge Your Intellect</h3>
              <p className="text-sm text-[#64748b] mb-6 line-height-relaxed">
                Consistent practice is the key to cracking GATE DA. Solve today's carefully curated mathematical problem to keep your analytical skills sharp.
              </p>
              
              <Link
                to={potd ? `/problems/${potd._id}` : "/problems"}
                className="inline-flex items-center justify-center bg-[#0b6fe8] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0959bb] gap-2 rounded-sm"
              >
                Solve Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Column: Platform Announcements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#0b6fe8]"></div>
                <h2 className="text-xl font-bold text-[#10213f] font-serif">Platform Announcements</h2>
              </div>
            </div>

            <div className="border border-[#e2e8f0] bg-white px-4 py-2 shadow-sm">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0b6fe8]" />
                </div>
              ) : topAnnouncements.length > 0 ? (
                <div className="flex flex-col">
                  {topAnnouncements.map((item) => (
                    <AnnouncementLink 
                      key={item._id} 
                      title={item.title} 
                      link={item.link} 
                      date={item.date} 
                      isNew={item.isNew} 
                    />
                  ))}
                  
                  {allAnnouncements.length > 5 && (
                    <div className="pt-4 pb-2 flex justify-center">
                      <Link 
                        to="/announcements" 
                        className="text-sm font-semibold text-[#0b6fe8] hover:underline flex items-center gap-1"
                      >
                        View All Announcements
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[#64748b]">
                  No recent announcements.
                </div>
              )}
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
