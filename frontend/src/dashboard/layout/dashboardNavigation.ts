import {
  BarChart3,
  BrainCircuit,
  Gauge,
  LineChart,
  Network,
  Sigma,
  Trophy,
} from "lucide-react";

export const dashboardNavigation = [
  { label: "Overview", href: "/dashboard/overview", icon: Gauge },
  { label: "Subjects", href: "/dashboard/subjects", icon: Network },
  { label: "Contest Performance", href: "/dashboard/contest-performance", icon: Trophy },
  { label: "Skills", href: "/dashboard/skills", icon: Sigma },
  { label: "Performance", href: "/dashboard/performance", icon: LineChart },
  { label: "Problem Analytics", href: "/dashboard/problems", icon: BarChart3 },
  { label: "Learning Intelligence", href: "/dashboard/learning-intelligence", icon: BrainCircuit },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
];
