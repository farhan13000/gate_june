import { useMemo, useState } from "react";
import { Clipboard, FileJson, Layers, ListTree, PlayCircle, RefreshCw, UploadCloud } from "lucide-react";
import { toast } from "sonner";

const nestedSampleJson = {
  subjects: [
    {
      subjectId: "SUBJECT_PROB_STATS",
      name: "Probability and Statistics",
      code: "PS",
      order: 1,
      enabled: true,
      description: "Core probability and statistics syllabus.",
      chapters: [
        {
          chapterId: "CHAPTER_PROBABILITY",
          name: "Probability Foundations",
          order: 1,
          enabled: true,
          topics: [
            {
              topicId: "TOPIC_RANDOM_VARIABLES",
              name: "Random Variables",
              difficultyLevel: "Beginner",
              order: 1,
              enabled: true,
              subtopics: [
                {
                  subtopicId: "SUBTOPIC_DISCRETE_RV",
                  name: "Discrete Random Variables",
                  order: 1,
                  enabled: true
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const separateSampleJson = {
  subjects: [
    {
      subjectId: "SUBJECT_PROB_STATS",
      name: "Probability and Statistics",
      code: "PS",
      order: 1,
      enabled: true
    }
  ],
  chapters: [
    {
      chapterId: "CHAPTER_PROBABILITY",
      subjectId: "SUBJECT_PROB_STATS",
      name: "Probability Foundations",
      order: 1,
      enabled: true
    }
  ],
  topics: [
    {
      topicId: "TOPIC_RANDOM_VARIABLES",
      chapterId: "CHAPTER_PROBABILITY",
      subjectId: "SUBJECT_PROB_STATS",
      name: "Random Variables",
      difficultyLevel: "Beginner",
      order: 1,
      enabled: true
    }
  ],
  subtopics: [
    {
      subtopicId: "SUBTOPIC_DISCRETE_RV",
      topicId: "TOPIC_RANDOM_VARIABLES",
      chapterId: "CHAPTER_PROBABILITY",
      subjectId: "SUBJECT_PROB_STATS",
      name: "Discrete Random Variables",
      order: 1,
      enabled: true
    }
  ]
};

type BulkResult = {
  requestId: string;
  dryRun: boolean;
  mode: "upsert" | "createOnly";
  summary: {
    subjects: number;
    chapters: number;
    topics: number;
    subtopics: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  actions: {
    level: string;
    id: string;
    name: string;
    action: string;
    status: "success" | "warning" | "error";
    message: string;
  }[];
};

const ruleGroups = [
  {
    title: "Accepted JSON",
    items: [
      "Nested: { \"subjects\": [{ chapters: [{ topics: [{ subtopics: [] }] }] }] }",
      "Separate: { \"subjects\": [], \"chapters\": [], \"topics\": [], \"subtopics\": [] }",
      "Direct array is treated as a subject array."
    ],
  },
  {
    title: "Required IDs",
    items: [
      "Subject: subjectId, name, code.",
      "Chapter: chapterId, subjectId, name.",
      "Topic: topicId, chapterId, subjectId, name.",
      "Subtopic: subtopicId, topicId, chapterId, subjectId, name."
    ],
  },
  {
    title: "Processing",
    items: [
      "Nested children inherit parent IDs automatically.",
      "Upsert updates existing IDs; create-only skips existing IDs.",
      "Every validation, import, skip, and failure is saved in Platform Logs."
    ],
  },
];

export default function TaxonomyBulkJsonManager({ onImported }: { onImported?: () => void }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(nestedSampleJson, null, 2));
  const [template, setTemplate] = useState<"nested" | "separate">("nested");
  const [mode, setMode] = useState<"upsert" | "createOnly">("upsert");
  const [result, setResult] = useState<BulkResult | null>(null);
  const [parseError, setParseError] = useState("");
  const [processing, setProcessing] = useState(false);

  const localStats = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText);
      const subjects = Array.isArray(parsed) ? parsed : parsed.subjects;
      const subjectList = Array.isArray(subjects) ? subjects : [];
      const nestedChapters = subjectList.flatMap((subject: any) => subject.chapters || []);
      const separateChapters = Array.isArray(parsed?.chapters) ? parsed.chapters : [];
      const chapters = [...nestedChapters, ...separateChapters];
      const nestedTopics = chapters.flatMap((chapter: any) => chapter.topics || []);
      const separateTopics = Array.isArray(parsed?.topics) ? parsed.topics : [];
      const topics = [...nestedTopics, ...separateTopics];
      const nestedSubtopics = topics.flatMap((topic: any) => topic.subtopics || []);
      const separateSubtopics = Array.isArray(parsed?.subtopics) ? parsed.subtopics : [];
      const subtopics = [...nestedSubtopics, ...separateSubtopics];
      return {
        subjects: subjectList.length,
        chapters: chapters.length,
        topics: topics.length,
        subtopics: subtopics.length,
      };
    } catch {
      return null;
    }
  }, [jsonText]);

  const parseJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError("");
      toast.success("JSON formatted");
    } catch (error: any) {
      setParseError(error.message || "Invalid JSON");
      toast.error("Invalid JSON");
    }
  };

  const loadTemplate = (nextTemplate: "nested" | "separate") => {
    setTemplate(nextTemplate);
    setJsonText(JSON.stringify(nextTemplate === "nested" ? nestedSampleJson : separateSampleJson, null, 2));
    setResult(null);
    setParseError("");
  };

  const submit = async (dryRun: boolean) => {
    let data: unknown;
    try {
      data = JSON.parse(jsonText);
      setParseError("");
    } catch (error: any) {
      setParseError(error.message || "Invalid JSON");
      toast.error("Fix JSON before processing");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/taxonomy/bulk-json", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, mode, dryRun }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Bulk taxonomy processing failed");
      setResult(payload);
      toast.success(dryRun ? "Validation complete" : "Taxonomy import complete");
      if (!dryRun) onImported?.();
    } catch (error: any) {
      toast.error(error.message || "Bulk taxonomy processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="academic-card overflow-hidden">
      <div className="border-b border-border bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-sm border border-border bg-secondary/30 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
            <FileJson size={13} />
            Bulk JSON
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground">Bulk taxonomy processing</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Paste nested JSON or separate level-wise arrays, validate, then import with detailed audit logs.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {(["subjects", "chapters", "topics", "subtopics"] as const).map((key) => (
            <div key={key} className="rounded-sm border border-border bg-background px-2 py-2">
              <div className="font-mono text-base font-bold text-foreground">{localStats?.[key] ?? "-"}</div>
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{key}</div>
            </div>
          ))}
        </div>
      </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          <div className="grid gap-2 sm:flex">
            <button
              type="button"
              onClick={() => loadTemplate("nested")}
              className={`inline-flex items-center justify-center gap-1 rounded-sm border px-3 py-2 text-xs transition-colors ${
                template === "nested"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <ListTree size={13} /> Nested tree
            </button>
            <button
              type="button"
              onClick={() => loadTemplate("separate")}
              className={`inline-flex items-center justify-center gap-1 rounded-sm border px-3 py-2 text-xs transition-colors ${
                template === "separate"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <Layers size={13} /> Separate arrays
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            spellCheck={false}
            className="min-h-[28rem] w-full resize-y rounded-sm border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-primary"
          />
          {parseError && (
            <div className="rounded-sm border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {parseError}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-sm border border-border bg-background p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Import mode</label>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as "upsert" | "createOnly")}
              className="w-full rounded-sm border border-border bg-card px-3 py-2 text-xs"
            >
              <option value="upsert">Upsert existing IDs</option>
              <option value="createOnly">Create only, skip existing</option>
            </select>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={parseJson}
              className="inline-flex items-center justify-center gap-1 rounded-sm border border-border px-3 py-2 text-xs hover:bg-secondary"
            >
              <Clipboard size={13} /> Format JSON
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={processing}
              className="inline-flex items-center justify-center gap-1 rounded-sm border border-border px-3 py-2 text-xs hover:bg-secondary disabled:opacity-50"
            >
              <PlayCircle size={13} /> Validate only
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={processing}
              className="btn-primary inline-flex items-center justify-center gap-1 px-3 py-2 text-xs disabled:opacity-50"
            >
              {processing ? <RefreshCw size={13} className="animate-spin" /> : <UploadCloud size={13} />}
              Import taxonomy
            </button>
          </div>

          <div className="space-y-3">
            {ruleGroups.map((group) => (
              <div key={group.title} className="rounded-sm border border-border bg-background p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {group.items.map((rule) => (
                    <li key={rule} className="border-b border-border-faint pb-2 last:border-0 last:pb-0">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="mx-4 mb-4 rounded-sm border border-border bg-background">
          <div className="grid grid-cols-2 gap-2 border-b border-border p-3 text-center sm:grid-cols-4 lg:grid-cols-8">
            {Object.entries(result.summary).map(([key, value]) => (
              <div key={key}>
                <div className="font-mono text-base font-bold text-foreground">{value}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{key}</div>
              </div>
            ))}
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="min-w-[720px] w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-3 py-2 text-left font-normal text-muted-foreground">Level</th>
                  <th className="px-3 py-2 text-left font-normal text-muted-foreground">ID</th>
                  <th className="px-3 py-2 text-left font-normal text-muted-foreground">Action</th>
                  <th className="px-3 py-2 text-left font-normal text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody>
                {result.actions.map((action, index) => (
                  <tr key={`${action.level}-${action.id}-${index}`} className="border-b border-border-faint">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{action.level}</td>
                    <td className="px-3 py-2 font-mono text-foreground">{action.id}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-sm border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {action.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{action.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
            Request ID: {result.requestId}
          </div>
        </div>
      )}
    </div>
  );
}
