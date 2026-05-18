import { useState, useEffect } from "react";
import { Bookmark, ChevronRight, ChevronDown, ArrowLeft, BookOpen, Loader2, HardHat } from "lucide-react";
import LatexRenderer from "../components/LatexRenderer";

const BASE_SUBJECTS = [
  { id: "Probability", title: "Probability & Statistics", desc: "Foundations of probability, random variables, and hypothesis testing." },
  { id: "Linear Algebra", title: "Linear Algebra", desc: "Vector spaces, matrices, eigenvalue decomposition, and SVD." },
  { id: "Machine Learning", title: "Machine Learning", desc: "Supervised and unsupervised learning, SVMs, neural networks." },
  { id: "Calculus", title: "Calculus & Optimization", desc: "Derivatives, integrals, gradient descent algorithms." },
  { id: "Databases", title: "Databases & SQL", desc: "Relational algebra, normal forms, and complex queries." },
  { id: "Computer Architecture", title: "Computer Architecture", desc: "Memory coalescing, bank mapping, and GPU architectures." }
];

export default function Theory() {
  const [theories, setTheories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [bookmarked, setBookmarked] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/problems/theories/all")
      .then(r => r.json())
      .then(data => {
        setTheories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2"/> Loading Theory Library...</div>;
  }

  // Derive Subjects dynamically mixed with Base Subjects
  const SUBJECTS = BASE_SUBJECTS.map(base => {
    const matchingTheories = theories.filter(t => t.topic === base.id);
    const uniqueChapters = new Set(matchingTheories.map(t => t.chapterId));
    return { ...base, chapters: uniqueChapters.size, hasContent: matchingTheories.length > 0 };
  });

  // Subject View
  if (!selectedSubject) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Theory Library</h1>
          <p className="text-muted-foreground text-sm">Comprehensive academic material organized by subject for the GATE DA syllabus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUBJECTS.map(sub => (
            <button 
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)} 
              className="academic-card p-6 text-left flex flex-col hover:border-primary/40 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <BookOpen size={20} />
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{sub.title}</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">{sub.desc}</p>
              <div className="text-xs font-mono text-muted-foreground border-t border-border pt-4 mt-auto flex items-center justify-between">
                <span>{sub.chapters} Chapters</span>
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">Read →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Article View Setup
  const subjectTheories = theories.filter(t => t.topic === selectedSubject);
  
  // Build dynamic TOC
  const chapterMap = new Map();
  subjectTheories.forEach(t => {
    if (!chapterMap.has(t.chapterId)) {
      chapterMap.set(t.chapterId, { id: t.chapterId, label: `${t.chapterId}. ${t.chapterTitle}`, level: 1, _id: null });
    }
    chapterMap.set(t.sectionId, { id: t.sectionId, label: `${t.sectionId} ${t.title}`, level: 2, _id: t._id });
  });
  const toc = Array.from(chapterMap.values()).sort((a: any, b: any) => a.id.localeCompare(b.id, undefined, {numeric: true}));

  const activeTheoryId = activeId || (subjectTheories[0]?._id);
  const currentTheory = subjectTheories.find(t => t._id === activeTheoryId);

  return (
    <div className="bg-[#f2f3f5] min-h-screen pt-8 pb-16 font-sans">
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row gap-12">
        {/* ToC sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-24">
            <div className="text-[11px] font-bold text-slate-500 mb-4 uppercase tracking-widest">Contents</div>
            <nav className="space-y-0">
              {toc.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => { if (item._id) setActiveId(item._id); }}
                  className={`block w-full text-left py-[5px] text-[13.5px] transition-colors duration-150 ${
                    item.level === 2 ? "pl-3 text-slate-500 hover:text-slate-800" : "font-bold mt-3 mb-1 cursor-default text-slate-600"
                  } ${
                    activeTheoryId === item._id && item.level === 2
                      ? "!text-[#1269c4]" 
                      : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Article content */}
        <article className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mobile Back Button */}
          <button 
            onClick={() => setSelectedSubject(null)} 
            className="md:hidden text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-6 transition-colors"
          >
            <ArrowLeft size={12} /> Back to Library
          </button>

          {currentTheory ? (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="font-serif text-[28px] font-bold text-slate-800 leading-tight">
                  {currentTheory.sectionId} {currentTheory.title}
                </h1>
              </div>

              {/* Content */}
              <div className="prose-academic text-[14.5px] leading-[1.7] text-slate-600 space-y-6">
                {currentTheory.imageUrl && (
                  <div className="mb-8">
                    <img src={currentTheory.imageUrl} alt={currentTheory.title} className="rounded-md border border-border max-w-full h-auto object-cover bg-white shadow-sm" style={{ maxHeight: '400px' }} />
                  </div>
                )}
                
                {/* Main Latex Content */}
                <div className="latex-content-wrapper">
                  <LatexRenderer latex={currentTheory.content} />
                </div>
              </div>

              {/* Practice Problems Section (Mockup) */}
              <div className="pt-12 mt-12 border-t border-slate-200">
                <h2 className="font-serif text-2xl font-bold text-slate-800 mb-6">Practice Problems</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#f8f9fa] border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-slate-400">DA004</span>
                      <span className="text-sm font-medium text-slate-700">Bayes' Theorem Application</span>
                    </div>
                    <span className="text-xs text-slate-500">Easy</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#f8f9fa] border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-slate-400">DA007</span>
                      <span className="text-sm font-medium text-slate-700">Hypothesis Testing - Type II Error</span>
                    </div>
                    <span className="text-xs font-medium text-blue-600">Hard</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50 mt-8">
              <HardHat size={48} className="text-slate-300 mb-4" />
              <h3 className="text-xl font-serif font-bold text-slate-700 mb-2">Content Under Construction</h3>
              <p className="text-slate-500 text-sm max-w-md">
                The academic material for {selectedSubject} is currently being prepared and verified by our experts. It will be available soon!
              </p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
