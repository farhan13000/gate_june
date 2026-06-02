import { Calendar, Hammer, Wrench, Laptop } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ 
  title = "We're building something powerful!", 
  description = "This feature is currently under construction. We are working hard to bring you the best learning insights and personalized recommendations to improve faster." 
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-[#e2e8f0] rounded-none">
      {/* Geometric / Construction Illustration */}
      <div className="relative w-64 h-48 mb-8 flex items-center justify-center">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-10 w-4 h-4 rounded-full bg-[#eff6ff] animate-pulse" />
        <div className="absolute top-10 right-10 w-2 h-2 rounded-full bg-[#2563eb]" />
        <div className="absolute bottom-10 left-5 w-3 h-3 rounded-none bg-[#bfdbfe] rotate-45" />
        <div className="absolute bottom-5 right-12 w-4 h-4 rounded-full border-2 border-[#93c5fd]" />
        
        {/* Main monitor graphic */}
        <div className="relative z-10 w-48 h-32 bg-white border-2 border-[#cbd5e1] rounded-none shadow-sm flex flex-col items-center justify-center">
          <div className="w-40 h-24 bg-[#f8fafc] border border-[#e2e8f0] rounded-none flex items-center justify-center relative overflow-hidden">
             {/* Graph lines inside monitor */}
             <div className="absolute bottom-0 left-4 w-4 h-10 bg-[#bfdbfe] rounded-t-sm" />
             <div className="absolute bottom-0 left-10 w-4 h-16 bg-[#60a5fa] rounded-t-sm" />
             <div className="absolute bottom-0 left-16 w-4 h-12 bg-[#93c5fd] rounded-t-sm" />
             <Laptop className="text-[#cbd5e1] w-12 h-12 z-10 opacity-20" />
          </div>
          <div className="w-16 h-3 bg-[#cbd5e1] mt-0" />
          <div className="w-24 h-1 bg-[#cbd5e1] mt-0" />
        </div>
        
        {/* Construction barriers & tools */}
        <div className="absolute bottom-6 left-0 z-20 flex flex-col items-center">
          <Wrench className="w-8 h-8 text-[#2563eb] -rotate-12 mb-[-10px] z-30 drop-shadow-sm bg-white rounded-full p-1 border border-[#e2e8f0]" />
        </div>
        <div className="absolute bottom-4 right-4 z-20">
          <Hammer className="w-10 h-10 text-[#475569] rotate-45 drop-shadow-sm bg-white rounded-full p-1.5 border border-[#e2e8f0]" />
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-gradient-to-r from-[#2563eb] via-[#60a5fa] to-[#2563eb] rounded-none border border-[#1d4ed8] z-20 overflow-hidden flex">
           {/* Striped barrier effect */}
           {[...Array(8)].map((_, i) => (
             <div key={i} className="h-full w-4 bg-white/30 -skew-x-12 ml-1" />
           ))}
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0f172a] mb-3">
        {title}
      </h1>
      <p className="max-w-md text-[#475569] text-sm leading-relaxed mb-10">
        {description}
      </p>

      <div className="flex items-center gap-4 bg-[#f8fafc] border border-[#e2e8f0] px-6 py-4 rounded-none shadow-sm">
        <div className="flex items-center justify-center w-10 h-10 bg-[#eff6ff] rounded-none">
          <Calendar className="w-5 h-5 text-[#2563eb]" />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">Estimated Launch</p>
          <p className="text-sm font-semibold text-[#0f172a]">Coming Soon</p>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-[#94a3b8]">
        Stay tuned! We're working hard to bring you the best learning insights.
      </p>
    </div>
  );
}
