import { useEffect, useMemo, useState } from "react";
import { DownloadCloud } from "lucide-react";
import { toast } from "sonner";

interface ExportTreeSubtopic {
  subtopicId: string;
  name: string;
  problems: any[];
  theories: any[];
}

interface ExportTreeTopic {
  topicId: string;
  name: string;
  subtopics: ExportTreeSubtopic[];
}

interface ExportTreeChapter {
  chapterId: string;
  name: string;
  topics: ExportTreeTopic[];
}

interface ExportTreeSubject {
  subjectId: string;
  name: string;
  code?: string;
  chapters: ExportTreeChapter[];
}

type ExportScope = "all" | "subject" | "chapter" | "problem";

interface ProblemOption {
  id: string;
  label: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  item: any;
}

export default function AdminExportManager() {
  const [tree, setTree] = useState<ExportTreeSubject[]>([]);
  const [unmappedProblems, setUnmappedProblems] = useState<any[]>([]);
  const [unmappedTheories, setUnmappedTheories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<ExportScope>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");
  const [problemSearch, setProblemSearch] = useState<string>("");

  const loadExportData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exports/content", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load export data");
      const data = await res.json();
      setTree(data.tree || []);
      setUnmappedProblems(data.unmappedProblems || []);
      setUnmappedTheories(data.unmappedTheories || []);
    } catch (error) {
      toast.error("Could not load export content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExportData();
  }, []);

  const selectedSubject = useMemo(
    () => tree.find((subject) => subject.subjectId === selectedSubjectId) || null,
    [tree, selectedSubjectId]
  );

  const selectedChapter = useMemo(() => {
    if (!selectedSubjectId || !selectedChapterId) return null;
    return selectedSubject?.chapters.find((chapter) => chapter.chapterId === selectedChapterId) || null;
  }, [selectedSubject, selectedChapterId, selectedSubjectId]);

  const problemOptions = useMemo<ProblemOption[]>(
    () =>
      tree.flatMap((subject) =>
        subject.chapters.flatMap((chapter) =>
          chapter.topics.flatMap((topic) =>
            topic.subtopics.flatMap((subtopic) =>
              subtopic.problems.map((problem) => ({
                id: problem._id || problem.id || "",
                label: `${problem.title || problem.statement || "Untitled problem"}`,
                subjectId: subject.subjectId,
                subjectName: subject.name,
                chapterId: chapter.chapterId,
                chapterName: chapter.name,
                topicId: topic.topicId,
                topicName: topic.name,
                subtopicId: subtopic.subtopicId,
                subtopicName: subtopic.name,
                item: problem,
              }))
            )
          )
        )
      ),
    [tree]
  );

  const selectedProblem = useMemo(
    () => problemOptions.find((problem) => problem.id === selectedProblemId) || null,
    [problemOptions, selectedProblemId]
  );

  const filteredProblemOptions = useMemo(() => {
    if (!problemSearch.trim()) return problemOptions;
    const search = problemSearch.toLowerCase();
    return problemOptions.filter(
      (problem) =>
        problem.label.toLowerCase().includes(search) ||
        problem.id.toLowerCase().includes(search) ||
        problem.chapterName.toLowerCase().includes(search) ||
        problem.subjectName.toLowerCase().includes(search)
    );
  }, [problemOptions, problemSearch]);

  const exportJson = (payload: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const buildPayload = () => {
    if (scope === "problem" && selectedProblem) {
      return {
        scope: "problem",
        problem: selectedProblem.item,
        context: {
          subject: {
            subjectId: selectedProblem.subjectId,
            name: selectedProblem.subjectName,
          },
          chapter: {
            chapterId: selectedProblem.chapterId,
            name: selectedProblem.chapterName,
          },
          topic: {
            topicId: selectedProblem.topicId,
            name: selectedProblem.topicName,
          },
          subtopic: {
            subtopicId: selectedProblem.subtopicId,
            name: selectedProblem.subtopicName,
          },
        },
        unmappedProblems,
        unmappedTheories,
      };
    }

    if (scope === "chapter" && selectedSubject && selectedChapter) {
      return {
        scope: "chapter",
        subject: {
          subjectId: selectedSubject.subjectId,
          name: selectedSubject.name,
        },
        chapter: selectedChapter,
        unmappedProblems,
        unmappedTheories,
      };
    }

    if (scope === "subject" && selectedSubject) {
      return {
        scope: "subject",
        subject: selectedSubject,
        unmappedProblems,
        unmappedTheories,
      };
    }

    return { scope: "all", tree, unmappedProblems, unmappedTheories };
  };

  const buildFilename = () => {
    if (scope === "problem" && selectedProblem) {
      const label = selectedProblem.label.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
      return `admin-export-problem-${selectedProblem.id}-${label}.json`;
    }

    if (scope === "chapter" && selectedSubject && selectedChapter) {
      const subjectLabel = selectedSubject.name.replace(/\s+/g, "_");
      const chapterLabel = selectedChapter.name.replace(/\s+/g, "_");
      return `admin-export-${subjectLabel}-${chapterLabel}.json`;
    }

    if (scope === "subject" && selectedSubject) {
      const subjectLabel = selectedSubject.name.replace(/\s+/g, "_");
      return `admin-export-${subjectLabel}.json`;
    }

    return "admin-content-export.json";
  };

  const resetSelection = () => {
    setScope("all");
    setSelectedSubjectId("");
    setSelectedChapterId("");
    setSelectedProblemId("");
  };

  const downloadExport = () => {
    const payload = buildPayload();
    exportJson(payload, buildFilename());
    toast.success("Export downloaded");
  };

  const totalProblems = tree.reduce(
    (sum, subject) =>
      sum +
      subject.chapters.reduce(
        (chapterSum, chapter) =>
          chapterSum +
          chapter.topics.reduce(
            (topicSum, topic) =>
              topicSum + topic.subtopics.reduce((subSum, subtopic) => subSum + subtopic.problems.length, 0),
            0
          ),
        0
      ),
    0
  );

  const totalTheories = tree.reduce(
    (sum, subject) =>
      sum +
      subject.chapters.reduce(
        (chapterSum, chapter) =>
          chapterSum +
          chapter.topics.reduce(
            (topicSum, topic) =>
              topicSum + topic.subtopics.reduce((subSum, subtopic) => subSum + subtopic.theories.length, 0),
            0
          ),
        0
      ),
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-secondary/30 p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Export Manager</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Export the full platform dataset, or pick a specific subject, chapter, or exact problem by name / ID.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resetSelection}
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/40"
            >
              Reset selection
            </button>
            <button
              type="button"
              disabled={
                loading ||
                (scope === "chapter" && !selectedChapter) ||
                (scope === "subject" && !selectedSubject) ||
                (scope === "problem" && !selectedProblem)
              }
              onClick={downloadExport}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold"
            >
              <DownloadCloud size={16} /> Download export
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-sm border border-border bg-background p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Export scope</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {(["all", "subject", "chapter", "problem"] as ExportScope[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setScope(option);
                    setSelectedProblemId("");
                    if (option !== "chapter") setSelectedChapterId("");
                    if (option === "all") setSelectedSubjectId("");
                  }}
                  className={`rounded-sm border px-3 py-2 text-sm font-medium transition ${
                    scope === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {option === "all"
                    ? "Entire platform"
                    : option === "subject"
                    ? "Subject only"
                    : option === "chapter"
                    ? "Chapter only"
                    : "Exact problem"}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {(scope === "subject" || scope === "chapter") && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground" htmlFor="subject-select">
                    Subject
                  </label>
                  <select
                    id="subject-select"
                    value={selectedSubjectId}
                    onChange={(event) => {
                      setSelectedSubjectId(event.target.value);
                      setSelectedChapterId("");
                      if (!event.target.value && scope === "chapter") {
                        setScope("subject");
                      }
                    }}
                    className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="">Select a subject</option>
                    {tree.map((subject) => (
                      <option key={subject.subjectId} value={subject.subjectId}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope === "chapter" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground" htmlFor="chapter-select">
                    Chapter
                  </label>
                  <select
                    id="chapter-select"
                    value={selectedChapterId}
                    onChange={(event) => setSelectedChapterId(event.target.value)}
                    disabled={!selectedSubject}
                    className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-secondary/20"
                  >
                    <option value="">Select a chapter</option>
                    {selectedSubject?.chapters.map((chapter) => (
                      <option key={chapter.chapterId} value={chapter.chapterId}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope === "problem" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground" htmlFor="problem-search">
                      Search problem
                    </label>
                    <input
                      id="problem-search"
                      type="text"
                      value={problemSearch}
                      onChange={(event) => setProblemSearch(event.target.value)}
                      placeholder="Search by title, ID, subject, chapter"
                      className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground" htmlFor="problem-select">
                      Problem name / ID
                    </label>
                    <select
                      id="problem-select"
                      value={selectedProblemId}
                      onChange={(event) => setSelectedProblemId(event.target.value)}
                      className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">Select a problem</option>
                      {filteredProblemOptions.map((problem) => (
                        <option key={problem.id} value={problem.id}>
                          {`${problem.label} (${problem.id})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-sm border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">How it works</div>
              <p className="mt-2 leading-6">
                Choose a scope and exact export target, then download the matching JSON. Subject and chapter exports include only the selected hierarchy and unmapped items.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-sm border border-border bg-background p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Summary counts</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-sm border border-border bg-background p-3 text-sm">
                  <div className="text-muted-foreground">Subjects</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{tree.length}</div>
                </div>
                <div className="rounded-sm border border-border bg-background p-3 text-sm">
                  <div className="text-muted-foreground">Problems</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{totalProblems}</div>
                </div>
                <div className="rounded-sm border border-border bg-background p-3 text-sm">
                  <div className="text-muted-foreground">Theories</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{totalTheories}</div>
                </div>
                <div className="rounded-sm border border-border bg-background p-3 text-sm">
                  <div className="text-muted-foreground">Unmapped</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{unmappedProblems.length + unmappedTheories.length}</div>
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-4">
              <div className="text-sm font-semibold text-foreground">Current selection</div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div>
                  Scope: <span className="text-foreground font-medium capitalize">{scope === "all" ? "Entire platform" : scope}</span>
                </div>
                <div>
                  Subject: <span className="text-foreground font-medium">{selectedSubject?.name || "None"}</span>
                </div>
                <div>
                  Chapter: <span className="text-foreground font-medium">{selectedChapter?.name || "None"}</span>
                </div>
                {scope === "problem" && selectedProblem && (
                  <div>
                    Problem: <span className="text-foreground font-medium">{selectedProblem.label}</span>
                  </div>
                )}
                <div>
                  Filename: <span className="text-foreground font-medium">{buildFilename()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
