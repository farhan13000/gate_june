export const latexCommandNames = [
  "alpha", "approx", "arccos", "arcsin", "arctan", "argmax", "argmin", "bar", "begin",
  "beta", "binom", "cap", "cdots", "cdot", "ceil", "cos", "cup", "delta", "det", "dim",
  "dots", "end", "epsilon", "exp", "floor", "frac", "gamma", "geq", "ge", "hat", "infty",
  "int", "lambda", "lceil", "leftarrow", "left", "leq", "le", "lfloor", "lim", "ln", "log",
  "mapsto", "mathbb", "mathbf", "mathcal", "mathrm", "mathsf", "max", "mid", "min", "mu",
  "nabla", "neq", "notin", "nu", "omega", "operatorname", "overline", "partial", "phi",
  "pi", "pm", "Pr", "prod", "rceil", "rfloor", "rho", "rightarrow", "right", "sigma",
  "sim", "sin", "sqrt", "subset", "sum", "tan", "tau", "text", "theta", "tilde", "times",
  "to", "underline", "varepsilon", "varphi", "vec", "vert", "xi",
].sort((a, b) => b.length - a.length);

const latexCommandPattern = latexCommandNames.join("|");
const overEscapedCommandPattern = new RegExp(`\\\\{2,}(?=(?:${latexCommandPattern})\\b)`, "g");
const latexSymbolEscapes = new Set(["(", ")", "[", "]", "{", "}", ",", ";", "!", "|", ":"]);

export function normalizeMathContent(content: string): string {
  return content.replace(overEscapedCommandPattern, "\\");
}

export function isLatexCommandEscape(source: string, slashIndex: number): boolean {
  const afterSlash = source.slice(slashIndex + 1);
  return latexCommandNames.some((command) => {
    if (!afterSlash.startsWith(command)) return false;
    const next = afterSlash[command.length];
    return !next || !/[A-Za-z]/.test(next);
  });
}

export function repairSingleBackslashLatex(source: string): string {
  let result = "";

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    const alreadyEscaped = i > 0 && source[i - 1] === "\\";
    const looksLikeLatex = next && (latexSymbolEscapes.has(next) || isLatexCommandEscape(source, i));

    if (char === "\\" && !alreadyEscaped && looksLikeLatex) {
      result += "\\\\";
      continue;
    }

    result += char;
  }

  return result;
}

export function robustJsonParseWithLatexRepair<T = unknown>(source: string): T {
  const latexRepaired = repairSingleBackslashLatex(source);

  try {
    return JSON.parse(latexRepaired) as T;
  } catch {
    let result = "";
    let i = 0;

    while (i < latexRepaired.length) {
      if (latexRepaired[i] === "\\") {
        const next = latexRepaired[i + 1];

        if (next && '"\\/ntru'.includes(next)) {
          if (next === "u") {
            const hex = latexRepaired.substring(i + 2, i + 6);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              result += "\\u" + hex;
              i += 6;
              continue;
            }
          }

          result += "\\" + next;
          i += 2;
        } else {
          result += "\\\\";
          i += 1;
        }
      } else {
        result += latexRepaired[i];
        i += 1;
      }
    }

    return JSON.parse(result) as T;
  }
}

export function recoverControlCharacterLatex(source: string): string {
  return source
    .replace(/\x0c/g, "\\f")
    .replace(/\x08/g, "\\b")
    .replace(/\v/g, "\\v")
    .replace(/\t([a-zA-Z])/g, "\\t$1")
    .replace(/[\x00-\x1f]rac\b/g, "\\frac")
    .replace(/[\x00-\x1f]egin\b/g, "\\begin")
    .replace(/[\x00-\x1f]ar\b/g, "\\bar")
    .replace(/[\x00-\x1f]eta\b/g, "\\beta")
    .replace(/[\x00-\x1f]au\b/g, "\\tau")
    .replace(/[\x00-\x1f]heta\b/g, "\\theta")
    .replace(/[\x00-\x1f]imes\b/g, "\\times")
    .replace(/[\x00-\x1f]ilde\b/g, "\\tilde")
    .replace(/[\x00-\x1f]ight\b/g, "\\right")
    .replace(/[\x00-\x1f]floor\b/g, "\\rfloor")
    .replace(/[\x00-\x1f]ceil\b/g, "\\rceil")
    .replace(/[\x00-\x1f]ambda\b/g, "\\lambda")
    .replace(/[\x00-\x1f]igma\b/g, "\\sigma")
    .replace(/[\x00-\x1f]abla\b/g, "\\nabla")
    .replace(/[\x00-\x1f]dots\b/g, "\\cdots")
    .replace(/[\x00-\x1f]dot\b/g, "\\cdot")
    .replace(/[\x00-\x1f]um\b/g, "\\sum")
    .replace(/[\x00-\x1f]qrt\b/g, "\\sqrt");
}

export function normalizeLatexTextForRendering(source: string): string {
  let res = recoverControlCharacterLatex(source);

  res = res.replace(/}\*{/g, "}_{");
  res = res.replace(/}\*\\mathrm{/g, "}_\\mathrm{");
  res = res.replace(/\^\{\\mathrm\{MAP\}\}/g, "_{\\mathrm{MAP}}");
  res = res.replace(/\*\{\\mathrm\{MAP\}\}/g, "_{\\mathrm{MAP}}");

  res = res.replace(
    /(^|[\s:;])\\*\[\s*([\s\S]*?)\s*\\+\]/g,
    (_match, prefix, body) => `${prefix}\n\n$$\n${body}\n$$\n`
  );
  res = res.replace(/\\+\[([\s\S]*?)\\+\]/g, "$$\n$1\n$$");
  res = res.replace(/\\+\(([\s\S]*?)\\+\)/g, "$ $1 $");

  return res;
}
