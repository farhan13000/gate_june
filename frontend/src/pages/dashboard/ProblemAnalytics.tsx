import { useEffect, useState } from "react";
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine,
  BarChart, Bar, Legend
} from 'recharts';
import { Activity, Clock, FileWarning, HelpCircle } from "lucide-react";

export default function ProblemAnalytics() {
  const [phaseData, setPhaseData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        const [phaseRes, summaryRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/problems/phase-diagram`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/problems/summary?viewType=difficulty`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const phaseJson = await phaseRes.json();
        const summaryJson = await summaryRes.json();

        // Process Phase data for Scatter plot
        // We want Fast+Accurate (Q1), Slow+Accurate (Q2), Fast+Wrong (Q3), Slow+Wrong (Q4)
        // Let X be Time (seconds), Y be Correctness (1 or 0 but jittered for visibility)
        const formattedPhase = (phaseJson.data || []).map((d: any) => ({
          ...d,
          y: d.isCorrect ? 100 - (Math.random() * 20) : (Math.random() * 20), // pseudo-y for correctness spread
          x: d.timeTaken,
          z: 1 // for dot size
        }));
        
        setPhaseData(formattedPhase);
        setSummaryData(summaryJson.data || []);
      } catch (err) {
        console.error("Error fetching problem data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblemData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#64748b]">Loading Problem Analytics...</div>;
  }

  // Split phase data by bucket for colors
  const fastAccurate = phaseData.filter(d => d.bucket === "Fast + Accurate");
  const slowAccurate = phaseData.filter(d => d.bucket === "Slow + Accurate");
  const fastWrong = phaseData.filter(d => d.bucket === "Fast + Wrong");
  const slowWrong = phaseData.filter(d => d.bucket === "Slow + Wrong");

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-[#e2e8f0] p-3 shadow-md rounded-none font-mono text-xs text-[#0f172a]">
          <p className="font-bold mb-1">{data.title}</p>
          <p>Subject: <span className="text-[#64748b]">{data.subject}</span></p>
          <p>Time: <span className="text-[#2563eb]">{data.timeTaken}s</span></p>
          <p>Status: <span className={data.isCorrect ? "text-green-600" : "text-red-600"}>{data.isCorrect ? "Correct" : "Incorrect"}</span></p>
          <p className="mt-1 pt-1 border-t border-[#e2e8f0] text-[#64748b]">{data.bucket}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0f172a] flex items-center gap-2">
          <Activity className="text-[#2563eb]" /> Problem Analytics
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Deep dive into your problem-solving speed, accuracy, and error patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time vs Accuracy Phase Diagram */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[450px] lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-serif font-semibold text-[#0f172a] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563eb]" /> Time vs Accuracy Phase Diagram
            </h3>
            <p className="text-xs text-[#64748b]">Every dot represents a problem attempt. Lower left is ideal (Fast + Accurate).</p>
          </div>
          
          <div className="flex-1">
            {phaseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#64748b] font-mono text-sm">No attempts data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Time (s)" unit="s" stroke="#64748b" tick={{fontSize: 10, fontFamily: 'JetBrains Mono'}} domain={[0, 'dataMax + 30']} />
                  <YAxis type="number" dataKey="y" name="Correctness" stroke="#64748b" tick={false} axisLine={false} domain={[-10, 110]} />
                  <ZAxis type="number" dataKey="z" range={[40, 40]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#64748b' }} />
                  
                  {/* Quadrant Lines (assuming 90s is the threshold for 'Fast') */}
                  <ReferenceLine x={90} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="3 3" />

                  <Scatter name="Fast & Accurate" data={fastAccurate} fill="#16a34a" opacity={0.6} />
                  <Scatter name="Slow & Accurate" data={slowAccurate} fill="#3b82f6" opacity={0.6} />
                  <Scatter name="Fast & Wrong" data={fastWrong} fill="#eab308" opacity={0.6} />
                  <Scatter name="Slow & Wrong" data={slowWrong} fill="#ef4444" opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#2563eb]" /> Difficulty Distribution
          </h3>
          <p className="text-xs text-[#64748b] mb-4">Accuracy and attempts across difficulty levels.</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="level" tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: 'none' }}
                  itemStyle={{ color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', paddingTop: '10px' }} />
                <Bar dataKey="attempted" name="Attempts" fill="#94a3b8" radius={[0, 0, 0, 0]} />
                <Bar dataKey="correct" name="Correct" fill="#2563eb" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mistake Types (Mocked for now since backend relies on form inputs) */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-[#2563eb]" /> Top Mistake Patterns
          </h3>
          <p className="text-xs text-[#64748b] mb-4">Classified errors from recent incorrect attempts.</p>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fbff]">
                  <th className="text-left py-2 px-3 text-[#64748b] font-mono text-[10px] uppercase tracking-wide">Error Type</th>
                  <th className="text-right py-2 px-3 text-[#64748b] font-mono text-[10px] uppercase tracking-wide">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#e2e8f0]">
                  <td className="py-3 px-3 font-semibold text-[#0f172a]">Calculation Error</td>
                  <td className="py-3 px-3 text-right font-mono text-[#ef4444]">12</td>
                </tr>
                <tr className="border-b border-[#e2e8f0]">
                  <td className="py-3 px-3 font-semibold text-[#0f172a]">Conceptual Gap</td>
                  <td className="py-3 px-3 text-right font-mono text-[#ef4444]">8</td>
                </tr>
                <tr className="border-b border-[#e2e8f0]">
                  <td className="py-3 px-3 font-semibold text-[#0f172a]">Time Pressure (Guessed)</td>
                  <td className="py-3 px-3 text-right font-mono text-[#ef4444]">5</td>
                </tr>
                <tr className="border-b border-[#e2e8f0]">
                  <td className="py-3 px-3 font-semibold text-[#0f172a]">Misread Question</td>
                  <td className="py-3 px-3 text-right font-mono text-[#ef4444]">3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
