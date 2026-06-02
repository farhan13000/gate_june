import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface PreviewCardProps {
  title: string;
  description?: string;
  href: string;
  icon?: ReactNode;
  metrics?: { label: string; value: string | number }[];
  children?: ReactNode; // For mini charts or custom content
}

export default function PreviewCard({ title, description, href, icon, metrics, children }: PreviewCardProps) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-none shadow-sm hover:border-[#2563eb] transition-colors flex flex-col h-full group">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          {icon && <div className="flex items-center justify-center w-8 h-8 bg-[#eff6ff] text-[#2563eb] rounded-none shrink-0">{icon}</div>}
          <div>
            <h3 className="font-semibold text-[#0f172a] text-sm">{title}</h3>
            {description && <p className="text-xs text-[#64748b] mt-0.5">{description}</p>}
          </div>
        </div>
        
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {metrics.map((m, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-[#64748b]">{m.label}</span>
                <span className="font-mono font-bold text-[#0f172a]">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {children && <div className="flex-1 min-h-[60px] mb-2">{children}</div>}
      </div>

      <div className="border-t border-[#e2e8f0] mt-auto">
        <Link 
          to={href} 
          className="flex items-center justify-between w-full p-3 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff] transition-colors rounded-none"
        >
          <span>View Details</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
