import katex from "katex";
import { describe, expect, it } from "vitest";
import {
  normalizeLatexTextForRendering,
  normalizeMathContent,
  robustJsonParseWithLatexRepair,
} from "./latexPipeline";

describe("latexPipeline", () => {
  it("repairs single-backslash LaTeX in pasted bulk JSON before parsing", () => {
    const pastedJson = String.raw`[
      {
        "statement": "If \(10! = 2^p\), choose the true statements.",
        "solution": {
          "explanation": "[E_a(10!) = \left\lfloor \frac{10}{a} \right\rfloor + \cdots\]",
          "finalAnswer": "\(2\) and \(4\)"
        }
      }
    ]`;

    const parsed = robustJsonParseWithLatexRepair<Array<{ statement: string; solution: { explanation: string } }>>(pastedJson);

    expect(parsed[0].statement).toBe(String.raw`If \(10! = 2^p\), choose the true statements.`);
    expect(parsed[0].solution.explanation).toContain(String.raw`\left\lfloor \frac{10}{a} \right\rfloor`);
    expect(parsed[0].solution.explanation).not.toContain("\r");
    expect(parsed[0].solution.explanation).not.toContain("\f");
  });

  it("recovers already-corrupted control-character LaTeX at render time", () => {
    const corrupted = `E = ${String.fromCharCode(13)}ight${String.fromCharCode(13)}floor + ${String.fromCharCode(12)}rac{10}{a}`;

    const recovered = normalizeLatexTextForRendering(corrupted);

    expect(recovered).toContain(String.raw`\right\rfloor`);
    expect(recovered).toContain(String.raw`\frac{10}{a}`);
  });

  it("collapses over-escaped commands before sending math to KaTeX", () => {
    const overEscaped = String.raw`\\left\\lfloor \\frac{10}{a} \\right\\rfloor`;

    expect(normalizeMathContent(overEscaped)).toBe(String.raw`\left\lfloor \frac{10}{a} \right\rfloor`);
  });

  it("normalizes malformed display delimiters and renders the math with KaTeX", () => {
    const malformedDisplay = String.raw`For a prime \(a\): [E_a(10!) = \\left\\lfloor \\frac{10}{a} \\right\\rfloor\]`;
    const normalized = normalizeLatexTextForRendering(malformedDisplay);
    const displayMath = normalized.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] || "";

    expect(displayMath).toContain(String.raw`\\left\\lfloor`);
    expect(() => katex.renderToString(normalizeMathContent(displayMath), { throwOnError: true })).not.toThrow();
  });
});
