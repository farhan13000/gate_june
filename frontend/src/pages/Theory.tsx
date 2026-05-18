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
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* ToC sidebar */}
      <aside className="w-56 shrink-0 hidden md:block">
        <div className="sticky top-20">
          <button 
            onClick={() => setSelectedSubject(null)} 
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-6 transition-colors"
          >
            <ArrowLeft size={12} /> Back to Library
          </button>
          
          <div className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Contents</div>
          <nav className="space-y-0.5 border-l border-border pl-2">
            {toc.map((item: any) => (
              <button
                key={item.id}
                onClick={() => { if (item._id) setActiveId(item._id); }}
                className={`block w-full text-left py-1.5 px-3 rounded-sm text-xs transition-colors duration-150 relative ${item.level === 2 ? "ml-2" : "font-medium mt-2 cursor-default"} ${activeTheoryId === item._id ? "text-primary bg-primary/5 font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                {activeTheoryId === item._id && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary -ml-[9px] rounded-r-sm"></span>}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Article content */}
      <article className="flex-1 min-w-0 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Mobile Back Button */}
        <button 
          onClick={() => setSelectedSubject(null)} 
          className="md:hidden text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Library
        </button>

        {/* Article header */}
        <div className="mb-8 pb-6 border-b border-border">
          <div className="text-xs font-mono text-muted-foreground mb-2">
            Theory · {selectedSubject}
          </div>
          <div className="flex items-start justify-between">
            <h1 className="font-serif text-3xl font-bold text-foreground leading-tight">
              {currentTheory ? currentTheory.title : "Select a topic"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground font-medium">
            {currentTheory && <span className="px-2 py-0.5 bg-secondary border border-border rounded-sm">Section {currentTheory.sectionId}</span>}
          </div>
        </div>

        {/* Content */}
        <div className="prose-academic space-y-8 text-sm leading-relaxed text-foreground/85">
          {currentTheory ? (
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-4">{currentTheory.sectionId} {currentTheory.title}</h2>
              {currentTheory.imageUrl && (
                <div className="mb-6">
                  <img src={currentTheory.imageUrl} alt={currentTheory.title} className="rounded-xl border border-border max-w-full h-auto object-cover bg-secondary/10 shadow-sm" style={{ maxHeight: '600px' }} />
                </div>
              )}
              <div className="mb-4">
                <LatexRenderer latex={currentTheory.content} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-secondary/5 mt-8">
              <HardHat size={48} className="text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-serif font-bold text-foreground mb-2">Content Under Construction</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                The academic material for {selectedSubject} is currently being prepared and verified by our experts. It will be available soon!
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
