import { Lock } from "lucide-react";

interface FeatureLockedProps {
  title: string;
  description?: string;
}

export default function FeatureLocked({
  title,
  description = "This section is currently locked. Upgrade to premium to unlock advanced analytics and personalized insights.",
}: FeatureLockedProps) {
  return (
    <div className="min-h-[440px] rounded-none border border-[var(--dash-border)] bg-white p-8 shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eff6ff] text-[#0d6efd]">
        <Lock className="h-8 w-8" />
      </div>
      <div className="mt-8 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0D6EFD]">Coming soon</p>
        <h1 className="mt-4 text-2xl font-semibold text-[#10213F]">{title} is locked</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#4B5563]">
          {description}
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded border border-[#bfdbfe] bg-[#eff6ff] px-5 py-3 text-sm font-semibold text-[#0d6efd]">
          <Lock className="h-4 w-4" />
          Stay tuned
        </div>
      </div>
    </div>
  );
}
