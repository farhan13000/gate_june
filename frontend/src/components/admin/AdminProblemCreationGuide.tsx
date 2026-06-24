import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  FileQuestion,
  ImagePlus,
  Lightbulb,
  ListChecks,
  Route,
  Sparkles,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

const problemJsonExample = `{
  "subjectId": "SUBJECT_AI",
  "chapterId": "CHAPTER_SEARCH",
  "topicId": "TOPIC_A_STAR",
  "subtopicId": "SUBTOPIC_ADMISSIBLE_HEURISTICS",
  "title": "Choosing an admissible heuristic",
  "topic": "A* Search",
  "subtopic": "Admissible Heuristics",
  "difficulty": "Medium",
  "questionType": "MCQ",
  "statement": "For the graph in the figure, which heuristic is admissible? {{media:0}}",
  "images": [
    {
      "url": "https://your-cdn.example/a-star-graph.webp",
      "alt": "A weighted graph with start, goal, and heuristic values",
      "caption": "Search graph used in the question",
      "kind": "diagram",
      "placement": "right"
    }
  ],
  "options": [
    { "text": "h(n) = 0 for every node", "isCorrect": true },
    { "text": "h(n) is twice the actual cost", "isCorrect": false },
    { "text": "h(n) is always larger than h*(n)", "isCorrect": false },
    { "text": "h(n) ignores the goal node", "isCorrect": false }
  ],
  "solution": {
    "explanation": "An admissible heuristic never overestimates the real remaining cost. {{media:0}} Therefore h(n) = 0 is admissible for every node.",
    "images": [
      {
        "url": "https://your-cdn.example/heuristic-explanation.webp",
        "alt": "Comparison of heuristic value and true remaining cost",
        "kind": "diagram",
        "placement": "full"
      }
    ],
    "finalAnswer": "Option A: h(n) = 0 for every node."
  },
  "markingScheme": { "positive": 2, "negative": 0.66 },
  "estimatedTime": 180,
  "isPyq": false,
  "tags": ["a-star", "heuristics", "search"]
}`;

const aiPromptExample = `Create one original GATE DA problem as valid JSON only.

Use this exact taxonomy path:
- subjectId: SUBJECT_AI
- chapterId: CHAPTER_SEARCH
- topicId: TOPIC_A_STAR
- subtopicId: SUBTOPIC_ADMISSIBLE_HEURISTICS

Settings: Medium difficulty, MCQ, 2 positive marks, 0.66 negative marks.

Rules:
- Return one parsable JSON object only; no Markdown fences or commentary.
- Use the exact taxonomy IDs above. Do not invent IDs.
- Include title, statement, solution.explanation, solution.finalAnswer,
  options, markingScheme, estimatedTime (in seconds), and tags.
- Make exactly one MCQ option correct.
- If no verified image URL is provided, use "images": [] and do not add {{media:...}}.
- For LaTex inside JSON, escape each slash twice, e.g. "\\\\(x^2\\\\)".`;

const solutionMediaExample = `{
  "explanation": "First identify the shortest remaining path. {{media:0}} Then compare it with the heuristic value.",
  "images": [
    {
      "url": "https://your-cdn.example/solution-graph.webp",
      "alt": "Worked solution showing the shortest path to the goal",
      "caption": "Why the selected heuristic is admissible",
      "kind": "diagram",
      "placement": "left"
    }
  ],
  "finalAnswer": "The zero heuristic is admissible."
}`;

const workflow = [
  {
    number: "01",
    title: "Pin the syllabus location",
    detail: "Open Add Problems and select Subject → Chapter → Topic → Subtopic. A problem must end at a real subtopic; this is what keeps filters, analytics, and practice paths accurate.",
  },
  {
    number: "02",
    title: "Set the question contract",
    detail: "Choose difficulty, question type, marks, time in seconds, and tags before drafting. These settings tell reviewers and the practice experience what learners should expect.",
  },
  {
    number: "03",
    title: "Write the learner-facing problem",
    detail: "Use a precise title and a self-contained statement. Define all values, constraints, diagrams, and expected answer format inside the question—not in the solution.",
  },
  {
    number: "04",
    title: "Build the explanation",
    detail: "Explain the reasoning in short, ordered paragraphs, then end with a decisive final answer. The solution should teach the method, not merely reveal the option.",
  },
  {
    number: "05",
    title: "Add media only when it helps",
    detail: "Upload a verified PNG, JPEG, or WebP visual, write useful alt text, choose its placement, and put a matching {{media:index}} marker exactly where it belongs.",
  },
  {
    number: "06",
    title: "Validate, preview, and submit",
    detail: "Parse JSON before importing, review the rendered question and answer, then submit it. New problems enter the approval queue before they become learner-visible.",
  },
];

const questionTypes = [
  ["MCQ", "One correct choice", "Provide at least two options and mark exactly one as isCorrect: true."],
  ["MSQ", "One or more correct choices", "Provide all choices and mark every correct choice as isCorrect: true."],
  ["NAT", "Numeric answer", "Use options: [] and make the final answer unambiguous, including units or precision when relevant."],
  ["PROOF", "Reasoned response", "Use options: [] and give a complete, readable proof or derivation in the solution."],
];

function CopyCodeButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy. Please select the text and copy it manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:bg-secondary"
    >
      <Copy size={12} /> {label}
    </button>
  );
}

function CodeExample({ title, detail, code, copyLabel }: { title: string; detail: string; code: string; copyLabel: string }) {
  return (
    <section className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border bg-secondary/20 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Code2 size={15} className="text-primary" /> {title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
        </div>
        <CopyCodeButton value={code} label={copyLabel} />
      </div>
      <pre className="max-h-[34rem] overflow-auto bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground">{code}</pre>
    </section>
  );
}

export default function AdminProblemCreationGuide() {
  return (
    <div className="w-full space-y-5">
      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-sm border border-primary/20 bg-primary/5 p-2.5 text-primary"><FileQuestion size={20} /></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-primary">Admin reference</div>
              <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">Problem creation guide</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                A practical path from a syllabus location to a review-ready GATE DA problem. Use the manual form for one careful item, or use the JSON workflow for a clean, previewed batch.
              </p>
            </div>
          </div>
          <span className="w-fit shrink-0 rounded-sm border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            Create → verify → review
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Problem creation principles">
        {[
          [Route, "Map it", "Choose one complete, valid taxonomy path."],
          [FileQuestion, "Teach it", "Make the statement self-contained and fair."],
          [ImagePlus, "Show it", "Use accessible visuals only when they clarify."],
          [ClipboardCheck, "Ship it", "Preview before it joins the approval queue."],
        ].map(([Icon, title, detail]) => {
          const CardIcon = Icon as typeof Route;
          return (
            <article key={title as string} className="rounded-sm border border-border bg-card p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-primary/20 bg-primary/5 text-primary"><CardIcon size={17} /></span>
              <h3 className="mt-3 font-serif text-base font-bold text-foreground">{title as string}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail as string}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-sm border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Workflow size={16} className="text-primary" />
            <h3 className="font-serif text-lg font-bold text-foreground">The six-step creation flow</h3>
          </div>
          <div className="mt-5 space-y-4">
            {workflow.map((step, index) => (
              <div key={step.number} className="relative flex gap-3 sm:gap-4">
                {index < workflow.length - 1 && <span className="absolute left-[0.72rem] top-7 h-[calc(100%+0.35rem)] w-px bg-border" />}
                <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-card font-mono text-[10px] font-bold text-primary">
                  {step.number}
                </span>
                <div className="pb-1">
                  <h4 className="text-xs font-semibold text-foreground">{step.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-sm border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary"><Lightbulb size={16} /><h3 className="font-serif text-lg font-bold">A good first check</h3></div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Before you generate or paste JSON, ask: “Could a learner solve this using only the statement, supplied visual, and the selected syllabus topic?” If not, add the missing context.
          </p>
          <div className="mt-4 space-y-2 border-t border-primary/15 pt-4 text-[11px] leading-relaxed text-muted-foreground">
            <div className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /><span>Use the taxonomy picker instead of typing IDs from memory.</span></div>
            <div className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /><span>Use estimated time in seconds: 180 means 3 minutes.</span></div>
            <div className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /><span>Keep one problem focused on one assessable idea or a deliberate concept combination.</span></div>
          </div>
        </aside>
      </section>

      <section className="rounded-sm border border-border bg-card p-5">
        <div className="flex items-center gap-2"><ListChecks size={16} className="text-primary" /><h3 className="font-serif text-lg font-bold text-foreground">Pick the right answer format</h3></div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The question type changes the options you need to provide. Match the JSON to the learner interaction.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-xs">
            <thead className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Type</th><th className="px-3 py-2">Learner interaction</th><th className="px-3 py-2">JSON rule</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questionTypes.map(([type, interaction, rule]) => (
                <tr key={type}>
                  <td className="px-3 py-3 font-mono font-bold text-primary">{type}</td>
                  <td className="px-3 py-3 font-semibold text-foreground">{interaction}</td>
                  <td className="px-3 py-3 leading-relaxed text-muted-foreground">{rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <CodeExample
          title="A complete problem JSON example"
          detail="Replace every taxonomy ID and example URL. The four taxonomy IDs must describe one real path in the current taxonomy."
          code={problemJsonExample}
          copyLabel="Copy example"
        />
        <div className="space-y-5">
          <CodeExample
            title="Prompt an AI safely"
            detail="Copy the prompt generated in Add Problems whenever possible—it already includes the selected live taxonomy. This example shows the guardrails to keep."
            code={aiPromptExample}
            copyLabel="Copy prompt"
          />
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Sparkles size={15} className="text-primary" /><h3 className="text-sm font-semibold text-foreground">Generating JSON step by step</h3></div>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2"><span className="font-mono font-bold text-primary">1.</span><span>Choose the exact taxonomy path and question settings in <strong className="text-foreground">Add Problems</strong> or <strong className="text-foreground">Create / Bulk</strong>.</span></li>
              <li className="flex gap-2"><span className="font-mono font-bold text-primary">2.</span><span>Copy the creation prompt, then ask the AI for <strong className="text-foreground">JSON only</strong>. Do not accept Markdown fences, prose, guessed IDs, or invented asset URLs.</span></li>
              <li className="flex gap-2"><span className="font-mono font-bold text-primary">3.</span><span>For a batch, wrap items in an array: <code className="rounded bg-secondary px-1 font-mono text-[10px] text-foreground">[&#123; ... &#125;, &#123; ... &#125;]</code>, paste it into Bulk JSON Upload, and select <strong className="text-foreground">Parse &amp; Preview</strong>.</span></li>
              <li className="flex gap-2"><span className="font-mono font-bold text-primary">4.</span><span>Inspect each rendered statement, options, media marker, and final answer. Fix the JSON before submitting—not after learners can see it.</span></li>
            </ol>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-2 text-primary"><UploadCloud size={18} /></div>
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">Add diagrams and images with confidence</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Media is optional. When a visual reduces ambiguity or makes reasoning clearer, use the same small media object everywhere.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["1. Prepare", "Use PNG, JPEG, or WebP and keep it at or below 5 MB. Crop excess whitespace before upload."],
            ["2. Describe", "Write alt text that states what a learner needs to know. A caption can label the figure or give a small hint."],
            ["3. Place", "Choose inline or full for reading flow; left and right sit beside text on wide screens and stack automatically on phones."],
            ["4. Anchor", "The first item in an images array is index 0. Put {{media:0}} exactly where that visual should appear."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-sm border border-border bg-background p-3">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wide text-primary">{title}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-sm border border-border bg-secondary/20 p-4 text-xs leading-relaxed text-muted-foreground">
            <h4 className="font-semibold text-foreground">Statement media</h4>
            <p className="mt-2">In Add Problems, use <strong className="text-foreground">Upload diagram</strong>. The uploaded media object is added to Statement media JSON. Insert <code className="rounded bg-background px-1 font-mono text-[10px] text-foreground">{"{{media:0}}"}</code> in the statement. Uploads are limited to PNG, JPEG, and WebP files up to 5 MB.</p>
            <p className="mt-2">For a second statement image, add it after the first object and use <code className="rounded bg-background px-1 font-mono text-[10px] text-foreground">{"{{media:1}}"}</code>. The index is always counted within that statement&apos;s images array.</p>
          </div>
          <div className="rounded-sm border border-border bg-secondary/20 p-4 text-xs leading-relaxed text-muted-foreground">
            <h4 className="font-semibold text-foreground">Solution media</h4>
            <p className="mt-2">Solution images live inside <code className="rounded bg-background px-1 font-mono text-[10px] text-foreground">solution.images</code>, which has its own index numbering. Add the uploaded asset&apos;s URL and metadata to the solution JSON, then use its marker in <code className="rounded bg-background px-1 font-mono text-[10px] text-foreground">solution.explanation</code>.</p>
            <p className="mt-2">Never use a guessed URL, HTML, SVG markup, Mermaid code, base64 blob, or an image-generation prompt as a media value.</p>
          </div>
        </div>
        <div className="mt-5">
          <CodeExample title="Solution media example" detail="This is a separate media array from statement images, so its first marker is also {{media:0}}." code={solutionMediaExample} copyLabel="Copy solution JSON" />
        </div>
      </section>

      <section className="rounded-sm border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary"><BookOpenCheck size={17} /><h3 className="font-serif text-lg font-bold">Final quality gate</h3></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-xs">
          {[
            ["Taxonomy", "All four IDs exist and belong to one path."],
            ["Question", "Statement is complete; options fit the question type."],
            ["Solution", "Explanation teaches the route and finalAnswer is decisive."],
            ["Media", "Every marker has a matching, accessible media object."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-sm border border-primary/15 bg-card p-3">
              <div className="flex items-center gap-2 font-semibold text-foreground"><CheckCircle2 size={14} className="text-emerald-600" />{title}</div>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
