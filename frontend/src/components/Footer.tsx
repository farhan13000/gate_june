import { Link } from "react-router-dom";
import { ArrowUpRight, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
      <div className="mx-auto w-full max-w-[1360px] px-5 py-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col gap-5 border-b border-[#dbe4ee] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link to="/" className="inline-flex text-lg font-bold uppercase tracking-[0.1em] text-[#10213f]">
              GATE <span className="text-[#0b6fe8]">DA</span>
            </Link>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
              Focused preparation for GATE Data Science and AI with practice, PYQ, theory, contests, and performance analytics.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:shrink-0">
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#dbe4ee] bg-white px-4 py-2.5 text-sm font-semibold text-[#10213f] transition hover:border-[#bfdbfe] hover:bg-[#f8fbff] hover:text-[#0b6fe8]"
            >
              About
              <ArrowUpRight size={14} />
            </Link>
            <a
              href="mailto:support@gateda.example.org"
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#0b6fe8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0959bb]"
            >
              <Mail size={15} />
              Contact Support
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {new Date().getFullYear()} GATE DA. All rights reserved.</p>
          <p className="font-mono uppercase tracking-[0.14em] text-[#94a3b8]">
            Exam aligned | Practice driven | Analytics focused
          </p>
        </div>
      </div>
    </footer>
  );
}
