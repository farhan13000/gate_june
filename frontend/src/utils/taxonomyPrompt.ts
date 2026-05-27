import type { SubjectNode } from "@/types/taxonomy";

export function buildTaxonomyPromptContext(tree: SubjectNode[], maxItems = 220): string {
  if (!tree.length) {
    return "No taxonomy loaded. Ask the admin to create taxonomy before generating content.";
  }

  const lines: string[] = [];
  let count = 0;

  for (const subject of tree) {
    if (count >= maxItems) break;
    lines.push(`SUBJECT | id=${subject.subjectId} | code=${subject.code} | name=${subject.name}`);
    count += 1;

    for (const chapter of subject.chapters || []) {
      if (count >= maxItems) break;
      lines.push(`  CHAPTER | id=${chapter.chapterId} | subjectId=${chapter.subjectId} | name=${chapter.name}`);
      count += 1;

      for (const topic of chapter.topics || []) {
        if (count >= maxItems) break;
        lines.push(
          `    TOPIC | id=${topic.topicId} | chapterId=${topic.chapterId} | subjectId=${topic.subjectId} | name=${topic.name} | level=${topic.difficultyLevel || "Beginner"}`
        );
        count += 1;

        for (const subtopic of topic.subtopics || []) {
          if (count >= maxItems) break;
          lines.push(
            `      SUBTOPIC | id=${subtopic.subtopicId} | topicId=${subtopic.topicId} | chapterId=${subtopic.chapterId} | subjectId=${subtopic.subjectId} | name=${subtopic.name}`
          );
          count += 1;
        }
      }
    }
  }

  if (count >= maxItems) {
    lines.push(`... taxonomy truncated to ${maxItems} entries. Use only visible IDs or ask for a narrower taxonomy export.`);
  }

  return lines.join("\n");
}

export function buildSelectedTaxonomyPrompt(params: {
  subjectId?: string;
  subject?: string;
  chapterId?: string;
  chapter?: string;
  topicId?: string;
  topic?: string;
  subtopicId?: string;
  subtopic?: string;
}): string {
  return [
    `subjectId: ${params.subjectId || ""}`,
    `subjectName: ${params.subject || ""}`,
    `chapterId: ${params.chapterId || ""}`,
    `chapterName: ${params.chapter || ""}`,
    `topicId: ${params.topicId || ""}`,
    `topicName: ${params.topic || ""}`,
    `subtopicId: ${params.subtopicId || ""}`,
    `subtopicName: ${params.subtopic || ""}`,
  ].join("\n");
}
