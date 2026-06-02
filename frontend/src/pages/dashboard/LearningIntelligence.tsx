import { useEffect, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { BrainCircuit, Activity, LineChart as LineChartIcon, RefreshCcw } from "lucide-react";

export default function LearningIntelligence() {
  const [miiData, setMiiData] = useState<any>(null);
  const [weaknessGraph, setWeaknessGraph] = useState<{nodes: Node[], edges: Edge[]}>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntelligenceData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        const [miiRes] = await Promise.all([
          fetch("http://localhost:5000/api/dashboard/intelligence-index", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const miiJson = await miiRes.json();
        
        // Mock MII if missing
        if (!miiJson || !miiJson.index) {
          setMiiData({
            index: 72,
            details: {
              accuracyScore: 78,
              consistencyScore: 85,
              difficultyWeightedSolvedScore: 65
            }
          });
        } else {
          setMiiData(miiJson);
        }

        // Mock Weakness Topology
        setWeaknessGraph({
          nodes: [
            { id: '1', position: { x: 250, y: 0 }, data: { label: 'Eigenvalues' }, style: { border: '2px solid #ef4444', borderRadius: 0, padding: 10, backgroundColor: '#fef2f2' } },
            { id: '2', position: { x: 100, y: 100 }, data: { label: 'Matrix Mult' }, style: { border: '1px solid #eab308', borderRadius: 0, padding: 10 } },
            { id: '3', position: { x: 400, y: 100 }, data: { label: 'Determinants' }, style: { border: '1px solid #eab308', borderRadius: 0, padding: 10 } },
            { id: '4', position: { x: 250, y: 200 }, data: { label: 'Characteristic Poly' }, style: { border: '2px solid #ef4444', borderRadius: 0, padding: 10, backgroundColor: '#fef2f2' } },
          ],
          edges: [
            { id: 'e1-2', source: '2', target: '1', animated: true, style: { stroke: '#ef4444' } },
            { id: 'e1-3', source: '3', target: '1', animated: true, style: { stroke: '#ef4444' } },
            { id: 'e1-4', source: '4', target: '1', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
          ]
        });

      } catch (err) {
        console.error("Error fetching intelligence data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligenceData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#64748b]">Loading Learning Intelligence...</div>;
  }

  // Mock data for Retention Curve and Velocity
  const velocityData = [
    { week: 'W1', score: 30, acc: 40 },
    { week: 'W2', score: 45, acc: 45 },
    { week: 'W3', score: 55, acc: 60 },
    { week: 'W4', score: 65, acc: 62 },
    { week: 'W5', score: 72, acc: 70 },
  ];

  const retentionData = [
    { day: '0', retention: 100 },
    { day: '1', retention: 80 },
    { day: '3', retention: 65 },
    { day: '7', retention: 50 },
    { day: '14', retention: 40 },
    { day: '30', retention: 20 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0f172a] flex items-center gap-2">
          <BrainCircuit className="text-[#2563eb]" /> Learning Intelligence
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Advanced cognitive metrics, weakness topology, and learning velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mathematical Intelligence Index */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col items-center justify-center h-[350px]">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 self-start flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#2563eb]" /> Intelligence Index
          </h3>
          <div className="relative w-full flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="70%" outerRadius="100%" 
                barSize={20} 
                data={[{ value: miiData?.index || 0, fill: '#2563eb' }]}
                startAngle={180} endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" cornerRadius={0} background={{ fill: '#f8fafc' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center top-[40%]">
              <span className="text-5xl font-mono font-bold text-[#0f172a]">{miiData?.index || 0}</span>
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider mt-1">MII Score</span>
            </div>
          </div>
          <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#e2e8f0] text-center">
             <div>
               <p className="text-[10px] text-[#64748b] uppercase">Accuracy</p>
               <p className="font-mono font-bold text-[#0f172a]">{miiData?.details?.accuracyScore}%</p>
             </div>
             <div>
               <p className="text-[10px] text-[#64748b] uppercase">Consistency</p>
               <p className="font-mono font-bold text-[#0f172a]">{miiData?.details?.consistencyScore}</p>
             </div>
             <div>
               <p className="text-[10px] text-[#64748b] uppercase">Depth</p>
               <p className="font-mono font-bold text-[#0f172a]">{miiData?.details?.difficultyWeightedSolvedScore}</p>
             </div>
          </div>
        </div>

        {/* Weakness Topology Map */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[350px] lg:col-span-2">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#ef4444]" /> Weakness Topology
          </h3>
          <p className="text-xs text-[#64748b] mb-4">Dependency chain causing your current weakest topic.</p>
          <div className="flex-1 border border-[#e2e8f0] bg-[#f8fbff]">
            <ReactFlow nodes={weaknessGraph.nodes} edges={weaknessGraph.edges} fitView>
              <Background color="#cbd5e1" gap={16} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        {/* Learning Velocity */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[300px] lg:col-span-2">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-[#2563eb]" /> Learning Velocity
          </h3>
          <p className="text-xs text-[#64748b] mb-4">Rate of improvement in accuracy and MII score over time.</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: 'none' }}
                  itemStyle={{ color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="MII Score" />
                <Line type="monotone" dataKey="acc" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Accuracy %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Retention Curve */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[300px]">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-[#2563eb]" /> Memory Retention Curve
          </h3>
          <p className="text-xs text-[#64748b] mb-4">Estimated concept decay over time without revision.</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: 'none' }}
                  itemStyle={{ color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="retention" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRet)" name="Retention %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
