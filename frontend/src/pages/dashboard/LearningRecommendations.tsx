import { useEffect, useState } from "react";
import { Lightbulb, AlertTriangle, Clock, Target, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function LearningRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock recommendations matching the LeetCode-style prompt
    setTimeout(() => {
      setRecommendations([
        {
          id: 1,
          type: "weak_topic_repair",
          title: "Repair Eigenvalues Foundation",
          reason: "Accuracy is 42% in Eigenvalue problems and 3 recent mistakes involved characteristic polynomial.",
          priority: "high",
          items: [
            { kind: "theory", title: "Eigenvalues Basics", time: "15 mins" },
            { kind: "problem", title: "Diagonalization Trick", difficulty: "Medium" }
          ]
        },
        {
          id: 2,
          type: "revision_due",
          title: "Revise Gradient Descent",
          reason: "You learned this 14 days ago. Memory retention is projected to drop below 50% today.",
          priority: "medium",
          items: [
            { kind: "problem", title: "SGD Step Size", difficulty: "Easy" },
            { kind: "problem", title: "Convex Optimization", difficulty: "Hard" }
          ]
        },
        {
          id: 3,
          type: "next_problems",
          title: "Next Challenge Set",
          reason: "You have a 12-day streak! Keep the momentum going with these targeted problems.",
          priority: "low",
          items: [
            { kind: "problem", title: "Bayes Theorem Application", difficulty: "Medium" },
            { kind: "problem", title: "Joint Probability Mass", difficulty: "Medium" }
          ]
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#64748b]">Loading Smart Recommendations...</div>;
  }

  const getPriorityIcon = (prio: string) => {
    if (prio === "high") return <AlertTriangle className="w-5 h-5 text-[#ef4444]" />;
    if (prio === "medium") return <Clock className="w-5 h-5 text-[#f59e0b]" />;
    return <Target className="w-5 h-5 text-[#2563eb]" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0f172a] flex items-center gap-2">
          <Lightbulb className="text-[#2563eb]" /> Smart Recommendations
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          AI-driven tasks based on your weak topics, recent mistakes, and revision schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendations.map(rec => (
          <div key={rec.id} className="bg-white border border-[#e2e8f0] rounded-none shadow-sm flex flex-col hover:border-[#2563eb] transition-colors">
            <div className={`p-5 border-b ${rec.priority === 'high' ? 'border-[#ef4444]/30 bg-[#fef2f2]' : rec.priority === 'medium' ? 'border-[#f59e0b]/30 bg-[#fffbeb]' : 'border-[#e2e8f0] bg-[#f8fbff]'}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-serif font-bold text-[#0f172a] pr-4">{rec.title}</h3>
                {getPriorityIcon(rec.priority)}
              </div>
              <p className="text-xs text-[#64748b] leading-relaxed">{rec.reason}</p>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h4 className="text-[10px] uppercase font-mono font-bold text-[#64748b] mb-3 tracking-wider">Action Items</h4>
              <div className="space-y-3 flex-1">
                {rec.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#f8fafc] border border-[#f1f5f9]">
                    <div className="flex items-center gap-3">
                      {item.kind === "theory" ? <BookOpenIcon className="w-4 h-4 text-[#64748b]" /> : <PlayCircle className="w-4 h-4 text-[#2563eb]" />}
                      <span className="text-sm font-semibold text-[#0f172a]">{item.title}</span>
                    </div>
                    {item.difficulty && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 ${
                        item.difficulty === 'Hard' ? 'text-[#ef4444] bg-[#fef2f2]' : 
                        item.difficulty === 'Medium' ? 'text-[#f59e0b] bg-[#fffbeb]' : 
                        'text-[#10b981] bg-[#ecfdf5]'
                      }`}>
                        {item.difficulty}
                      </span>
                    )}
                    {item.time && (
                      <span className="text-[10px] font-mono text-[#64748b]">{item.time}</span>
                    )}
                  </div>
                ))}
              </div>
              
              <Link to="/problems" className="mt-6 w-full py-2 bg-[#0f172a] text-white text-center text-sm font-semibold hover:bg-[#1e293b] transition-colors rounded-none block">
                Start Session
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick inline icon component to avoid adding another import
function BookOpenIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
