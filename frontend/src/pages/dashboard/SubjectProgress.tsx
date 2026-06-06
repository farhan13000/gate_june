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
  PanelLeftClose,
  PanelLeftOpen,
  Pi,
  Radar,
  Sigma,
  Target,
} from "lucide-react";
import { EmptyState, SkeletonLoader } from "@/dashboard/components";
import { dashboardApi } from "@/dashboard/services";
import { useDashboardQuery } from "@/dashboard/hooks";

type TopicStatus = "strong" | "moderate" | "weak";
type SubjectsView = "overview" | "subject";

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
  strong: "#0b6fe8",
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

const subjectRingPalette = [
  "#0b6fe8",
  "#10b981",
  "#54bfc5",
  "#f59e0b",
  "#f04458",
  "#2563eb",
  "#0891b2",
  "#22c55e",
  "#64748b",
  "#0959bb",
  "#38bdf8",
];

const coverageBands = [
  { label: "0 - 25%", meta: "Low", color: "#f04458" },
  { label: "25 - 50%", meta: "Below Avg", color: "#f59e0b" },
  { label: "50 - 75%", meta: "Good", color: "#0b6fe8" },
  { label: "75 - 100%", meta: "Excellent", color: "#10b981" },
];

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

function ringArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarPoint(cx, cy, radius, endAngle);
  const end = polarPoint(cx, cy, radius, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
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

function shortSubjectName(subject: string) {
  const replacements: Record<string, string> = {
    "Engineering Mathematics": "Engineering Math",
    "Probability & Statistics": "Probability",
    "Calculus & Optimization": "Calculus & Opt.",
    "Data Structures": "Data Structures",
    "Machine Learning": "Machine Learning",
    "Artificial Intelligence": "AI",
    "Operating Systems": "Operating Systems",
    "Computer Networks": "Networks",
  };

  return replacements[subject] ?? subject;
}

function labelPlacement(angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  const side = normalized > 24 && normalized < 156 ? "right" : normalized > 204 && normalized < 336 ? "left" : "center";
  const vertical = normalized <= 24 || normalized >= 336 ? "top" : normalized >= 156 && normalized <= 204 ? "bottom" : "middle";

  return { side, vertical };
}

function SubjectRadarCircle({ subject }: { subject: SubjectMetric }) {
  const [tooltip, setTooltip] = useState<TopicMetric | null>(null);
  const size = 760;
  const center = size / 2;
  const outerRadius = 238;
  const coverageInnerRadius = 72;
  const coverageOuterRadius = 208;
  const coverageScale = [25, 50, 75, 100];
  const topicCount = Math.max(subject.topics.length, 1);
  const slice = 360 / topicCount;
  const coverageRadius = (value: number) => coverageInnerRadius + (coverageOuterRadius - coverageInnerRadius) * (clamp(value) / 100);

  const waveformPoints = subject.topics.map((topic, index) => {
    const angle = index * slice;
    return polarPoint(center, center, coverageRadius(topic.completion), angle);
  });

  const smoothWavePath = smoothClosedPath(waveformPoints);

  return (
    <div className="subjects-radar-shell">
      <svg viewBox={`0 0 ${size} ${size}`} className="subjects-radar-svg" role="img" aria-label={`${subject.subject} radar analytics`}>
        <defs>
          <linearGradient id="radarWaveFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0b6fe8" stopOpacity="0.18" />
            <stop offset="52%" stopColor="#54BFC5" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#F04458" stopOpacity="0.12" />
          </linearGradient>
          {(["strong", "moderate", "weak"] as TopicStatus[]).map((status) => (
            <linearGradient key={status} id={`subjects-arrow-metal-${subject.id}-${status}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.96" />
              <stop offset="38%" stopColor={statusColor[status]} stopOpacity="0.95" />
              <stop offset="72%" stopColor="#94A3B8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.96" />
            </linearGradient>
          ))}
          {subject.topics.map((topic, index) => (
            <marker
              key={`${topic.topic}-arrow-marker`}
              id={`subjects-arrow-${subject.id}-${index}`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0.8 0.8 L 7.2 4 L 0.8 7.2 L 2.7 4 Z" fill={`url(#subjects-arrow-metal-${subject.id}-${topic.status})`} />
            </marker>
          ))}
        </defs>

        <circle cx={center} cy={center} r={outerRadius + 36} fill="none" stroke="#D7DEE8" strokeWidth="1" strokeDasharray="1 4" opacity="0.8" />
        <circle cx={center} cy={center} r={outerRadius + 18} fill="none" stroke="#E2E8F0" strokeWidth="1.5" opacity="0.85" />
        <circle cx={center} cy={center} r="78" fill="#E9EEF5" opacity="0.68" />

        <circle cx={center} cy={center} r={coverageInnerRadius} fill="none" stroke="#D8E4F3" strokeWidth="1" strokeDasharray="4 7" opacity="0.7" />
        {coverageScale.map((value) => (
          <circle key={value} cx={center} cy={center} r={coverageRadius(value)} fill="none" stroke="#D8E4F3" strokeWidth="1" strokeDasharray="4 7" opacity="0.82" />
        ))}

        {coverageScale.map((value) => {
          const radius = coverageRadius(value);
          return (
            <text key={`${value}-coverage-scale`} x={center + 10} y={center - radius + 4} textAnchor="start" className="subjects-radar-scale">
              {value}% coverage
            </text>
          );
        })}

        {subject.topics.map((topic, index) => {
          const angle = index * slice;
          const endPoint = polarPoint(center, center, outerRadius + 22, angle);
          return (
            <g key={`${topic.topic}-axis`}>
              <line x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} stroke="#C9D5E4" strokeWidth="1" strokeDasharray="3 5" />
            </g>
          );
        })}

        {subject.topics.map((topic, index) => {
          const start = index * slice + 2.4;
          const end = (index + 1) * slice - 2.4;
          const completionEnd = start + (end - start) * (topic.completion / 100);
          const angle = index * slice;
          const vectorStart = polarPoint(center, center, outerRadius + 132, angle);
          const vectorEnd = polarPoint(center, center, outerRadius + 66, angle);
          const numberPoint = polarPoint(center, center, outerRadius + 48, angle);
          const dotPoint = polarPoint(center, center, outerRadius + 36, angle);
          const connectorEnd = polarPoint(center, center, outerRadius + 30, angle);

          return (
            <g
              key={`${topic.topic}-arc`}
              className="subjects-radar-segment"
              onMouseEnter={() => setTooltip(topic)}
              onMouseLeave={() => setTooltip(null)}
            >
              <line
                x1={center}
                y1={center}
                x2={connectorEnd.x}
                y2={connectorEnd.y}
                className="subjects-radar-connector"
                stroke={statusColor[topic.status]}
              />
              {topic.status !== "strong" && (
                <path d={arcPath(center, center, outerRadius + 24, start, end)} fill="none" stroke={statusColor[topic.status]} strokeWidth="18" strokeLinecap="butt" opacity="0.18" />
              )}
              <path d={arcPath(center, center, outerRadius, start, end)} fill="none" stroke="#E7EBF1" strokeWidth="20" strokeLinecap="round" />
              <path
                d={arcPath(center, center, outerRadius, start, completionEnd)}
                fill="none"
                stroke={statusColor[topic.status]}
                strokeWidth="20"
                strokeLinecap="round"
                className="subjects-radar-arc"
                style={{ animationDelay: `${index * 60}ms` }}
              />
              <path
                d={`M ${vectorStart.x} ${vectorStart.y} L ${vectorEnd.x} ${vectorEnd.y}`}
                className="subjects-radar-vector"
                stroke={`url(#subjects-arrow-metal-${subject.id}-${topic.status})`}
                markerEnd={`url(#subjects-arrow-${subject.id}-${index})`}
              />
              <circle cx={dotPoint.x} cy={dotPoint.y} r="4.2" fill={statusColor[topic.status]} className="subjects-radar-dot" />
              <text x={numberPoint.x} y={numberPoint.y + 4} textAnchor="middle" className="subjects-radar-number">
                {index + 1}
              </text>
              <title>{`${topic.topic}: ${topic.completion}% coverage, ${topic.mastery}% mastery`}</title>
            </g>
          );
        })}

        <path d={smoothWavePath} fill="none" stroke="#6B95A8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="subjects-waveform-fill" />
        <path d={smoothWavePath} fill="none" stroke="#F04458" strokeWidth="1.8" strokeOpacity="0.58" strokeDasharray="0 540 55 540" className="subjects-waveform-accent" />

        <circle cx={center} cy={center} r="8" fill="#10213F" />
      </svg>

      {tooltip && (
        <div className="subjects-radar-tooltip">
          <strong>{tooltip.topic}</strong>
          <span>Coverage {tooltip.completion}%</span>
          <span>Mastery {tooltip.mastery}%</span>
          <span>Retention {tooltip.retention}%</span>
          <span>{statusLabel[tooltip.status]} topic</span>
        </div>
      )}
    </div>
  );
}

function OverallSubjectsCoverage({
  subjects,
  onOpenSubject,
}: {
  subjects: SubjectMetric[];
  onOpenSubject: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const chartSubjects = subjects;
  const activeSubject = chartSubjects.find((subject) => subject.id === activeId) ?? null;
  const overallCoverage = clamp(
    chartSubjects.reduce((sum, subject) => sum + subject.syllabusCompletion, 0) / Math.max(chartSubjects.length, 1)
  );
  const size = 720;
  const center = size / 2;
  const startAngle = 0;
  const totalAngle = 270;
  const firstRadius = 264;
  const ringGap = 18;
  const ringWidth = 12;

  return (
    <section className="subjects-panel subjects-overall-panel" aria-label="Overall subjects coverage">
      <div className="subjects-overall-header">
        <div>
          <div className="subjects-overall-title-row">
            <h2>Overall Subjects Coverage</h2>
            <InfoBadge />
          </div>
          <p>Your progress across all GATE DA subjects</p>
        </div>
        <div className="subjects-overall-score-card">
          <span>Average</span>
          <strong>{overallCoverage}%</strong>
        </div>
      </div>

      <div className="subjects-overall-layout">
        <div className="subjects-overall-chart-wrap">
          <svg viewBox={`0 0 ${size} ${size}`} className="subjects-overall-chart" role="img" aria-label={`Overall subject coverage ${overallCoverage}%`}>
            <defs>
              <filter id="subjectsOverviewGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {[0, 25, 50, 75, 100].map((value) => {
              const angle = startAngle + (value / 100) * totalAngle;
              const point = polarPoint(center, center, firstRadius + 32, angle);
              return (
                <text key={value} x={point.x} y={point.y + 4} textAnchor="middle" className="subjects-overall-scale">
                  {value}%
                </text>
              );
            })}

            {chartSubjects.map((subject, index) => {
              const color = subjectRingPalette[index % subjectRingPalette.length];
              const radius = firstRadius - index * ringGap;
              const endAngle = startAngle + (subject.syllabusCompletion / 100) * totalAngle;
              const labelPoint = polarPoint(center, center, radius, startAngle);
              const labelAnchorX = center - 206;
              const labelAnchorY = labelPoint.y + 4;
              const endPoint = polarPoint(center, center, radius, endAngle);
              const isActive = activeId === subject.id;

              return (
                <g
                  key={subject.id}
                  className="subjects-overall-ring-group"
                  onMouseEnter={() => setActiveId(subject.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => onOpenSubject(subject.id)}
                >
                  <path
                    d={ringArcPath(center, center, radius, startAngle, startAngle + totalAngle)}
                    fill="none"
                    stroke="#edf2f7"
                    strokeWidth={ringWidth}
                    strokeLinecap="round"
                  />
                  <path
                    d={ringArcPath(center, center, radius, startAngle, endAngle)}
                    fill="none"
                    stroke={color}
                    strokeWidth={ringWidth}
                    strokeLinecap="round"
                    className="subjects-overall-progress"
                    style={{
                      animationDelay: `${index * 65}ms`,
                      filter: isActive ? "url(#subjectsOverviewGlow)" : undefined,
                      opacity: activeId && !isActive ? 0.38 : 1,
                    }}
                  />
                  <line
                    x1={labelAnchorX + 118}
                    y1={labelAnchorY - 3}
                    x2={labelPoint.x - 9}
                    y2={labelPoint.y}
                    stroke={color}
                    strokeWidth="1"
                    strokeDasharray="3 4"
                    className="subjects-overall-label-leader"
                    opacity={activeId && !isActive ? 0.18 : 0.45}
                  />
                  <circle
                    cx={labelAnchorX - 9}
                    cy={labelAnchorY - 3}
                    r="4"
                    fill={color}
                    opacity={activeId && !isActive ? 0.38 : 1}
                  />
                  <text
                    x={labelAnchorX}
                    y={labelAnchorY}
                    className="subjects-overall-arc-label"
                    style={{ opacity: activeId && !isActive ? 0.38 : 1 }}
                  >
                    {shortSubjectName(subject.subject)}
                  </text>
                  <circle
                    cx={endPoint.x}
                    cy={endPoint.y}
                    r="3"
                    fill={color}
                    className="subjects-overall-end-dot"
                    opacity={activeId && !isActive ? 0.28 : 0.8}
                  />
                  <title>{`${subject.subject}: ${subject.syllabusCompletion}% coverage`}</title>
                </g>
              );
            })}

            <circle cx={center} cy={center} r="86" fill="#ffffff" stroke="#e6edf7" strokeWidth="1" />
            <circle cx={center} cy={center} r="70" fill="#f8fbff" stroke="#eaf4ff" strokeWidth="1" />
            <text x={center} y={center - 9} textAnchor="middle" className="subjects-overall-main-score">
              {activeSubject ? `${activeSubject.syllabusCompletion}%` : `${overallCoverage}%`}
            </text>
            <text x={center} y={center + 18} textAnchor="middle" className="subjects-overall-main-label">
              {activeSubject ? "Subject Coverage" : "Overall Coverage"}
            </text>
            <text x={center} y={center + 43} textAnchor="middle" className="subjects-overall-main-status">
              {activeSubject ? activeSubject.subject : statusLabel[statusFor(overallCoverage)]}
            </text>
          </svg>
        </div>
      </div>

      <section className="subjects-overall-table-card" aria-label="All syllabus coverage table">
        <div className="subjects-card-header">
          <h3>All Syllabus Coverage</h3>
          <span>{chartSubjects.length} Subjects</span>
        </div>
        <div className="subjects-overall-table dashboard-scrollbar">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Coverage</th>
                <th>Mastery</th>
                <th>Accuracy</th>
                <th>Topics</th>
                <th>Attempts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {chartSubjects.map((subject, index) => {
                const color = subjectRingPalette[index % subjectRingPalette.length];
                const tone = statusFor(subject.syllabusCompletion);

                return (
                  <tr
                    key={subject.id}
                    onMouseEnter={() => setActiveId(subject.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onClick={() => onOpenSubject(subject.id)}
                  >
                    <td><i style={{ backgroundColor: color }} />{subject.subject}</td>
                    <td>
                      <span className="subjects-overall-coverage-bar">
                        <b style={{ width: `${subject.syllabusCompletion}%`, backgroundColor: color }} />
                      </span>
                      <strong style={{ color }}>{subject.syllabusCompletion}%</strong>
                    </td>
                    <td>{subject.mastery}%</td>
                    <td>{subject.averageAccuracy}%</td>
                    <td>{subject.topics.length}</td>
                    <td>{subject.attempted.toLocaleString()}</td>
                    <td><span style={{ color: statusColor[tone], backgroundColor: statusSoft[tone] }}>{statusLabel[tone]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="subjects-overall-legend">
        {coverageBands.map((band) => (
          <span key={band.label}>
            <i style={{ backgroundColor: band.color }} />
            <strong>{band.label}</strong>
            <b>{band.meta}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

function InfoBadge() {
  return (
    <span className="subjects-info-badge" aria-label="Coverage is calculated from subject syllabus completion">
      i
    </span>
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

export default function SubjectProgress() {
  const { data, loading, error } = useDashboardQuery(() => dashboardApi.subjectIntelligence(), []);
  const subjects = useMemo(() => mergeRequiredSubjects(data?.subjects), [data]);
  const [activeId, setActiveId] = useState(requiredSubjects[0].toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const [view, setView] = useState<SubjectsView>("overview");
  const [subjectPanelCollapsed, setSubjectPanelCollapsed] = useState(false);
  const activeSubject = subjects.find((subject) => subject.id === activeId) ?? subjects[0];

  const openSubjectWise = (id?: string) => {
    if (id) {
      setActiveId(id);
      setSubjectPanelCollapsed(true);
    }
    setView("subject");
  };

  if (loading) return <SkeletonLoader rows={7} />;
  if (error || !data) return <EmptyState title="Subject intelligence unavailable" description="The subject analytics service could not be loaded." />;

  return (
    <div className="subjects-analytics-page">
      <header className="subjects-page-header">
        <div>
          <h1>Subjects</h1>
          <p>Track and analyze your performance across all subjects</p>
        </div>
        <div className="subjects-header-actions">
          <div className="subjects-view-toggle" role="tablist" aria-label="Subjects view">
            <button type="button" className={view === "overview" ? "is-active" : ""} onClick={() => setView("overview")} role="tab" aria-selected={view === "overview"}>
              All Subjects
            </button>
            <button type="button" className={view === "subject" ? "is-active" : ""} onClick={() => openSubjectWise()} role="tab" aria-selected={view === "subject"}>
              Subject Wise
            </button>
          </div>
          <div className="subjects-header-pill">
            <Radar size={15} />
            <span>All Time</span>
          </div>
        </div>
      </header>

      {view === "overview" ? (
        <OverallSubjectsCoverage subjects={subjects} onOpenSubject={openSubjectWise} />
      ) : (
      <section className={`subjects-dashboard-grid ${subjectPanelCollapsed ? "is-subject-panel-collapsed" : ""}`}>
        <aside className="subjects-panel subjects-subject-panel">
          <div className="subjects-panel-title subjects-panel-title-row">
            <span>Select a Subject</span>
            <button
              type="button"
              className="subjects-panel-collapse-button"
              onClick={() => setSubjectPanelCollapsed((collapsed) => !collapsed)}
              aria-label={subjectPanelCollapsed ? "Expand subject list" : "Collapse subject list"}
              title={subjectPanelCollapsed ? "Expand subject list" : "Collapse subject list"}
            >
              {subjectPanelCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
          <div className="subjects-list dashboard-scrollbar">
            {subjects.map((subject) => {
              const Icon = subjectIcon[subject.subject as keyof typeof subjectIcon] ?? BookOpenCheck;
              const isActive = subject.id === activeSubject.id;
              const tone = statusFor(subject.averageAccuracy);

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => openSubjectWise(subject.id)}
                  className={`subjects-subject-card ${isActive ? "is-active" : ""}`}
                >
                  <span className="subjects-subject-icon" style={{ backgroundColor: statusSoft[tone], color: statusColor[tone] }}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-left text-[12px] font-semibold text-[#10213F]">{subject.subject}</span>
                      <span className="font-mono text-[10px] text-[#0b6fe8]">{subject.syllabusCompletion}%</span>
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

            <section className="subjects-topic-wise-card subjects-topic-wise-full" aria-label="Complete topic-wise insights">
              <div className="subjects-card-header">
                <h3>Topic-Wise Insights</h3>
                <span>{activeSubject.topics.length} Topics</span>
              </div>
              <div className="subjects-topic-table dashboard-scrollbar">
                <table>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Topic</th>
                      <th>Coverage</th>
                      <th>Mastery</th>
                      <th>Retention</th>
                      <th>Attempts</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubject.topics.map((topic, index) => (
                      <tr key={topic.topic}>
                        <td>{index + 1}</td>
                        <td><i style={{ backgroundColor: statusColor[topic.status] }} />{topic.topic}</td>
                        <td>
                          <span className="subjects-topic-progress">
                            <b style={{ width: `${topic.completion}%`, backgroundColor: statusColor[topic.status] }} />
                          </span>
                          <strong style={{ color: statusColor[topic.status] }}>{topic.completion}%</strong>
                        </td>
                        <td>{topic.mastery}%</td>
                        <td>{topic.retention}%</td>
                        <td>{topic.attempts}</td>
                        <td><span style={{ color: statusColor[topic.status], backgroundColor: statusSoft[topic.status] }}>{statusLabel[topic.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

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
        </main>
      </section>
      )}
    </div>
  );
}
