import React from "react";
import LatexRenderer from "./LatexRenderer";
import { CheckCircle2, AlertTriangle, Lightbulb, HelpCircle, BookOpen, Cpu } from "lucide-react";

interface Block {
  type: string;
  content?: string;
  headers?: string[];
  rows?: string[][];
  number?: string;
  title?: string;
  equation?: string;
  code?: string;
  language?: string;
  math?: string;
}

interface EditorialData {
  type: string;
  blocks: Block[];
}

interface EditorialRendererProps {
  solution: string | EditorialData | any;
}

export default function EditorialRenderer({ solution }: EditorialRendererProps) {
  // If solution is empty or nil
  if (!solution) {
    return <div className="text-muted-foreground text-sm">No solution provided.</div>;
  }

  // Helper to check if solution is a structured editorial object
  let editorial: EditorialData | null = null;

  if (typeof solution === "object" && solution !== null && solution.type === "editorial") {
    editorial = solution as EditorialData;
  } else if (typeof solution === "string" && solution.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(solution);
      if (parsed && parsed.type === "editorial") {
        editorial = parsed as EditorialData;
      }
    } catch (e) {
      // Fallback to string rendering if parsing fails
    }
  }

  // Fallback: If not structured, render as standard Latex string
  if (!editorial || !Array.isArray(editorial.blocks)) {
    const rawString = typeof solution === "string" ? solution : JSON.stringify(solution);
    return (
      <div className="text-foreground/85 leading-[1.8] font-serif">
        <LatexRenderer latex={rawString} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {editorial.blocks.map((block, idx) => {
        switch (block.type) {
          case "intro":
          case "summary":
            return (
              <p key={idx} className="text-sm text-foreground/85 leading-[1.8] font-serif">
                {block.content && <LatexRenderer latex={block.content} />}
              </p>
            );

          case "parameterGrid":
          case "table":
            return (
              <div key={idx} className="overflow-x-auto my-4 border border-border/80 rounded-sm bg-card">
                <table className="w-full text-xs text-left border-collapse">
                  {block.headers && (
                    <thead className="bg-secondary/40 border-b border-border/80">
                      <tr>
                        {block.headers.map((header, hIdx) => (
                          <th key={hIdx} className="py-2.5 px-4 font-bold text-muted-foreground uppercase tracking-wider text-center">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  {block.rows && (
                    <tbody className="divide-y divide-border/60">
                      {block.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-secondary/10">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-3 px-4 text-center text-foreground/90 font-serif border-r border-border/40 last:border-r-0">
                              <LatexRenderer latex={cell} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            );

          case "step":
            return (
              <div key={idx} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  {block.number && (
                    <span className="text-base text-primary font-bold">{block.number}</span>
                  )}
                  {block.title && (
                    <span className="text-sm font-bold text-foreground font-sans">
                      <LatexRenderer latex={block.title} />
                    </span>
                  )}
                </div>
                {block.equation && (
                  <div className="bg-blue-50/30 dark:bg-zinc-800/40 border border-blue-100/60 dark:border-zinc-700/50 p-4 rounded-sm text-center my-2 overflow-x-auto">
                    <LatexRenderer latex={block.equation} />
                  </div>
                )}
              </div>
            );

          case "finalAnswer":
            return (
              <div
                key={idx}
                className="bg-green-50/40 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 p-4 rounded-sm my-4 font-sans font-semibold text-green-700 dark:text-green-400 flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-300"
              >
                <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                <div className="text-sm">
                  ✓ <strong>Final Answer:</strong> <LatexRenderer latex={block.content || ""} />
                </div>
              </div>
            );

          case "concept":
          case "theorem":
          case "derivation":
          case "proof":
          case "observation":
          case "intuition":
            return (
              <div key={idx} className="p-4 bg-secondary/15 border-l-4 border-l-primary/60 border border-border/60 rounded-sm my-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide">
                  <BookOpen size={13} />
                  <span>{block.type}</span>
                </div>
                <div className="text-xs text-foreground/80 leading-relaxed font-serif">
                  {block.content && <LatexRenderer latex={block.content} />}
                </div>
              </div>
            );

          case "warning":
          case "pitfall":
            return (
              <div key={idx} className="p-4 bg-amber-500/5 border-l-4 border-l-amber-500 border border-amber-500/20 rounded-sm my-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wide">
                  <AlertTriangle size={13} />
                  <span>{block.type}</span>
                </div>
                <div className="text-xs text-foreground/80 leading-relaxed">
                  {block.content && <LatexRenderer latex={block.content} />}
                </div>
              </div>
            );

          case "hint":
            return (
              <div key={idx} className="p-4 bg-primary/5 border-l-4 border-l-primary border border-primary/10 rounded-sm my-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide">
                  <Lightbulb size={13} />
                  <span>Hint</span>
                </div>
                <div className="text-xs text-foreground/80 leading-relaxed">
                  {block.content && <LatexRenderer latex={block.content} />}
                </div>
              </div>
            );

          case "equationBlock":
          case "matrixBlock":
            return (
              <div key={idx} className="py-4 my-2 text-center overflow-x-auto bg-secondary/10 rounded-sm border border-border/30">
                {block.math && <LatexRenderer latex={block.math} />}
              </div>
            );

          case "complexityAnalysis":
            return (
              <div key={idx} className="p-4 bg-zinc-950 text-zinc-100 rounded-sm my-3 border border-zinc-800 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-primary-foreground/90 font-bold uppercase tracking-wider">
                  <Cpu size={13} />
                  <span>Complexity Analysis</span>
                </div>
                <div className="text-zinc-300 leading-relaxed">
                  {block.content && <LatexRenderer latex={block.content} />}
                </div>
              </div>
            );

          case "algorithm":
          case "pseudocode":
            return (
              <div key={idx} className="p-4 bg-zinc-950 text-zinc-100 rounded-sm my-3 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1.5 mb-2">
                  <span>{block.type}</span>
                  {block.language && <span>{block.language}</span>}
                </div>
                <pre className="font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">
                  {block.code}
                </pre>
              </div>
            );

          default:
            return (
              <div key={idx} className="p-3 bg-secondary/30 rounded-sm text-xs font-serif leading-relaxed">
                {block.content && <LatexRenderer latex={block.content} />}
              </div>
            );
        }
      })}
    </div>
  );
}
