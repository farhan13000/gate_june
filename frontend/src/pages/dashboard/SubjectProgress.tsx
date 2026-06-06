import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  BrainCircuit,
  Clock3,
  Database,
  Flame,
  FunctionSquare,
  GitBranch,
  LineChart,
  Network,
  Orbit,
  Pi,
  Radar,
  Sigma,
  Target,
} from "lucide-react";
import { EmptyState, SkeletonLoader } from "@/dashboard/components";
import { dashboardApi } from "@/dashboard/services";
import { useDashboardQuery } from "@/dashboard/hooks";

type TopicStatus = "strong" | "moderate" | "weak";

interface ApiTopic {
  topic: string;
  mastery: number;
  completion: number;
  accuracy: number;
  conceptDecay: number;
  weakness: boolean;
}

interface ApiSubject {
  id: string;
  subject: string;
  mastery: number;
  syllabusCompletion: number;
  revisionStatus: string;
  revisionFreshness: number;
  confidenceScore: number;
  averageAccuracy: number;
  learningConsistency: number;
  recentActivity: number;
  attempted: number;
  topics: ApiTopic[];
}

interface TopicMetric {
  topic: string;
  mastery: number;
  completion: number;
  accuracy: number;
  confidence: number;
  retention: number;
  speed: number;
  attempts: number;
  status: TopicStatus;
  conceptDecay: number;
}

interface SubjectMetric {
  id: string;
  subject: string;
  mastery: number;
  syllabusCompletion: number;
  revisionStatus: string;
  revisionFreshness: number;
  confidenceScore: number;
  averageAccuracy: number;
  learningConsistency: number;
  recentActivity: number;
  attempted: number;
  overallScore: number;
  studyHours: number;
  streak: number;
  improvement: number;
  topics: TopicMetric[];
}

const statusColor: Record<TopicStatus, string> = {
  strong: "#0B6FE8",
  moderate: "#54BFC5",
  weak: "#F04458",
};

const statusSoft: Record<TopicStatus, string> = {
  strong: "#EAF4FF",
  moderate: "#E9FAFA",
  weak: "#FFF1F3",
};

const statusLabel: Record<TopicStatus, string> = {
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
};

const requiredSubjects = [
  "Engineering Mathematics",
  "Probability & Statistics",
  "Linear Algebra",
  "Calculus & Optimization",
  "Data Structures",
  "Algorithms",
  "Machine Learning",
  "Artificial Intelligence",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
];

const topicBanks: Record<string, string[]> = {
  "Engineering Mathematics": [
    "Vector Calculus",
    "Linear Algebra",
    "Calculus",
    "Differential Equations",
    "Integral Calculus",
    "Series",
    "Multivariable Calculus",
    "Transforms",
    "Numerical Methods",
    "Probability",
    "Statistics",
    "Complex Analysis",
  ],
  "Probability & Statistics": [
    "Random Variables",
    "Distributions",
    "Bayes Theorem",
    "Estimation",
    "Hypothesis Tests",
    "Regression",
    "Sampling",
    "Moments",
  ],
  "Linear Algebra": ["Matrices", "Rank", "Eigenvalues", "Vector Spaces", "Orthogonality", "SVD", "Quadratic Forms", "Linear Systems"],
  "Calculus & Optimization": ["Limits", "Continuity", "Gradients", "Hessian", "Convexity", "Lagrange", "KKT", "Numerical Search"],
  "Data Structures": ["Arrays", "Stacks", "Queues", "Trees", "Graphs", "Hashing", "Heaps", "Search"],
  Algorithms: ["Sorting", "Greedy", "Dynamic Programming", "Graphs", "Divide Conquer", "Complexity", "Shortest Paths", "MST"],
  "Machine Learning": ["Regression", "Classification", "Clustering", "Trees", "SVM", "Neural Nets", "Validation", "Regularization"],
  "Artificial Intelligence": ["Search", "Planning", "Logic", "Inference", "Knowledge Graphs", "Agents", "Games", "Reasoning"],
  DBMS: ["ER Model", "SQL", "Normalization", "Transactions", "Indexing", "Query Plans", "Concurrency", "Recovery"],
  "Operating Systems": ["Processes", "Threads", "Scheduling", "Memory", "Paging", "Deadlocks", "File Systems", "Synchronization"],
  "Computer Networks": ["OSI", "TCP", "Routing", "IP", "Congestion", "DNS", "HTTP", "Security"],
};

const subjectIcon = {
  "Engineering Mathematics": Sigma,
  "Probability & Statistics": Pi,
  "Linear Algebra": FunctionSquare,
  "Calculus & Optimization": Orbit,
  "Data Structures": Database,
  Algorithms: GitBranch,
  "Machine Learning": BrainCircuit,
  "Artificial Intelligence": BrainCircuit,
  DBMS: Database,
  "Operating Systems": Radar,
  "Computer Networks": Network,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function statusFor(value: number): TopicStatus {
  if (value >= 75) return "strong";
  if (value >= 55) return "moderate";
  return "weak";
}

function seededValue(seed: string, index: number, base: number, span = 28) {
  const code = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return clamp(base + ((code + index * 17) % span) - span / 2);
}

function buildFallbackSubject(subject: string, index: number): ApiSubject {
  const mastery = clamp(72 - index * 3 + (index % 3) * 5);
  const accuracy = clamp(70 - index * 2 + (index % 4) * 3);
  const completion = clamp(74 - index * 2 + (index % 2) * 4);

  return {
    id: subject.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    subject,
    mastery,
    syllabusCompletion: completion,
    revisionStatus: index % 4 === 0 ? "Revision due" : "Healthy",
    revisionFreshness: clamp(82 - index * 4),
    confidenceScore: clamp(accuracy + 4),
    averageAccuracy: accuracy,
    learningConsistency: clamp(68 - index + (index % 3) * 4),
    recentActivity: 8 + index * 2,
    attempted: 140 - index * 6,
    topics: [],
  };
}

function normalizeSubject(subject: ApiSubject, fallbackIndex: number): SubjectMetric {
  const sourceTopics = subject.topics?.length
    ? subject.topics
    : (topicBanks[subject.subject] ?? topicBanks["Engineering Mathematics"]).map((topic, index) => ({
        topic,
        mastery: seededValue(subject.subject, index, subject.mastery),
        completion: seededValue(topic, index, subject.syllabusCompletion),
        accuracy: seededValue(topic, index, subject.averageAccuracy),
        conceptDecay: clamp(24 + ((index * 9 + fallbackIndex * 5) % 35)),
        weakness: false,
      }));

  const topics = sourceTopics.slice(0, 12).map((topic, index) => {
    const accuracy = clamp(topic.accuracy || subject.averageAccuracy);
    const completion = clamp(topic.completion || subject.syllabusCompletion);
    const mastery = clamp(topic.mastery || subject.mastery);
    const conceptDecay = clamp(topic.conceptDecay || 100 - mastery);
    const status = topic.weakness || accuracy < 55 ? "weak" : statusFor(Math.round((accuracy + completion) / 2));

    return {
      topic: topic.topic,
      mastery,
      completion,
      accuracy,
      confidence: clamp(subject.confidenceScore - index + (accuracy - 60) / 4),
      retention: clamp(100 - conceptDecay),
      speed: clamp(58 + subject.learningConsistency / 3 + ((index % 3) - 1) * 7),
      attempts: Math.max(8, Math.round(subject.attempted / Math.max(sourceTopics.length, 1)) + index * 2),
      status,
      conceptDecay,
    };
  });

  return {
    ...subject,
    mastery: clamp(subject.mastery),
    syllabusCompletion: clamp(subject.syllabusCompletion),
    confidenceScore: clamp(subject.confidenceScore),
    averageAccuracy: clamp(subject.averageAccuracy),
    learningConsistency: clamp(subject.learningConsistency),
    revisionFreshness: clamp(subject.revisionFreshness ?? 70),
    overallScore: clamp((subject.mastery + subject.averageAccuracy + subject.confidenceScore + subject.learningConsistency) / 4),
    studyHours: Math.max(6, Math.round((subject.attempted * 2.4) / 60 + fallbackIndex * 1.5)),
    streak: Math.max(2, 13 - fallbackIndex),
    improvement: clamp(4 + fallbackIndex + (subject.recentActivity % 9), 0, 24),
    topics,
  };
}

function mergeRequiredSubjects(apiSubjects: ApiSubject[] = []) {
  return requiredSubjects.map((subject, index) => {
    const found = apiSubjects.find((item) => item.subject.toLowerCase() === subject.toLowerCase());
    return normalizeSubject(found ?? buildFallbackSubject(subject, index), index);
  });
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarPoint(cx, cy, radius, endAngle);
  const end = polarPoint(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z";
}

function smoothClosedPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 3) return pointsToPath(points);

  const commands = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    const cp1 = {
      x: point.x + (next.x - previous.x) / 6,
      y: point.y + (next.y - previous.y) / 6,
    };
    const cp2 = {
      x: next.x - (afterNext.x - point.x) / 6,
      y: next.y - (afterNext.y - point.y) / 6,
    };

    return `C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${next.x} ${next.y}`;
  });

  return `M ${points[0].x} ${points[0].y} ${commands.join(" ")} Z`;
}

function shortTopicName(topic: string) {
  const replacements: Record<string, string> = {
    "Differential Equations": "Diff. Equations",
    "Integral Calculus": "Integral Calc.",
    "Multivariable Calculus": "Multivar. Calc.",
    "Numerical Methods": "Numerical",
    "Complex Analysis": "Complex",
    "Vector Calculus": "Vector Calc.",
    "Random Variables": "Rand. Variables",
    "Hypothesis Tests": "Hyp. Tests",
    "Dynamic Programming": "Dynamic Prog.",
    "Divide Conquer": "Divide & Conquer",
    "Computer Networks": "Networks",
    "Operating Systems": "OS",
  };

  return replacements[topic] ?? topic;
}

function labelPlacement(angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  const side = normalized > 24 && normalized < 156 ? "right" : normalized > 204 && normalized < 336 ? "left" : "center";
  const vertical = normalized <= 24 || normalized >= 336 ? "top" : normalized >= 156 && normalized <= 204 ? "bottom" : "middle";

  return { side, vertical };
}

function MiniDistribution({ subject }: { subject: SubjectMetric }) {
  const counts = {
    strong: subject.topics.filter((topic) => topic.status === "strong").length,
    moderate: subject.topics.filter((topic) => topic.status === "moderate").length,
    weak: subject.topics.filter((topic) => topic.status === "weak").length,
  };
  const total = Math.max(1, subject.topics.length);
  let cursor = -90;

  return (
    <div className="subjects-mini-distribution">
      <svg viewBox="0 0 120 120" className="h-full w-full rotate-[-90deg]">
        <circle cx="60" cy="60" r="43" fill="none" stroke="#EEF2F7" strokeWidth="14" />
        {(["strong", "moderate", "weak"] as TopicStatus[]).map((status) => {
          const degrees = (counts[status] / total) * 360;
          const path = arcPath(60, 60, 43, cursor, cursor + Math.max(0.01, degrees - 4));
          cursor += degrees;
          return <path key={status} d={path} fill="none" stroke={statusColor[status]} strokeWidth="14" strokeLinecap="round" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-semibold text-[#10213F]">{(subject.overallScore / 100).toFixed(2)}</span>
        <span className="text-[10px] font-semibold text-[#4B5563]">Overall</span>
      </div>
    </div>
  );
}

function SubjectRadarCircle({ subject }: { subject: SubjectMetric }) {
  const [tooltip, setTooltip] = useState<TopicMetric | null>(null);
  const size = 760;
  const center = size / 2;
  const outerRadius = 226;
  const topicCount = Math.max(subject.topics.length, 1);
  const slice = 360 / topicCount;

  const waveformPoints = subject.topics.map((topic, index) => {
    const angle = index * slice;
    const value = (topic.accuracy * 0.42 + topic.confidence * 0.24 + topic.retention * 0.2 + topic.speed * 0.14) / 100;
    return polarPoint(center, center, 58 + value * 146, angle);
  });

  const smoothWavePath = smoothClosedPath(waveformPoints);

  return (
    <div className="subjects-radar-shell">
      <svg viewBox={`0 0 ${size} ${size}`} className="subjects-radar-svg" role="img" aria-label={`${subject.subject} radar analytics`}>
        <defs>
          <filter id="radarGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="radarWaveFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0B6FE8" stopOpacity="0.18" />
            <stop offset="52%" stopColor="#54BFC5" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#F04458" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {[52, 94, 136, 178, 220].map((radius, index) => (
          <circle key={radius} cx={center} cy={center} r={radius} fill="none" stroke="#D9E5F6" strokeWidth="1" strokeDasharray={index === 4 ? "0" : "3 5"} opacity={0.9} />
        ))}

        {subject.topics.map((topic, index) => {
          const angle = index * slice;
          const endPoint = polarPoint(center, center, 218, angle);
          return (
            <g key={`${topic.topic}-axis`}>
              <line x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} stroke="#C9D9EE" strokeWidth="1" strokeDasharray="3 5" />
              <circle cx={endPoint.x} cy={endPoint.y} r="2.2" fill={statusColor[topic.status]} opacity="0.7" />
            </g>
          );
        })}

        {subject.topics.map((topic, index) => {
          const start = index * slice + 2.8;
          const end = (index + 1) * slice - 2.8;
          const completionEnd = start + (end - start) * (topic.completion / 100);

          return (
            <g
              key={`${topic.topic}-arc`}
              className="subjects-radar-segment"
              onMouseEnter={() => setTooltip(topic)}
              onMouseLeave={() => setTooltip(null)}
            >
              <path d={arcPath(center, center, outerRadius, start, end)} fill="none" stroke="#E9EEF6" strokeWidth="17" strokeLinecap="round" />
              <path
                d={arcPath(center, center, outerRadius, start, completionEnd)}
                fill="none"
                stroke={statusColor[topic.status]}
                strokeWidth="17"
                strokeLinecap="round"
                className="subjects-radar-arc"
                style={{ animationDelay: `${index * 60}ms` }}
              />
              <title>{`${topic.topic}: ${topic.completion}% completion, ${topic.accuracy}% accuracy`}</title>
            </g>
          );
        })}

        <path d={smoothWavePath} fill="url(#radarWaveFill)" stroke="#0B6FE8" strokeWidth="2.8" strokeLinejoin="round" className="subjects-waveform-fill" />
        <path d={smoothWavePath} fill="none" stroke="#F04458" strokeWidth="1.6" strokeOpacity="0.72" strokeDasharray="0 540 55 540" className="subjects-waveform-accent" />

        <circle cx={center} cy={center} r="8" fill="#10213F" />
        <text x={center} y={center - 68} textAnchor="middle" className="subjects-radar-scale">
          100
        </text>
        <text x={center} y={center - 110} textAnchor="middle" className="subjects-radar-scale">
          75
        </text>
        <text x={center} y={center - 152} textAnchor="middle" className="subjects-radar-scale">
          50
        </text>
        <text x={center} y={center - 194} textAnchor="middle" className="subjects-radar-scale">
          25
        </text>
      </svg>

      <svg className="subjects-radar-leader-layer" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          {subject.topics.map((topic, index) => (
            <marker
              key={`${topic.topic}-arrow-marker`}
              id={`subjects-arrow-${subject.id}-${index}`}
              markerWidth="5"
              markerHeight="5"
              refX="4.3"
              refY="2.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 5 2.5 L 0 5 z" fill={statusColor[topic.status]} />
            </marker>
          ))}
        </defs>
        {subject.topics.map((topic, index) => {
          const angle = index * slice;
          const start = polarPoint(50, 50, 42.1, angle);
          const end = polarPoint(50, 50, 27.1, angle);
          const bend = polarPoint(50, 50, 35.4, angle + (index % 2 === 0 ? 1.2 : -1.2));

          return (
            <path
              key={`${topic.topic}-leader`}
              d={`M ${start.x} ${start.y} Q ${bend.x} ${bend.y} ${end.x} ${end.y}`}
              className="subjects-radar-leader"
              stroke={statusColor[topic.status]}
              markerEnd={`url(#subjects-arrow-${subject.id}-${index})`}
            />
          );
        })}
      </svg>

      <div className="subjects-radar-label-layer">
        {subject.topics.map((topic, index) => {
          const angle = index * slice;
          const point = polarPoint(50, 50, 45.5, angle);
          const placement = labelPlacement(angle);

          return (
            <button
              key={`${topic.topic}-label-card`}
              type="button"
              aria-label={`${topic.topic}: ${topic.completion}% completion and ${topic.accuracy}% accuracy`}
              className={`subjects-radar-marker is-${placement.side} is-${placement.vertical}`}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                borderColor: `${statusColor[topic.status]}40`,
                color: statusColor[topic.status],
              }}
              onMouseEnter={() => setTooltip(topic)}
              onFocus={() => setTooltip(topic)}
              onMouseLeave={() => setTooltip(null)}
              onBlur={() => setTooltip(null)}
            >
              <span>{index + 1}</span>
              <b>{topic.completion}%</b>
            </button>
          );
        })}
      </div>

      {tooltip && (
        <div className="subjects-radar-tooltip">
          <strong>{tooltip.topic}</strong>
          <span>Completion {tooltip.completion}%</span>
          <span>Accuracy {tooltip.accuracy}%</span>
          <span>{statusLabel[tooltip.status]} topic</span>
        </div>
      )}
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, meta }: { icon: typeof Target; label: string; value: string; meta: string }) {
  return (
    <div className="subjects-metric-tile">
      <div className="subjects-metric-icon">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#64748B]">{label}</p>
        <p className="font-mono text-base font-semibold text-[#10213F]">{value}</p>
        <p className="text-[10px] text-[#64748B]">{meta}</p>
      </div>
    </div>
  );
}

function InsightCard({ label, topic, value, status }: { label: string; topic: string; value: string; status: TopicStatus }) {
  return (
    <div className="subjects-insight-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor[status] }} />
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-[#10213F]">{topic}</p>
      <p className="mt-1 font-mono text-[12px]" style={{ color: statusColor[status] }}>
        {value}
      </p>
    </div>
  );
}

export default function SubjectProgress() {
  const { data, loading, error } = useDashboardQuery(() => dashboardApi.subjectIntelligence(), []);
  const subjects = useMemo(() => mergeRequiredSubjects(data?.subjects), [data]);
  const [activeId, setActiveId] = useState(requiredSubjects[0].toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const activeSubject = subjects.find((subject) => subject.id === activeId) ?? subjects[0];

  const overview = useMemo(() => {
    const topics = activeSubject?.topics ?? [];
    const strong = topics.filter((topic) => topic.status === "strong");
    const moderate = topics.filter((topic) => topic.status === "moderate");
    const weak = topics.filter((topic) => topic.status === "weak");
    const sorted = [...topics].sort((a, b) => b.accuracy - a.accuracy);
    const improved = [...topics].sort((a, b) => b.retention + b.mastery - (a.retention + a.mastery))[0] ?? sorted[0];
    const needsFocus = [...topics].sort((a, b) => a.accuracy + a.retention - (b.accuracy + b.retention))[0] ?? sorted[sorted.length - 1];

    return {
      strong,
      moderate,
      weak,
      best: sorted[0],
      lowest: sorted[sorted.length - 1],
      improved,
      needsFocus,
    };
  }, [activeSubject]);

  if (loading) return <SkeletonLoader rows={7} />;
  if (error || !data) return <EmptyState title="Subject intelligence unavailable" description="The subject analytics service could not be loaded." />;

  return (
    <div className="subjects-analytics-page">
      <header className="subjects-page-header">
        <div>
          <h1>Subjects</h1>
          <p>Track and analyze your performance across all subjects</p>
        </div>
        <div className="subjects-header-pill">
          <Radar size={15} />
          <span>All Time</span>
        </div>
      </header>

      <section className="subjects-dashboard-grid">
        <aside className="subjects-panel subjects-subject-panel">
          <div className="subjects-panel-title">Select a Subject</div>
          <div className="subjects-list dashboard-scrollbar">
            {subjects.map((subject) => {
              const Icon = subjectIcon[subject.subject as keyof typeof subjectIcon] ?? BookOpenCheck;
              const isActive = subject.id === activeSubject.id;
              const tone = statusFor(subject.averageAccuracy);

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setActiveId(subject.id)}
                  className={`subjects-subject-card ${isActive ? "is-active" : ""}`}
                >
                  <span className="subjects-subject-icon" style={{ backgroundColor: statusSoft[tone], color: statusColor[tone] }}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-left text-[12px] font-semibold text-[#10213F]">{subject.subject}</span>
                      <span className="font-mono text-[10px] text-[#0B6FE8]">{subject.syllabusCompletion}%</span>
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
                      <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${subject.syllabusCompletion}%`, backgroundColor: statusColor[tone] }} />
                    </span>
                    <span className="mt-2 grid grid-cols-2 gap-2 text-left">
                      <span>
                        <span className="block text-[9px] text-[#94A3B8]">Accuracy</span>
                        <span className="font-mono text-[10px] font-semibold text-[#10213F]">{subject.averageAccuracy}%</span>
                      </span>
                      <span>
                        <span className="block text-[9px] text-[#94A3B8]">Score</span>
                        <span className="font-mono text-[10px] font-semibold text-[#10213F]">{(subject.overallScore / 100).toFixed(2)}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="subjects-main-column">
          <section className="subjects-panel subjects-center-panel">
            <div className="subjects-center-heading">
              <div className="flex items-center gap-3">
                <div className="subjects-large-icon">
                  <BookOpenCheck size={22} />
                </div>
                <div>
                  <h2>{activeSubject.subject}</h2>
                  <span>{statusLabel[statusFor(activeSubject.averageAccuracy)]}</span>
                </div>
              </div>
            </div>

            <SubjectRadarCircle subject={activeSubject} />

            <div className="subjects-topic-detail-panel" aria-label="Topic performance list">
              <div className="subjects-topic-detail-header">
                <h3>Topic Coverage Map</h3>
                <span>Mapped to the circular radar segments</span>
              </div>
              <div className="subjects-topic-ring-grid">
                {activeSubject.topics.map((topic, index) => (
                  <div
                    key={`${topic.topic}-topic-grid`}
                    className="subjects-topic-ring-item"
                    style={{ borderLeftColor: statusColor[topic.status] }}
                  >
                    <span className="subjects-topic-ring-number" style={{ color: statusColor[topic.status] }}>
                      {index + 1}
                    </span>
                    <span className="subjects-topic-ring-name">{topic.topic}</span>
                    <span className="subjects-topic-ring-bar">
                      <i style={{ width: `${topic.completion}%`, backgroundColor: statusColor[topic.status] }} />
                    </span>
                    <span className="subjects-topic-ring-percent" style={{ color: statusColor[topic.status] }}>
                      {topic.completion}%
                    </span>
                    <span className="subjects-topic-ring-accuracy">{topic.accuracy}% acc</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="subjects-legend">
              <span><i style={{ backgroundColor: statusColor.strong }} />Strong (75% - 100%)</span>
              <span><i style={{ backgroundColor: statusColor.moderate }} />Moderate (55% - 74%)</span>
              <span><i style={{ backgroundColor: statusColor.weak }} />Weak (0% - 54%)</span>
            </div>

            <div className="subjects-bottom-metrics">
              <MetricTile icon={LineChart} label="Overall Score" value={`${(activeSubject.overallScore / 100).toFixed(2)} /1.00`} meta="Good" />
              <MetricTile icon={Target} label="Accuracy" value={`${activeSubject.averageAccuracy}%`} meta="Good" />
              <MetricTile icon={BookOpenCheck} label="Solved Problems" value={activeSubject.attempted.toLocaleString()} meta="Total" />
              <MetricTile icon={Clock3} label="Time Spent" value={`${activeSubject.studyHours}h`} meta="Total" />
              <MetricTile icon={Flame} label="Streak" value={`${activeSubject.streak}`} meta="Days" />
            </div>
          </section>

        <section className="subjects-right-column" aria-label="Subject insights">
          <section className="subjects-panel subjects-right-card">
            <div className="subjects-card-header">
              <h3>Subject Overview</h3>
              <span>All Time</span>
            </div>
            <div className="subjects-overview-content">
              <div className="space-y-3">
                {[
                  ["Strong Topics", overview.strong.length, "strong" as TopicStatus],
                  ["Moderate Topics", overview.moderate.length, "moderate" as TopicStatus],
                  ["Weak Topics", overview.weak.length, "weak" as TopicStatus],
                ].map(([label, count, status]) => (
                  <div key={label} className="subjects-count-row">
                    <span><i style={{ backgroundColor: statusColor[status] }} />{label}</span>
                    <strong>{count} ({Math.round((Number(count) / activeSubject.topics.length) * 100)}%)</strong>
                  </div>
                ))}
              </div>
              <MiniDistribution subject={activeSubject} />
            </div>
          </section>

          <section className="subjects-panel subjects-right-card">
            <div className="subjects-card-header">
              <h3>Topic Performance Summary</h3>
            </div>
            <div className="subjects-insight-grid">
              <InsightCard label="Best Topic" topic={overview.best.topic} value={`${overview.best.accuracy}% accuracy`} status={overview.best.status} />
              <InsightCard label="Lowest Topic" topic={overview.lowest.topic} value={`${overview.lowest.accuracy}% accuracy`} status={overview.lowest.status} />
              <InsightCard label="Most Improved" topic={overview.improved.topic} value={`${overview.improved.retention}% retention`} status={overview.improved.status} />
              <InsightCard label="Needs Focus" topic={overview.needsFocus.topic} value={`${overview.needsFocus.conceptDecay}% decay`} status={overview.needsFocus.status} />
            </div>
          </section>

          <section className="subjects-panel subjects-right-card subjects-topic-wise-card">
            <div className="subjects-card-header">
              <h3>Topic-Wise Insights</h3>
            </div>
            <div className="subjects-topic-table dashboard-scrollbar">
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Accuracy</th>
                    <th>Attempts</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSubject.topics.map((topic) => (
                    <tr key={topic.topic}>
                      <td><i style={{ backgroundColor: statusColor[topic.status] }} />{topic.topic}</td>
                      <td>{topic.accuracy}%</td>
                      <td>{topic.attempts}</td>
                      <td><span style={{ color: statusColor[topic.status], backgroundColor: statusSoft[topic.status] }}>{statusLabel[topic.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </section>
        </main>
      </section>
    </div>
  );
}
