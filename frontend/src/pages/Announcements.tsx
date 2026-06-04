import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageCircle, ArrowRight, Calendar, ExternalLink, AlertCircle, Bell, Clock, ListChecks } from "lucide-react";
import { PageContainer } from "@/components/layout";
import EmptyState from "@/components/home/EmptyState";
import { toast } from "sonner";
import { HomeData, HomeAnnouncement } from "../types/home";
import { formatDistanceToNow, format } from "date-fns";

type AnnouncementCategory = "Important" | "Recent";
type AnnouncementItem = HomeAnnouncement & { category: AnnouncementCategory };

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/home");
        if (!response.ok) throw new Error("Failed to fetch announcements");
        const data: HomeData = await response.json();
        
        const combinedMap = new Map<string, AnnouncementItem>();

        data.recentAnnouncements.forEach((item) => {
          combinedMap.set(item._id, { ...item, category: "Recent" });
        });

        data.importantAnnouncements.forEach((item) => {
          combinedMap.set(item._id, { ...item, category: "Important" });
        });

        const combined = Array.from(combinedMap.values());
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setAnnouncements(combined);
      } catch (err: any) {
        toast.error("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  };

  const importantCount = announcements.filter((item) => item.category === "Important").length;
  const newCount = announcements.filter((item) => item.isNew).length;
  const latestAnnouncement = announcements[0];

  return (
    <PageContainer>
      <div className="mb-6 border-b border-[#e2e8f0] pb-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">Notice board</p>
            <h1 className="mt-2 text-2xl font-bold text-[#0f172a] sm:text-3xl">Platform Announcements</h1>
            <p className="mt-2 text-sm leading-6 text-[#64748b] sm:text-base">
              A single place for contest notices, platform changes, maintenance alerts, and study workflow updates.
            </p>
          </div>

          {!loading && announcements.length > 0 && (
            <div className="grid grid-cols-3 overflow-hidden border border-[#e2e8f0] bg-[#f8fafc] text-center sm:min-w-[22rem]">
              <div className="border-r border-[#e2e8f0] px-3 py-3">
                <div className="font-mono text-lg font-semibold text-[#0f172a]">{announcements.length}</div>
                <div className="text-[11px] uppercase tracking-wide text-[#64748b]">Notices</div>
              </div>
              <div className="border-r border-[#e2e8f0] px-3 py-3">
                <div className="font-mono text-lg font-semibold text-[#0f172a]">{importantCount}</div>
                <div className="text-[11px] uppercase tracking-wide text-[#64748b]">Pinned</div>
              </div>
              <div className="px-3 py-3">
                <div className="font-mono text-lg font-semibold text-[#0f172a]">{newCount}</div>
                <div className="text-[11px] uppercase tracking-wide text-[#64748b]">Unread</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-5">
          {latestAnnouncement && (
            <div className="border border-[#bfdbfe] bg-[#f8fbff] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]">
                    <Bell size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm bg-[#2563eb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Latest notice
                      </span>
                      <span className="text-xs font-medium text-[#64748b]">{formatDate(latestAnnouncement.date)}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-[#0f172a]">{latestAnnouncement.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#64748b]">
                      Posted {getRelativeTime(latestAnnouncement.date)}. Check this first before entering practice or contests.
                    </p>
                  </div>
                </div>

                {latestAnnouncement.link && (
                  latestAnnouncement.link.startsWith("http") ? (
                    <a
                      href={latestAnnouncement.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-[#bfdbfe] bg-white px-3 py-2 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                    >
                      Open Link <ExternalLink size={14} />
                    </a>
                  ) : (
                    <Link
                      to={latestAnnouncement.link}
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-[#bfdbfe] bg-white px-3 py-2 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  )
                )}
              </div>
            </div>
          )}

          <div className="overflow-hidden border border-[#e2e8f0] bg-white">
            <div className="flex flex-col justify-between gap-2 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <ListChecks size={17} className="text-[#2563eb]" />
                <h2 className="text-base font-semibold text-[#0f172a]">All Notices</h2>
              </div>
              <span className="text-xs text-[#64748b]">Sorted newest first</span>
            </div>

            {announcements.map((item) => (
              <div
                key={item._id}
                className="group grid gap-4 border-b border-[#eef2f7] p-4 transition last:border-b-0 hover:bg-[#f8fafc] sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center sm:p-5"
              >
                <div className="flex items-center gap-3 sm:block">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-sm border ${
                    item.category === "Important"
                      ? "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]"
                      : "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
                  }`}>
                    {item.category === "Important" ? <AlertCircle size={20} /> : <MessageCircle size={20} />}
                  </div>
                  <div className="sm:mt-2">
                    <div className="font-mono text-[11px] font-semibold text-[#0f172a]">{formatDate(item.date)}</div>
                    <div className="mt-0.5 text-xs text-[#64748b]">{getRelativeTime(item.date)}</div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.category === "Important"
                        ? "bg-[#fef2f2] text-[#b91c1c]"
                        : "bg-[#eff6ff] text-[#2563eb]"
                    }`}>
                      {item.category === "Important" ? "Pinned" : "Update"}
                    </span>
                    {item.isNew && (
                      <span className="inline-flex rounded-sm bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#166534]">
                        New
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-semibold leading-6 text-[#0f172a] transition-colors group-hover:text-[#2563eb]">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {getRelativeTime(item.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(item.date)}
                    </span>
                  </div>
                </div>

                {item.link ? (
                  <div className="sm:justify-self-end">
                    {item.link.startsWith("http") ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border border-[#dbeafe] bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff] sm:w-auto"
                      >
                        Open Link <ExternalLink size={14} />
                      </a>
                    ) : (
                      <Link
                        to={item.link}
                        className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border border-[#dbeafe] bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff] sm:w-auto"
                      >
                        View Details <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          variant="panel"
          icon={MessageCircle}
          title="No announcements yet"
          description="Check back later for important updates and contest alerts."
          hints={[]}
        />
      )}
    </PageContainer>
  );
}
