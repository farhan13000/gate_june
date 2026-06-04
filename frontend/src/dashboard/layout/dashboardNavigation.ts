import {
  Activity,
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
  { label: "Performance", href: "/dashboard/performance", icon: LineChart },
  { label: "Skills", href: "/dashboard/skills", icon: Sigma },
  { label: "Problem Analytics", href: "/dashboard/problems", icon: BarChart3 },
  { label: "Learning Intelligence", href: "/dashboard/learning-intelligence", icon: BrainCircuit },
  { label: "Subjects", href: "/dashboard/subjects", icon: Network },
  { label: "Time Analysis", href: "/dashboard/time-analysis", icon: CalendarClock },
  { label: "Weak Areas", href: "/dashboard/weak-areas", icon: Target },
  { label: "Recommendations", href: "/dashboard/recommendations", icon: BrainCircuit },
  { label: "Contest Performance", href: "/dashboard/contest-performance", icon: Trophy },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
];
