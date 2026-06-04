import { BrainCircuit } from "lucide-react";
import StatCard from "../components/StatCard";

export default function IntelligenceIndexWidget({ value = 0 }: { value?: number }) {
  return <StatCard label="Mathematical Intelligence Index" value={value} suffix="/100" trend="Weighted by accuracy, consistency, revision, and contest signal" icon={BrainCircuit} />;
}
