export interface SubtopicNode {
  subtopicId: string;
  topicId: string;
  chapterId: string;
  subjectId: string;
  name: string;
  order: number;
  enabled?: boolean;
}

export interface TopicNode {
  topicId: string;
  chapterId: string;
  subjectId: string;
  name: string;
  order: number;
  difficultyLevel?: "Beginner" | "Intermediate" | "Advanced";
  enabled?: boolean;
  subtopics: SubtopicNode[];
}

export interface ChapterNode {
  chapterId: string;
  subjectId: string;
  name: string;
  order: number;
  enabled?: boolean;
  topics: TopicNode[];
}

export interface SubjectNode {
  subjectId: string;
  name: string;
  code: string;
  order: number;
  enabled?: boolean;
  chapters: ChapterNode[];
}

export interface HierarchySelection {
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  subtopicId?: string;
}

export interface TaxonomyStats {
  questionCount: number;
  theoryCount: number;
  difficultyDistribution: { Easy: number; Medium: number; Hard: number };
  questionTypeDistribution: { MCQ: number; MSQ: number; NAT: number };
}

export interface ProblemsListResponse {
  questions: Array<Record<string, unknown>>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
