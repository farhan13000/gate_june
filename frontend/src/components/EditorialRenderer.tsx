import React from "react";
import LatexRenderer from "./LatexRenderer";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Cpu,
  HelpCircle,
  Lightbulb,
  Route,
  Sigma,
  Sparkles,
} from "lucide-react";

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

type GenericSolution = Record<string, any>;
type Tone = "primary" | "amber" | "green" | "neutral" | "dark";

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFirstDefined(obj: GenericSolution, keys: string[]) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }
  return undefined;
}

function normalizeList(value: unknown): string[] {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) return parsed.map(asText).filter(Boolean);
  if (typeof parsed === "string") {
    return parsed
      .split(/\n+/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }
  return parsed ? [asText(parsed)] : [];
}

function toneClasses(tone: Tone = "neutral") {
  if (tone === "primary") return "border-primary/20 bg-primary/5 text-primary";
  if (tone === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  if (tone === "green") return "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-400";
  if (tone === "dark") return "border-zinc-800 bg-zinc-950 text-zinc-100";
  return "border-border bg-card text-foreground";
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-current/20 bg-background/70">
      {children}
    </span>
  );
}

function renderTextBlock(title: string, value: unknown, icon?: React.ReactNode, tone: Tone = "neutral") {
  const text = asText(parseMaybeJson(value));
  if (!text) return null;

  return (
    <section key={title} className={`rounded-md border p-4 shadow-sm ${toneClasses(tone)}`}>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
        <SectionIcon>{icon || <BookOpen size={13} />}</SectionIcon>
        <span className={tone === "neutral" ? "text-muted-foreground" : ""}>{title}</span>
      </div>
      <div className="text-sm leading-[1.9] text-foreground/85">
        <LatexRenderer latex={text} />
      </div>
    </section>
  );
}

function renderParagraphListBlock(title: string, value: unknown) {
  const list = normalizeList(value);
  if (list.length === 0) return null;

  return (
    <section key={title} className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-primary/20 bg-primary/10 text-primary">
          <Route size={13} />
        </span>
        <span>{title}</span>
      </div>
      <div className="space-y-3">
        {list.map((item, index) => (
          <div key={index} className="group grid grid-cols-[2rem_1fr] gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-mono text-[11px] font-bold text-primary">
                {index + 1}
              </span>
              {index < list.length - 1 && <span className="mt-2 h-full min-h-6 w-px bg-border" />}
            </div>
            <div className="rounded-sm border border-border/80 bg-secondary/10 px-3 py-2.5 text-sm leading-[1.85] text-foreground/85 transition-colors group-hover:bg-secondary/20">
              <LatexRenderer latex={item} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderEquationBlocks(value: unknown) {
  const equations = normalizeList(value);
  if (equations.length === 0) return null;

  return (
    <section key="Equations" className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-primary/20 bg-primary/10 text-primary">
          <Sigma size={13} />
        </span>
        <span>Key Equations</span>
      </div>
      <div className="space-y-2">
        {equations.map((equation, index) => (
          <div key={index} className="overflow-x-auto rounded-sm border border-border bg-secondary/20 px-3 py-3 text-center shadow-inner">
            <LatexRenderer latex={equation} />
          </div>
        ))}
      </div>
    </section>
  );
}

function renderFinalAnswer(value: unknown) {
  const finalAnswer = asText(value);
  if (!finalAnswer) return null;

  return (
    <section key="Final Answer" className="rounded-md border border-primary/25 bg-primary/10 p-4 text-primary shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background/70">
          <CheckCircle2 size={16} />
        </span>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide">Final Answer</div>
          <div className="text-base font-bold text-foreground">
            <LatexRenderer latex={finalAnswer} />
          </div>
        </div>
      </div>
    </section>
  );
}

function renderGenericSolution(solution: GenericSolution) {
  const knownKeys = new Set([
    "overview",
    "summary",
    "strategy",
    "approach",
    "detailed_steps",
    "steps",
    "solution_steps",
    "narrative",
    "paragraphs",
    "equations",
    "key_observation",
    "keyObservation",
    "keyInsight",
    "mathematical_insight",
    "mathematicalInsight",
    "whyThisWorks",
    "why_it_works",
    "common_traps",
    "commonTraps",
    "complexity_or_reasoning",
    "complexityOrReasoning",
    "complexity",
    "reasoning",
    "final_answer",
    "finalAnswer",
    "answer",
  ]);

  const blocks: React.ReactNode[] = [];
  blocks.push(renderTextBlock("Strategy Overview", getFirstDefined(solution, ["overview", "summary", "strategy", "approach"]), <Sparkles size={13} />, "primary"));
  blocks.push(renderParagraphListBlock("Solution Walkthrough", getFirstDefined(solution, ["narrative", "paragraphs", "detailed_steps", "steps", "solution_steps"])));
  blocks.push(renderEquationBlocks(getFirstDefined(solution, ["equations"])));
  blocks.push(renderTextBlock("Key Insight", getFirstDefined(solution, ["key_observation", "keyObservation", "keyInsight"]), <Lightbulb size={13} />, "amber"));
  blocks.push(renderTextBlock("Why It Works", getFirstDefined(solution, ["mathematical_insight", "mathematicalInsight", "whyThisWorks", "why_it_works"]), <BookOpen size={13} />));
  blocks.push(renderParagraphListBlock("Common Traps", getFirstDefined(solution, ["common_traps", "commonTraps"])));
  blocks.push(renderTextBlock("Complexity Or Reasoning", getFirstDefined(solution, ["complexity_or_reasoning", "complexityOrReasoning", "complexity", "reasoning"]), <Cpu size={13} />));
  blocks.push(renderFinalAnswer(getFirstDefined(solution, ["final_answer", "finalAnswer", "answer"])));

  Object.entries(solution).forEach(([key, value]) => {
    if (knownKeys.has(key) || value === undefined || value === null || value === "") return;
    if (Array.isArray(parseMaybeJson(value))) {
      blocks.push(renderParagraphListBlock(humanizeKey(key), value));
    } else {
      blocks.push(renderTextBlock(humanizeKey(key), value));
    }
  });

  const visibleBlocks = blocks.filter(Boolean);
  if (!visibleBlocks.length) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-sm leading-[1.9] text-foreground/85 shadow-sm">
        <LatexRenderer latex={asText(solution)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/15 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/20 bg-background text-primary">
            <BookOpen size={17} />
          </span>
          <div>
            <div className="text-sm font-bold text-foreground">Editorial Roadmap</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Read the strategy first, follow the numbered walkthrough, then use the equations and final answer to verify the result.
            </div>
          </div>
        </div>
      </div>
      {visibleBlocks}
    </div>
  );
}

function renderStructuredBlock(block: Block, idx: number) {
  switch (block.type) {
    case "intro":
    case "summary":
      return (
        <div key={idx} className="rounded-md border border-primary/15 bg-primary/5 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-primary">
            <Sparkles size={13} />
            <span>{block.type === "intro" ? "Strategy Overview" : "Summary"}</span>
          </div>
          <div className="text-sm leading-[1.9] text-foreground/85">
            {block.content && <LatexRenderer latex={block.content} />}
          </div>
        </div>
      );

    case "parameterGrid":
    case "table":
      return (
        <div key={idx} className="overflow-x-auto rounded-md border border-border bg-card shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            {block.headers && (
              <thead className="border-b border-border bg-secondary/40">
                <tr>
                  {block.headers.map((header, hIdx) => (
                    <th key={hIdx} className="px-4 py-2.5 text-center font-bold uppercase tracking-wider text-muted-foreground">
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
                      <td key={cIdx} className="border-r border-border/40 px-4 py-3 text-center text-foreground/90 last:border-r-0">
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
        <div key={idx} className="rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            {block.number && (
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-primary/25 bg-primary/10 px-2 font-mono text-[11px] font-bold text-primary">
                {block.number}
              </span>
            )}
            {block.title && (
              <span className="text-sm font-bold text-foreground">
                <LatexRenderer latex={block.title} />
              </span>
            )}
          </div>
          {block.content && (
            <div className="mb-3 text-sm leading-[1.85] text-foreground/85">
              <LatexRenderer latex={block.content} />
            </div>
          )}
          {block.equation && (
            <div className="overflow-x-auto rounded-sm border border-border bg-secondary/20 p-4 text-center shadow-inner">
              <LatexRenderer latex={block.equation} />
            </div>
          )}
        </div>
      );

    case "finalAnswer":
      return renderFinalAnswer(block.content || "");

    case "concept":
    case "theorem":
    case "derivation":
    case "proof":
    case "observation":
    case "intuition":
      return renderTextBlock(humanizeKey(block.type), block.content, <BookOpen size={13} />, "primary");

    case "warning":
    case "pitfall":
      return renderTextBlock(humanizeKey(block.type), block.content, <AlertTriangle size={13} />, "amber");

    case "hint":
      return renderTextBlock("Hint", block.content, <Lightbulb size={13} />, "primary");

    case "equationBlock":
    case "matrixBlock":
      return (
        <div key={idx} className="overflow-x-auto rounded-md border border-border bg-card p-4 text-center shadow-inner">
          {block.math && <LatexRenderer latex={block.math} />}
        </div>
      );

    case "complexityAnalysis":
      return (
        <div key={idx} className={`rounded-md border p-4 shadow-sm ${toneClasses("dark")}`}>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            <Cpu size={13} />
            <span>Complexity Analysis</span>
          </div>
          <div className="text-xs leading-relaxed text-zinc-300">
            {block.content && <LatexRenderer latex={block.content} />}
          </div>
        </div>
      );

    case "algorithm":
    case "pseudocode":
      return (
        <div key={idx} className={`rounded-md border p-4 shadow-sm ${toneClasses("dark")}`}>
          <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <span>{block.type}</span>
            {block.language && <span>{block.language}</span>}
          </div>
          <pre className="overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-zinc-300">{block.code}</pre>
        </div>
      );

    default:
      return renderTextBlock(humanizeKey(block.type || "Note"), block.content, <HelpCircle size={13} />);
  }
}

export default function EditorialRenderer({ solution }: EditorialRendererProps) {
  if (!solution) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        No solution provided.
      </div>
    );
  }

  const parsedSolution = parseMaybeJson(solution);

  if (typeof parsedSolution === "object" && parsedSolution !== null && (parsedSolution as any).type === "editorial") {
    const editorial = parsedSolution as EditorialData;
    if (Array.isArray(editorial.blocks)) {
      return <div className="space-y-4 animate-in fade-in duration-200">{editorial.blocks.map(renderStructuredBlock)}</div>;
    }
  }

  if (typeof parsedSolution === "object" && parsedSolution !== null && !Array.isArray(parsedSolution)) {
    return renderGenericSolution(parsedSolution as GenericSolution);
  }

  if (Array.isArray(parsedSolution)) {
    return renderParagraphListBlock("Solution Walkthrough", parsedSolution) || null;
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 text-sm leading-[1.9] text-foreground/85 shadow-sm">
      <LatexRenderer latex={asText(parsedSolution)} />
    </div>
  );
}
