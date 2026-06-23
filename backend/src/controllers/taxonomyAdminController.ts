import { Request, Response } from "express";
import Subject from "../models/Subject";
import Chapter from "../models/Chapter";
import Topic from "../models/Topic";
import Subtopic from "../models/Subtopic";
import { processBulkTaxonomyJson } from "../utils/taxonomyBulkProcessor";

type TaxonomyLevel = "subjects" | "chapters" | "topics" | "subtopics";
type TaxonomyBody = Record<string, unknown>;

const editableFields = {
  subjects: ["name", "code", "order", "enabled", "description"],
  chapters: ["name", "order", "enabled", "description"],
  topics: ["name", "order", "difficultyLevel", "enabled", "description"],
  subtopics: ["name", "order", "enabled", "description"],
} as const;

const createFields = {
  subjects: ["subjectId", ...editableFields.subjects],
  chapters: ["chapterId", "subjectId", ...editableFields.chapters],
  topics: ["topicId", "chapterId", "subjectId", ...editableFields.topics],
  subtopics: ["subtopicId", "topicId", "chapterId", "subjectId", ...editableFields.subtopics],
} as const;

function bodyOf(req: Request): TaxonomyBody {
  return req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body as TaxonomyBody : {};
}

function pickFields(body: TaxonomyBody, fields: readonly string[]): TaxonomyBody {
  return fields.reduce<TaxonomyBody>((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field];
    return payload;
  }, {});
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value.trim() : undefined;
}

function sendValidationError(res: Response, error: unknown, fallback: string): void {
  const message = error instanceof Error ? error.message : fallback;
  res.status(400).json({ message });
}

async function requireSubject(subjectId: string) {
  const subject = await Subject.findOne({ subjectId }).select("subjectId").lean();
  if (!subject) throw new Error(`Parent subject "${subjectId}" does not exist.`);
  return subject;
}

async function requireChapter(chapterId: string) {
  const chapter = await Chapter.findOne({ chapterId }).select("chapterId subjectId").lean();
  if (!chapter) throw new Error(`Parent chapter "${chapterId}" does not exist.`);
  return chapter;
}

async function requireTopic(topicId: string) {
  const topic = await Topic.findOne({ topicId }).select("topicId chapterId subjectId").lean();
  if (!topic) throw new Error(`Parent topic "${topicId}" does not exist.`);
  return topic;
}

function sortByOrderThenName<T extends { order?: number; name?: string }>(items: T[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.name || "").localeCompare(b.name || ""));
}

/** GET /api/admin/taxonomy/tree - complete hierarchy, including disabled nodes, for administration. */
export const adminGetTaxonomyTree = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [subjects, chapters, topics, subtopics] = await Promise.all([
      Subject.find().sort({ order: 1, name: 1 }).lean(),
      Chapter.find().sort({ subjectId: 1, order: 1, name: 1 }).lean(),
      Topic.find().sort({ chapterId: 1, order: 1, name: 1 }).lean(),
      Subtopic.find().sort({ topicId: 1, order: 1, name: 1 }).lean(),
    ]);

    res.setHeader("Cache-Control", "no-store");
    res.json(sortByOrderThenName(subjects).map((subject) => ({
      ...subject,
      chapters: sortByOrderThenName(chapters.filter((chapter) => chapter.subjectId === subject.subjectId)).map((chapter) => ({
        ...chapter,
        topics: sortByOrderThenName(topics.filter((topic) => topic.chapterId === chapter.chapterId)).map((topic) => ({
          ...topic,
          subtopics: sortByOrderThenName(subtopics.filter((subtopic) => subtopic.topicId === topic.topicId)),
        })),
      })),
    })));
  } catch {
    res.status(500).json({ message: "Failed to fetch taxonomy tree" });
  }
};

// Subjects
export const adminGetSubjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json(await Subject.find().sort({ order: 1, name: 1 }));
  } catch {
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

export const adminCreateSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), createFields.subjects);
    payload.subjectId = requiredText(payload.subjectId, "subjectId");
    payload.name = requiredText(payload.name, "name");
    payload.code = requiredText(payload.code, "code");
    const subject = await Subject.create(payload);
    res.status(201).json(subject);
  } catch (error) {
    sendValidationError(res, error, "Failed to create subject");
  }
};

export const adminUpdateSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), editableFields.subjects);
    if (Object.keys(payload).length === 0) throw new Error("Provide at least one editable subject field.");
    const subject = await Subject.findOneAndUpdate({ subjectId: req.params.id }, payload, { new: true, runValidators: true });
    if (!subject) return void res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (error) {
    sendValidationError(res, error, "Failed to update subject");
  }
};

export const adminDeleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Subject.findOneAndDelete({ subjectId: req.params.id });
    if (!deleted) return void res.status(404).json({ message: "Subject not found" });
    await Promise.all([
      Chapter.deleteMany({ subjectId: req.params.id }),
      Topic.deleteMany({ subjectId: req.params.id }),
      Subtopic.deleteMany({ subjectId: req.params.id }),
    ]);
    res.json({ message: "Subject and descendants deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete subject" });
  }
};

// Chapters
export const adminGetChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: TaxonomyBody = req.query.subjectId ? { subjectId: req.query.subjectId } : {};
    res.json(await Chapter.find(filter).sort({ order: 1, name: 1 }));
  } catch {
    res.status(500).json({ message: "Failed to fetch chapters" });
  }
};

export const adminCreateChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), createFields.chapters);
    payload.chapterId = requiredText(payload.chapterId, "chapterId");
    payload.name = requiredText(payload.name, "name");
    const subjectId = requiredText(payload.subjectId, "subjectId");
    payload.subjectId = subjectId;
    await requireSubject(subjectId);
    const chapter = await Chapter.create(payload);
    res.status(201).json(chapter);
  } catch (error) {
    sendValidationError(res, error, "Failed to create chapter");
  }
};

export const adminUpdateChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), editableFields.chapters);
    if (Object.keys(payload).length === 0) throw new Error("Chapter ID and parent subject cannot be changed here.");
    const chapter = await Chapter.findOneAndUpdate({ chapterId: req.params.id }, payload, { new: true, runValidators: true });
    if (!chapter) return void res.status(404).json({ message: "Chapter not found" });
    res.json(chapter);
  } catch (error) {
    sendValidationError(res, error, "Failed to update chapter");
  }
};

export const adminDeleteChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Chapter.findOneAndDelete({ chapterId: req.params.id });
    if (!deleted) return void res.status(404).json({ message: "Chapter not found" });
    await Promise.all([
      Topic.deleteMany({ chapterId: req.params.id }),
      Subtopic.deleteMany({ chapterId: req.params.id }),
    ]);
    res.json({ message: "Chapter and descendants deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete chapter" });
  }
};

// Topics
export const adminGetTopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: TaxonomyBody = {};
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    res.json(await Topic.find(filter).sort({ order: 1, name: 1 }));
  } catch {
    res.status(500).json({ message: "Failed to fetch topics" });
  }
};

export const adminCreateTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), createFields.topics);
    payload.topicId = requiredText(payload.topicId, "topicId");
    payload.name = requiredText(payload.name, "name");
    const chapterId = requiredText(payload.chapterId, "chapterId");
    payload.chapterId = chapterId;
    const chapter = await requireChapter(chapterId);
    const requestedSubjectId = optionalText(payload.subjectId);
    if (requestedSubjectId && requestedSubjectId !== chapter.subjectId) {
      throw new Error(`Chapter "${chapter.chapterId}" belongs to subject "${chapter.subjectId}".`);
    }
    payload.subjectId = chapter.subjectId;
    const topic = await Topic.create(payload);
    res.status(201).json(topic);
  } catch (error) {
    sendValidationError(res, error, "Failed to create topic");
  }
};

export const adminUpdateTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), editableFields.topics);
    if (Object.keys(payload).length === 0) throw new Error("Topic ID and parent path cannot be changed here.");
    const topic = await Topic.findOneAndUpdate({ topicId: req.params.id }, payload, { new: true, runValidators: true });
    if (!topic) return void res.status(404).json({ message: "Topic not found" });
    res.json(topic);
  } catch (error) {
    sendValidationError(res, error, "Failed to update topic");
  }
};

export const adminDeleteTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Topic.findOneAndDelete({ topicId: req.params.id });
    if (!deleted) return void res.status(404).json({ message: "Topic not found" });
    await Subtopic.deleteMany({ topicId: req.params.id });
    res.json({ message: "Topic and subtopics deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete topic" });
  }
};

// Subtopics
export const adminGetSubtopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: TaxonomyBody = {};
    if (req.query.topicId) filter.topicId = req.query.topicId;
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    res.json(await Subtopic.find(filter).sort({ order: 1, name: 1 }));
  } catch {
    res.status(500).json({ message: "Failed to fetch subtopics" });
  }
};

export const adminCreateSubtopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), createFields.subtopics);
    payload.subtopicId = requiredText(payload.subtopicId, "subtopicId");
    payload.name = requiredText(payload.name, "name");
    const topicId = requiredText(payload.topicId, "topicId");
    payload.topicId = topicId;
    const topic = await requireTopic(topicId);
    const requestedChapterId = optionalText(payload.chapterId);
    const requestedSubjectId = optionalText(payload.subjectId);
    if (requestedChapterId && requestedChapterId !== topic.chapterId) {
      throw new Error(`Topic "${topic.topicId}" belongs to chapter "${topic.chapterId}".`);
    }
    if (requestedSubjectId && requestedSubjectId !== topic.subjectId) {
      throw new Error(`Topic "${topic.topicId}" belongs to subject "${topic.subjectId}".`);
    }
    payload.chapterId = topic.chapterId;
    payload.subjectId = topic.subjectId;
    const subtopic = await Subtopic.create(payload);
    res.status(201).json(subtopic);
  } catch (error) {
    sendValidationError(res, error, "Failed to create subtopic");
  }
};

export const adminUpdateSubtopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = pickFields(bodyOf(req), editableFields.subtopics);
    if (Object.keys(payload).length === 0) throw new Error("Subtopic ID and parent path cannot be changed here.");
    const subtopic = await Subtopic.findOneAndUpdate({ subtopicId: req.params.id }, payload, { new: true, runValidators: true });
    if (!subtopic) return void res.status(404).json({ message: "Subtopic not found" });
    res.json(subtopic);
  } catch (error) {
    sendValidationError(res, error, "Failed to update subtopic");
  }
};

export const adminDeleteSubtopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Subtopic.findOneAndDelete({ subtopicId: req.params.id });
    if (!deleted) return void res.status(404).json({ message: "Subtopic not found" });
    res.json({ message: "Subtopic deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete subtopic" });
  }
};

/** POST /api/admin/taxonomy/reorder - replace the visible level's ordering in one operation. */
export const adminReorderTaxonomy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, items } = bodyOf(req) as { level?: TaxonomyLevel; items?: Array<{ id?: unknown; order?: unknown }> };
    if (!level || !["subjects", "chapters", "topics", "subtopics"].includes(level)) {
      throw new Error("A valid taxonomy level is required.");
    }
    if (!Array.isArray(items) || items.length === 0) throw new Error("items must be a non-empty array.");

    const idField = level === "subjects" ? "subjectId" : level === "chapters" ? "chapterId" : level === "topics" ? "topicId" : "subtopicId";
    const normalized = items.map((item) => {
      const id = requiredText(item.id, "item id");
      const order = Number(item.order);
      if (!Number.isInteger(order) || order < 1) throw new Error(`Order for "${id}" must be a positive integer.`);
      return { id, order };
    });
    if (new Set(normalized.map((item) => item.id)).size !== normalized.length) throw new Error("Each item can be reordered only once.");

    const Model: any = level === "subjects" ? Subject : level === "chapters" ? Chapter : level === "topics" ? Topic : Subtopic;
    const existingCount = await Model.countDocuments({ [idField]: { $in: normalized.map((item) => item.id) } });
    if (existingCount !== normalized.length) throw new Error("One or more taxonomy items no longer exist. Refresh and try again.");

    await Model.bulkWrite(normalized.map((item) => ({
      updateOne: { filter: { [idField]: item.id }, update: { $set: { order: item.order } } },
    })));
    res.json({ message: "Reorder applied" });
  } catch (error) {
    sendValidationError(res, error, "Failed to reorder taxonomy");
  }
};

/** POST /api/admin/taxonomy/bulk-json - import nested taxonomy JSON. */
export const adminBulkTaxonomyJson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, mode, dryRun } = bodyOf(req) as { data?: unknown; mode?: "upsert" | "createOnly"; dryRun?: boolean };
    if (mode && mode !== "upsert" && mode !== "createOnly") throw new Error("mode must be upsert or createOnly.");
    const result = await processBulkTaxonomyJson(data, {
      mode: mode || "upsert",
      dryRun: Boolean(dryRun),
      performedBy: req.currentUser!._id,
    });
    res.status(result.summary.failed > 0 ? 207 : 200).json(result);
  } catch (error) {
    sendValidationError(res, error, "Failed to process taxonomy JSON");
  }
};
