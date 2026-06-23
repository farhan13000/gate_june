import { BookOpenCheck, CheckCircle2, FileCode2, GitBranch, Lightbulb, LockKeyhole } from "lucide-react";

const exampleJson = `{
  "subjects": [
    {
      "subjectId": "SUBJECT_AI",
      "name": "Artificial Intelligence",
      "code": "AI",
      "order": 1,
      "chapters": [
        {
          "chapterId": "CHAPTER_SEARCH",
          "name": "Search and Planning",
          "order": 1,
          "topics": [
            {
              "topicId": "TOPIC_A_STAR",
              "name": "A* Search",
              "difficultyLevel": "Intermediate",
              "order": 1,
              "subtopics": [
                {
                  "subtopicId": "SUBTOPIC_ADMISSIBLE_HEURISTICS",
                  "name": "Admissible Heuristics",
                  "order": 1
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

const steps = [
  {
    number: "01",
    title: "Create the subject",
    detail: "Enter a stable subjectId, a display name, and a short code. Example: SUBJECT_AI, Artificial Intelligence, AI.",
  },
  {
    number: "02",
    title: "Create its chapter",
    detail: "Choose the subject by typing its name or ID, then create a chapter such as CHAPTER_SEARCH.",
  },
  {
    number: "03",
    title: "Create a topic",
    detail: "Choose the subject and chapter. The system derives and verifies the subject from the selected chapter.",
  },
  {
    number: "04",
    title: "Create a subtopic",
    detail: "Choose subject → chapter → topic. The system verifies the complete path before saving.",
  },
];

export default function AdminTaxonomyGuide() {
  return (
    <div className="space-y-5">
      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-2.5 text-primary"><BookOpenCheck size={20} /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-primary">Admin reference</div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">Taxonomy creation manual</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Taxonomy is the shared syllabus map for problems, theory, analytics, and filters. Build each branch in order so every content item can point to one valid path.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><GitBranch size={16} className="text-primary" /> The four-level structure</div>
        <div className="overflow-x-auto">
          <div className="flex min-w-[40rem] items-center gap-2 text-center text-xs">
            {[
              ["Subject", "SUBJECT_AI", "Artificial Intelligence"],
              ["Chapter", "CHAPTER_SEARCH", "Search and Planning"],
              ["Topic", "TOPIC_A_STAR", "A* Search"],
              ["Subtopic", "SUBTOPIC_ADMISSIBLE_HEURISTICS", "Admissible Heuristics"],
            ].map(([label, id, name], index) => (
              <div key={label} className="contents">
                <div className="min-w-[9rem] flex-1 rounded-sm border border-border bg-background p-3">
                  <div className="font-semibold text-foreground">{label}</div>
                  <div className="mt-2 truncate font-mono text-[10px] text-primary">{id}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{name}</div>
                </div>
                {index < 3 && <span className="text-lg text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Create a branch in this order</h3>
          <div className="mt-4 space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-3">
                <div className="font-mono text-xs font-bold text-primary">{step.number}</div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{step.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">ID and editing rules</h3>
          <div className="mt-4 space-y-3 text-xs text-muted-foreground">
            <div className="flex gap-2"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-primary" /><span><strong className="text-foreground">IDs are permanent.</strong> Use clear uppercase IDs with underscores. Never rename an ID after questions or theory use it.</span></div>
            <div className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" /><span><strong className="text-foreground">Choose parents from the suggestions.</strong> Type either a parent name or ID; click the matching result rather than manually copying an ID.</span></div>
            <div className="flex gap-2"><Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-600" /><span><strong className="text-foreground">Prefer disabling over deleting.</strong> Deleting a subject, chapter, or topic also removes its descendants.</span></div>
            <div className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" /><span><strong className="text-foreground">Parent integrity is checked.</strong> Topics inherit the subject from their chapter; subtopics inherit both chapter and subject from their topic.</span></div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-sm border border-border bg-card">
        <div className="border-b border-border bg-secondary/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileCode2 size={16} className="text-primary" /> Bulk JSON example</div>
          <p className="mt-1 text-xs text-muted-foreground">Paste this shape into the Advanced bulk JSON importer. Start with “Validate only”, then import.</p>
        </div>
        <pre className="max-h-[38rem] overflow-auto bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground">{exampleJson}</pre>
      </section>
    </div>
  );
}
