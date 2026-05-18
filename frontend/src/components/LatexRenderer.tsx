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
 * Typeset common plain text and backslashed LaTeX math symbols to premium Unicode equivalents.
 * Ensures that even un-delimited math expressions read professionally.
 */
function typesetPlainTextMath(text: string): string {
  let html = text;
  
  // Style bold text safely
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
  
  // Clean up any remaining double backslashes in plain text to single backslashes
  html = html.replace(/\\\\/g, "\\");

  // Support for common backslashed LaTeX commands (fallback if they are un-delimited)
  html = html
    .replace(/\\bar\{x\}/g, "x̄")
    .replace(/\\bar\{y\}/g, "ȳ")
    .replace(/\\bar\b/g, "¯")
    .replace(/\\hat\{x\}/g, "x̂")
    .replace(/\\hat\{y\}/g, "ŷ")
    .replace(/\\hat\b/g, "̂")
    .replace(/\\tilde\b/g, "̃")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\times\b/g, "×")
    .replace(/\\partial\b/g, "∂")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\le\b|\\leq\b/g, "≤")
    .replace(/\\ge\b|\\geq\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\in\b/g, "∈")
    .replace(/\\notin\b/g, "∉")
    .replace(/\\subset\b/g, "⊂")
    .replace(/\\cup\b/g, "∪")
    .replace(/\\cap\b/g, "∩");

  // Gracefully typeset plain text math variables & operators
  html = html
    .replace(/\bx_bar\b/g, "x̄")
    .replace(/\by_bar\b/g, "ȳ")
    .replace(/\bmu_MAP\b/g, "μ_MAP")
    .replace(/\bmu_0\b/g, "μ₀")
    .replace(/\bmu_1\b/g, "μ₁")
    .replace(/\bsigma\^2\b/g, "σ²")
    .replace(/\btau\^2\b/g, "τ²")
    .replace(/\btheta\^2\b/g, "θ²")
    .replace(/\\?blambda\b|\\lambda\b/g, "λ")
    .replace(/\\?balpha\b|\\alpha\b/g, "α")
    .replace(/\\?bbeta\b|\\beta\b/g, "β")
    .replace(/\\?bgamma\b|\\gamma\b/g, "γ")
    .replace(/\\?btheta\b|\\theta\b/g, "θ")
    .replace(/\\?bsigma\b|\\sigma\b/g, "σ")
    .replace(/\\?bmu\b|\\mu\b/g, "μ")
    .replace(/\\?btau\b|\\tau\b/g, "τ")
    .replace(/\\?bpi\b|\\pi\b/g, "π")
    .replace(/\\?bphi\b|\\phi\b/g, "φ")
    .replace(/\binfinity\b/g, "∞")
    .replace(/->/g, "→")
    .replace(/\s\*\s/g, " · ")
    .replace(/(\w)\*(\w)/g, "$1·$2")
    .replace(/\^2\b/g, "²")
    .replace(/\^3\b/g, "³")
    .replace(/\^k\b/g, "ᵏ")
    .replace(/\^n\b/g, "ⁿ")
    .replace(/\^T\b/g, "ᵀ")
    .replace(/\^H\b/g, "ᴴ")
    .replace(/\^-1\b/g, "⁻¹")
    .replace(/_0\b/g, "₀")
    .replace(/_1\b/g, "₁")
    .replace(/_2\b/g, "₂")
    .replace(/_k\b/g, "ₖ")
    .replace(/_n\b/g, "ₙ")
    .replace(/_i\b/g, "ᵢ");

  return html;
}

/**
 * Parse a string with mixed LaTeX and plain text.
 * Handles $$...$$ (display), $...$ (inline), and any level of escaped backslash \[...\] / \(...\).
 */
function parseSegments(input: string): Array<{ type: "text" | "inline" | "display"; content: string }> {
  const segments: Array<{ type: "text" | "inline" | "display"; content: string }> = [];
  
  // Match:
  // Group 1: $$...$$ (display)
  // Group 2: $...$ (inline)
  // Group 3: \\+\[...\\+\] (display with any escaping level)
  // Group 4: \\+\(...\\+\) (inline with any escaping level)
  const regex = /\$\$([\s\S]*?)\$\$|\$([\s\S]*?)\$|\\+\[([\s\S]*?)\\+\]|\\+\(([\s\S]*?)\\+\)/g;
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
    } else if (match[3] !== undefined) {
      segments.push({ type: "display", content: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ type: "inline", content: match[4] });
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
    const htmlContent = typesetPlainTextMath(seg.content);

    // Preserve single newlines as line breaks within paragraph
    const lines = htmlContent.split("\n");
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
        className={seg.type === "display" ? "block my-3 overflow-x-auto text-center py-2 text-foreground font-medium" : "inline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span key={index} className="text-destructive font-mono text-xs">[LaTeX Error: {seg.content}]</span>;
  }
}

/**
 * Preprocess and normalize raw LaTeX strings before parsing.
 * Restores control characters (\f, \b, \t) from JS string parsing,
 * recovers markdown-italicized subscripts, and translates bracket forms to standard delimiters.
 */
function preprocessLatex(str: string): string {
  if (!str) return str;
  let res = str;

  // 1. Recover control characters that got converted by JS interpreter (\f, \b, \t, etc.)
  res = res
    .replace(/\x0c/g, "\\f")        // Form Feed -> \f (restores \frac, \phi)
    .replace(/\x08/g, "\\b")        // Backspace -> \b (restores \bar, \beta)
    .replace(/\v/g, "\\v")          // Vertical tab -> \v (restores \varepsilon)
    .replace(/\t([a-zA-Z])/g, "\\t$1"); // Tab followed by letter -> \t (restores \tau, \theta)

  // Generic control character recovery for standard LaTeX keywords (browser render recovery)
  res = res
    .replace(/[\x00-\x1f]rac\b/g, "\\frac")
    .replace(/[\x00-\x1f]egin\b/g, "\\begin")
    .replace(/[\x00-\x1f]ar\b/g, "\\bar")
    .replace(/[\x00-\x1f]eta\b/g, "\\beta")
    .replace(/[\x00-\x1f]au\b/g, "\\tau")
    .replace(/[\x00-\x1f]heta\b/g, "\\theta")
    .replace(/[\x00-\x1f]imes\b/g, "\\times")
    .replace(/[\x00-\x1f]ilde\b/g, "\\tilde");

  // 2. Fix asterisk subscripts from markdown bold parsing issues: }*{ -> }_{
  res = res.replace(/}\*{/g, "}_{");
  res = res.replace(/}\*\\mathrm{/g, "}_\\mathrm{");
  res = res.replace(/\^\{\\mathrm\{MAP\}\}/g, "_{\\mathrm{MAP}}");
  res = res.replace(/\*\{\\mathrm\{MAP\}\}/g, "_{\\mathrm{MAP}}");

  // 3. Normalize single bracket display equations: [ ... \] or [\n ... \n\]
  res = res.replace(/(?:^|\n)\s*\\*\[\s*([\s\S]*?)\s*\\+\]/g, "\n\n$$\n$1\n$$\n");

  // 4. Normalize standard block math: \\[ ... \\] or \[ ... \] to $$ ... $$
  res = res.replace(/\\+\[([\s\S]*?)\\+\]/g, "$$\n$1\n$$");

  // 5. Normalize standard inline math: \\( ... \\) or \( ... \) to $ ... $
  res = res.replace(/\\+\(([\s\S]*?)\\+\)/g, "$ $1 $");

  return res;
}

export default function LatexRenderer({ latex, className }: LatexRendererProps) {
  // Preprocess/Normalize the incoming latex string
  const cleanLatex = useMemo(() => preprocessLatex(latex), [latex]);

  // Split entire text into paragraphs on double newlines
  const paragraphs = useMemo(() => {
    if (!cleanLatex) return [];
    return cleanLatex.split(/\n\s*\n/);
  }, [cleanLatex]);

  if (paragraphs.length <= 1) {
    return (
      <span className={className}>
        {parseSegments(cleanLatex || "").map((seg, i) => renderSegment(seg, i))}
      </span>
    );
  }

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {paragraphs.map((para, pIdx) => {
        if (!para.trim()) return null;
        return (
          <p key={pIdx} className="leading-relaxed">
            {parseSegments(para).map((seg, i) => renderSegment(seg, i))}
          </p>
        );
      })}
    </div>
  );
}
