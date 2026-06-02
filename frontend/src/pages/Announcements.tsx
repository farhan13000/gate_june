import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageCircle, ArrowRight, Calendar, ExternalLink } from "lucide-react";
import { PageContainer } from "@/components/layout";
import EmptyState from "@/components/home/EmptyState";
import { toast } from "sonner";
import { HomeData, HomeAnnouncement } from "../types/home";
import { formatDistanceToNow, format } from "date-fns";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/home");
        if (!response.ok) throw new Error("Failed to fetch announcements");
        const data: HomeData = await response.json();
        
        // Combine and sort by date descending (assuming string dates can be parsed)
        const combined = [...data.importantAnnouncements, ...data.recentAnnouncements];
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

  return (
    <PageContainer>
      <div className="mb-8 border-b border-[#e2e8f0] pb-6">
        <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">Platform Announcements</h1>
        <p className="mt-2 text-sm text-[#64748b] sm:text-base">
          Stay updated with the latest contest alerts, system changes, and important platform news.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="mx-auto max-w-4xl space-y-4">
          {announcements.map((item) => (
            <div 
              key={item._id} 
              className="group flex flex-col rounded-none border border-[#e2e8f0] bg-white p-5 shadow-sm transition hover:border-[#2563eb] sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="mb-3 flex shrink-0 items-center gap-3 sm:mb-0 sm:flex-col sm:items-start sm:gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#eff6ff] text-[#2563eb]">
                  <MessageCircle size={20} />
                </div>
                <div className="text-xs font-medium text-[#64748b] sm:mt-2">
                  {formatDate(item.date)}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {item.isNew && (
                    <span className="inline-flex rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#166534]">
                      New
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-[#0f172a] group-hover:text-[#2563eb] transition-colors">
                    {item.title}
                  </h3>
                </div>
                
                <div className="mt-2 flex items-center gap-4 text-xs text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {getRelativeTime(item.date)}
                  </span>
                </div>
              </div>

              {item.link && (
                <div className="mt-4 sm:mt-0 sm:self-center">
                  {item.link.startsWith("http") ? (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-none bg-[#f8fbff] px-3 py-1.5 text-xs font-medium text-[#2563eb] transition hover:bg-[#eff6ff]"
                    >
                      Open Link <ExternalLink size={14} />
                    </a>
                  ) : (
                    <Link 
                      to={item.link}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-none bg-[#f8fbff] px-3 py-1.5 text-xs font-medium text-[#2563eb] transition hover:bg-[#eff6ff]"
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
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
