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
    // Basic Markdown bold parsing
    let content = seg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
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
        className={seg.type === "display" ? "block my-6 overflow-x-auto text-center bg-[#f0f1f2] rounded-md border border-[#e2e4e6] py-6 shadow-sm" : "inline"}
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
