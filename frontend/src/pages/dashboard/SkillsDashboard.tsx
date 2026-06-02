import { useEffect, useState } from "react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
  RadialBarChart, RadialBar, Legend, LabelList
} from 'recharts';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Target, TrendingUp, Network } from "lucide-react";

export default function SkillsDashboard() {
  const [radarData, setRadarData] = useState<any[]>([]);
  const [masteryData, setMasteryData] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{nodes: Node[], edges: Edge[]}>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkillsData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Mock Fallbacks
        const mockRadar = [
          { subjectName: "Probability", score: 65 },
          { subjectName: "Lin Alg", score: 45 },
          { subjectName: "Calculus", score: 70 },
          { subjectName: "Optimization", score: 30 },
          { subjectName: "Programming", score: 85 },
          { subjectName: "Data Structures", score: 90 },
          { subjectName: "Algorithms", score: 75 },
          { subjectName: "Machine Learning", score: 50 },
          { subjectName: "Aptitude", score: 60 },
        ];

        const mockMastery = [
          { name: "Probability", mastery: 85, fill: "#2563eb" },
          { name: "Lin Alg", mastery: 65, fill: "#3b82f6" },
          { name: "Calculus", mastery: 45, fill: "#60a5fa" }
        ];

        const mockGraph = {
          nodes: [
            { id: '1', position: { x: 250, y: 0 }, data: { label: 'Calculus Basics' }, style: { border: '1px solid #e2e8f0', borderRadius: 0, padding: 10 } },
            { id: '2', position: { x: 100, y: 100 }, data: { label: 'Derivatives' }, style: { border: '1px solid #e2e8f0', borderRadius: 0, padding: 10 } },
            { id: '3', position: { x: 400, y: 100 }, data: { label: 'Integrals' }, style: { border: '1px solid #e2e8f0', borderRadius: 0, padding: 10 } },
            { id: '4', position: { x: 250, y: 200 }, data: { label: 'Optimization' }, style: { border: '2px solid #2563eb', borderRadius: 0, padding: 10, fontWeight: 'bold' } },
          ],
          edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true },
            { id: 'e1-3', source: '1', target: '3', animated: true },
            { id: 'e2-4', source: '2', target: '4' },
            { id: 'e3-4', source: '3', target: '4' },
          ]
        };

        let radarJson: any = {};
        let masteryJson: any = {};
        let graphJson: any = {};

        try {
          const [radarRes, masteryRes, graphRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/skills/radar`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/skills/mastery`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${import.meta.env.VITE_API_BASE || ""}/api/dashboard/skills/topic-graph`, { headers: { Authorization: `Bearer ${token}` } })
          ]);

          if (radarRes.ok) radarJson = await radarRes.json();
          if (masteryRes.ok) masteryJson = await masteryRes.json();
          if (graphRes.ok) graphJson = await graphRes.json();
        } catch (e) {
          console.warn("API fetches failed, falling back to mock data", e);
        }

        // Radar Data Handling
        const isRadarEmpty = !radarJson.radar || radarJson.radar.length === 0 || radarJson.radar.every((r: any) => r.score === 0);
        setRadarData(isRadarEmpty ? mockRadar : radarJson.radar);

        // Mastery Data Handling
        const isMasteryEmpty = !masteryJson.mastery || masteryJson.mastery.length === 0;
        setMasteryData(isMasteryEmpty ? mockMastery : masteryJson.mastery);

        // Graph Data Handling
        const isGraphEmpty = !graphJson.nodes || graphJson.nodes.length === 0;
        setGraphData(isGraphEmpty ? mockGraph : graphJson);

      } catch (err) {
        console.error("Error setting up skills data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillsData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#64748b]">Loading Skills & Mastery...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0f172a] flex items-center gap-2">
          <Target className="text-[#2563eb]" /> Skills & Mastery
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Detailed breakdown of your mathematical and analytical capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Graph */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[450px]">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
            <Network className="w-4 h-4 text-[#2563eb]" /> Skill Radar
          </h3>
          <p className="text-xs text-[#64748b] mb-6">Normalized score across 9 dimensions based on accuracy, difficulty, and consistency.</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subjectName" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <Radar name="Skill Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: 'none' }}
                  itemStyle={{ color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mastery Rings */}
        <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[450px]">
          <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563eb]" /> Subject Mastery
          </h3>
          <p className="text-xs text-[#64748b] mb-6">Mastery percentage based on topics completed and accuracy.</p>
          <div className="flex-1 min-h-0 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={20} data={masteryData}>
                <RadialBar
                  background={{ fill: '#f8fafc' }}
                  dataKey="mastery"
                  cornerRadius={0}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: 'none' }}
                  itemStyle={{ color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DAG Topology */}
      <div className="bg-white border border-[#e2e8f0] p-6 shadow-sm h-[500px] flex flex-col">
        <h3 className="font-serif font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
          <Network className="w-4 h-4 text-[#2563eb]" /> Topic Dependency Graph
        </h3>
        <p className="text-xs text-[#64748b] mb-4">Explore prerequisites and optimize your learning path based on topological dependencies.</p>
        <div className="flex-1 border border-[#e2e8f0] bg-[#f8fafc]">
          <ReactFlow nodes={graphData.nodes} edges={graphData.edges} fitView>
            <Background color="#cbd5e1" gap={16} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
