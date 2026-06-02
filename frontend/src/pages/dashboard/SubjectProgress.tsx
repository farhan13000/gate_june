import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { AccuracyBar } from "./PerformanceAnalytics";

export default function SubjectProgress() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/subjects`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setSubjects(json.subjects || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Subject Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Track chapter-wise completion and mastery across all subjects.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading subjects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div key={sub.subject} className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-md">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{sub.subject}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-bold text-foreground">{sub.accuracy}%</span>
                    </div>
                    <AccuracyBar value={sub.accuracy} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground">Attempted</span>
                      <span className="font-mono text-sm">{sub.attempted}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground">Topics Active</span>
                      <span className="font-mono text-sm">{sub.topicsCompleted}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border mt-auto">
                <Link 
                  to={`/dashboard/subjects/${sub.subject}`} 
                  className="flex items-center justify-between w-full p-3 text-sm font-medium text-primary hover:bg-secondary/50 transition-colors rounded-b-lg"
                >
                  <span>Detailed Report</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
