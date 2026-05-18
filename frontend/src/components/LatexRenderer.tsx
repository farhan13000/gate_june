/**
 * LatexRenderer — renders LaTeX strings using KaTeX.
 * Supports both inline ($...$) and display ($$...$$) math.
 * Falls back to raw text if KaTeX fails.
 */
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  latex: string;
  className?: string;
}

/**
 * Parse a string with mixed LaTeX and plain text.
 * Handles $$...$$ (display), $...$ (inline), and plain text segments.
 */
function parseSegments(input: string): Array<{ type: "text" | "inline" | "display"; content: string }> {
  const segments: Array<{ type: "text" | "inline" | "display"; content: string }> = [];
  // Match $$...$$ first (display), then $...$ (inline)
  const regex = /\$\$([\s\S]*?)\$\$|\$([\s\S]*?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: input.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "display", content: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ type: "inline", content: match[2] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ type: "text", content: input.slice(lastIndex) });
  }

  return segments;
}

function renderSegment(seg: { type: "text" | "inline" | "display"; content: string }, index: number) {
  if (seg.type === "text") {
    // Custom Parsing for specific Headers to mimic mockup boxes
    let htmlContent = seg.content.replace(/\*\*(Theorem.*?|Example.*?|GATE Example.*?)\*\*/g, (match, title) => {
      return `<div class="mt-8 mb-4 bg-[#f1f3f5] border border-[#e5e7eb] rounded-t-sm"><div class="px-5 py-3 border-b border-[#e5e7eb] text-[13px] font-mono text-slate-500">${title}</div><div class="px-5 py-4">`;
    });

    // Replace standard bold text
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>');
    
    // In our rudimentary parsing, if we opened a box div above, we don't have an easy way to close it without fully parsing the AST.
    // Instead, let's just render the bold text normally but styled to match the screenshot.
    
    // Wait, let's just do standard bold styling that looks nice.
    let content = seg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>');

    // Preserve newlines as line breaks
    const lines = content.split("\n");
    return (
      <span key={index}>
        {lines.map((line, i) => (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: line }} />
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  }

  try {
    const html = katex.renderToString(seg.content, {
      displayMode: seg.type === "display",
      throwOnError: false,
      trust: false,
    });
    return (
      <span
        key={index}
        className={seg.type === "display" ? "block my-6 overflow-x-auto text-center bg-[#f0f2f5] border border-slate-200 py-6 text-slate-700 font-medium" : "inline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span key={index} className="text-destructive font-mono text-xs">[LaTeX Error: {seg.content}]</span>;
  }
}

export default function LatexRenderer({ latex, className }: LatexRendererProps) {
  const segments = useMemo(() => parseSegments(latex), [latex]);

  return (
    <span className={className}>
      {segments.map((seg, i) => renderSegment(seg, i))}
    </span>
  );
}
