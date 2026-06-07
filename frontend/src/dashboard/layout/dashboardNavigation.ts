import {
  BarChart3,
  BrainCircuit,
  CalendarClock,
  Gauge,
  LineChart,
  Network,
  Sigma,
  Target,
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
  { label: "Time Analysis", href: "/dashboard/time-analysis", icon: CalendarClock },
  { label: "Weak Areas", href: "/dashboard/weak-areas", icon: Target },
  { label: "Recommendations", href: "/dashboard/recommendations", icon: BrainCircuit },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
];
