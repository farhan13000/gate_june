import { AlertTriangle } from "lucide-react";

export default function ErrorState({ message = "Analytics could not be loaded." }: { message?: string }) {
  return (
    <div className="border border-[#EF4444]/20 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} />
        {message}
      </div>
    </div>
  );
}
