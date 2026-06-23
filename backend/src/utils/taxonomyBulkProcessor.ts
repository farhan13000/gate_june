import { Model, Types } from "mongoose";
import crypto from "crypto";
import Subject from "../models/Subject";
import Chapter from "../models/Chapter";
import Topic from "../models/Topic";
import Subtopic from "../models/Subtopic";
import { writePlatformLogs } from "./platformLogger";

type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";
type ImportMode = "upsert" | "createOnly";

interface BaseTaxonomyNode {
  name?: string;
  order?: number;
  enabled?: boolean;
  description?: string;
}

interface BulkSubject extends BaseTaxonomyNode {
  subjectId?: string;
  code?: string;
  chapters?: BulkChapter[];
}

interface BulkChapter extends BaseTaxonomyNode {
  chapterId?: string;
  subjectId?: string;
  topics?: BulkTopic[];
}

interface BulkTopic extends BaseTaxonomyNode {
  topicId?: string;
  subjectId?: string;
  chapterId?: string;
  difficultyLevel?: DifficultyLevel;
  subtopics?: BulkSubtopic[];
}

interface BulkSubtopic extends BaseTaxonomyNode {
  subtopicId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
}

export interface BulkTaxonomyPayload {
  subjects?: BulkSubject[];
  chapters?: BulkChapter[];
  topics?: BulkTopic[];
  subtopics?: BulkSubtopic[];
}

interface BulkContext {
  mode: ImportMode;
  performedBy?: Types.ObjectId;
  requestId: string;
  dryRun: boolean;
}

interface BulkAction {
  level: "subject" | "chapter" | "topic" | "subtopic";
  id: string;
  name: string;
  action: "created" | "updated" | "skipped" | "failed" | "validated";
  status: "success" | "warning" | "error";
  message: string;
  details: Record<string, unknown>;
}

export interface BulkTaxonomyResult {
  requestId: string;
  dryRun: boolean;
  mode: ImportMode;
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
  actions: BulkAction[];
}

const allowedDifficulties = new Set(["Beginner", "Intermediate", "Advanced"]);

function normalizePayload(input: unknown): Required<BulkTaxonomyPayload> {
  if (Array.isArray(input)) {
    return { subjects: input as BulkSubject[], chapters: [], topics: [], subtopics: [] };
  }
  if (!input || typeof input !== "object") {
    throw new Error("JSON must be an object or an array of subject objects.");
  }

  const payload = input as BulkTaxonomyPayload;
  return {
    subjects: Array.isArray(payload.subjects) ? payload.subjects : [],
    chapters: Array.isArray(payload.chapters) ? payload.chapters : [],
    topics: Array.isArray(payload.topics) ? payload.topics : [],
    subtopics: Array.isArray(payload.subtopics) ? payload.subtopics : [],
  };
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOrder(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeEnabled(value: unknown): boolean {
  return value === undefined ? true : Boolean(value);
}

function requireText(value: unknown, field: string, path: string): string {
  const cleaned = cleanString(value);
  if (!cleaned) throw new Error(`${path}: ${field} is required.`);
  return cleaned;
}

function getId(value: unknown, field: string, path: string): string {
  return requireText(value, field, path);
}

function getDifficulty(value: unknown): DifficultyLevel {
  const difficulty = cleanString(value) || "Beginner";
  if (!allowedDifficulties.has(difficulty)) {
    throw new Error(`difficultyLevel must be Beginner, Intermediate, or Advanced.`);
  }
  return difficulty as DifficultyLevel;
}

function publicDetails(payload: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(payload));
}

async function upsertDocument<T extends Record<string, unknown>>(
  level: BulkAction["level"],
  idField: string,
  id: string,
  name: string,
  payload: T,
  ctx: BulkContext,
  actions: BulkAction[]
): Promise<void> {
  const models: Record<BulkAction["level"], Model<any>> = {
    subject: Subject,
    chapter: Chapter,
    topic: Topic,
    subtopic: Subtopic,
  };
  const Model = models[level];
  const existing = await Model.findOne({ [idField]: id });

  if (ctx.mode === "createOnly" && existing) {
    actions.push({
      level,
      id,
      name,
      action: "skipped",
      status: "warning",
      message: `${level} ${id} already exists; skipped in create-only mode.`,
      details: publicDetails(payload),
    });
    return;
  }

  if (ctx.dryRun) {
    actions.push({
      level,
      id,
      name,
      action: "validated",
      status: "success",
      message: `${level} ${id} ${existing ? "can be updated" : "can be created"}.`,
      details: publicDetails(payload),
    });
    return;
  }

  if (existing) {
    await Model.updateOne({ [idField]: id }, { $set: payload }, { runValidators: true });
    actions.push({
      level,
      id,
      name,
      action: "updated",
      status: "success",
      message: `${level} ${id} updated.`,
      details: publicDetails(payload),
    });
  } else {
    await Model.create(payload);
    actions.push({
      level,
      id,
      name,
      action: "created",
      status: "success",
      message: `${level} ${id} created.`,
      details: publicDetails(payload),
    });
  }
}

export async function processBulkTaxonomyJson(
  input: unknown,
  options: { mode?: ImportMode; dryRun?: boolean; performedBy?: Types.ObjectId } = {}
): Promise<BulkTaxonomyResult> {
  const payload = normalizePayload(input);
  const ctx: BulkContext = {
    mode: options.mode || "upsert",
    dryRun: Boolean(options.dryRun),
    performedBy: options.performedBy,
    requestId: crypto.randomUUID(),
  };

  if (
    payload.subjects.length === 0 &&
    payload.chapters.length === 0 &&
    payload.topics.length === 0 &&
    payload.subtopics.length === 0
  ) {
    throw new Error("JSON must include at least one subject, chapter, topic, or subtopic.");
  }

  const actions: BulkAction[] = [];
  const summary = {
    subjects: 0,
    chapters: 0,
    topics: 0,
    subtopics: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  // Keep the parent path verified across this import. This matters for dry runs too:
  // a nested parent may be valid even though it has not been written to Mongo yet.
  const knownSubjects = new Set<string>();
  const knownChapters = new Map<string, string>();
  const knownTopics = new Map<string, { chapterId: string; subjectId: string }>();

  const ensureSubjectExists = async (subjectId: string) => {
    if (knownSubjects.has(subjectId)) return;
    const subject = await Subject.findOne({ subjectId }).select("subjectId").lean();
    if (!subject) throw new Error(`Parent subject "${subjectId}" does not exist in this import or the current taxonomy.`);
    knownSubjects.add(subject.subjectId);
  };

  const resolveChapter = async (chapterId: string) => {
    const known = knownChapters.get(chapterId);
    if (known) return { chapterId, subjectId: known };
    const chapter = await Chapter.findOne({ chapterId }).select("chapterId subjectId").lean();
    if (!chapter) throw new Error(`Parent chapter "${chapterId}" does not exist in this import or the current taxonomy.`);
    knownChapters.set(chapter.chapterId, chapter.subjectId);
    return chapter;
  };

  const resolveTopic = async (topicId: string) => {
    const known = knownTopics.get(topicId);
    if (known) return { topicId, ...known };
    const topic = await Topic.findOne({ topicId }).select("topicId chapterId subjectId").lean();
    if (!topic) throw new Error(`Parent topic "${topicId}" does not exist in this import or the current taxonomy.`);
    knownTopics.set(topic.topicId, { chapterId: topic.chapterId, subjectId: topic.subjectId });
    return topic;
  };

  const processSubject = async (subject: BulkSubject, subjectIndex: number, pathPrefix = "subjects") => {
    const subjectPath = `subjects[${subjectIndex}]`;
    try {
      const subjectId = getId(subject.subjectId, "subjectId", subjectPath);
      const name = requireText(subject.name, "name", subjectPath);
      const subjectPayload = {
        subjectId,
        name,
        code: requireText(subject.code, "code", subjectPath).toUpperCase(),
        order: normalizeOrder(subject.order, subjectIndex + 1),
        enabled: normalizeEnabled(subject.enabled),
        description: cleanString(subject.description),
      };
      await upsertDocument("subject", "subjectId", subjectId, name, subjectPayload, ctx, actions);
      knownSubjects.add(subjectId);
      summary.subjects += 1;

      for (const [chapterIndex, chapter] of (subject.chapters || []).entries()) {
        await processChapter({ ...chapter, subjectId }, chapterIndex, `${subjectPath}.chapters`);
      }
    } catch (error: any) {
      actions.push({
        level: "subject",
        id: cleanString(subject.subjectId) || `subject-${subjectIndex + 1}`,
        name: cleanString(subject.name) || "Invalid subject",
        action: "failed",
        status: "error",
        message: error.message || "Failed to process subject.",
        details: publicDetails({ subject, path: pathPrefix === "subjects" ? subjectPath : `${pathPrefix}[${subjectIndex}]` }),
      });
    }
  };

  const processChapter = async (chapter: BulkChapter, chapterIndex: number, pathPrefix = "chapters") => {
    const chapterPath = `${pathPrefix}[${chapterIndex}]`;
    try {
      const chapterId = getId(chapter.chapterId, "chapterId", chapterPath);
      const subjectId = getId(chapter.subjectId, "subjectId", chapterPath);
      const chapterName = requireText(chapter.name, "name", chapterPath);
      await ensureSubjectExists(subjectId);
      const chapterPayload = {
        chapterId,
        subjectId,
        name: chapterName,
        order: normalizeOrder(chapter.order, chapterIndex + 1),
        enabled: normalizeEnabled(chapter.enabled),
        description: cleanString(chapter.description),
      };
      await upsertDocument("chapter", "chapterId", chapterId, chapterName, chapterPayload, ctx, actions);
      knownChapters.delete(chapterId);
      const effectiveChapter = ctx.dryRun
        ? { chapterId, subjectId }
        : await resolveChapter(chapterId);
      knownChapters.set(chapterId, effectiveChapter.subjectId);
      summary.chapters += 1;

      for (const [topicIndex, topic] of (chapter.topics || []).entries()) {
        await processTopic(
          { ...topic, subjectId: effectiveChapter.subjectId, chapterId },
          topicIndex,
          `${chapterPath}.topics`
        );
      }
    } catch (error: any) {
      actions.push({
        level: "chapter",
        id: cleanString(chapter.chapterId) || `chapter-${chapterIndex + 1}`,
        name: cleanString(chapter.name) || "Invalid chapter",
        action: "failed",
        status: "error",
        message: error.message || "Failed to process chapter.",
        details: publicDetails({ chapter, path: chapterPath }),
      });
    }
  };

  const processTopic = async (topic: BulkTopic, topicIndex: number, pathPrefix = "topics") => {
    const topicPath = `${pathPrefix}[${topicIndex}]`;
    try {
      const topicId = getId(topic.topicId, "topicId", topicPath);
      const chapterId = getId(topic.chapterId, "chapterId", topicPath);
      const subjectId = getId(topic.subjectId, "subjectId", topicPath);
      const topicName = requireText(topic.name, "name", topicPath);
      const chapter = await resolveChapter(chapterId);
      if (chapter.subjectId !== subjectId) {
        throw new Error(`Chapter "${chapterId}" belongs to subject "${chapter.subjectId}", not "${subjectId}".`);
      }
      const topicPayload = {
        topicId,
        chapterId,
        subjectId,
        name: topicName,
        order: normalizeOrder(topic.order, topicIndex + 1),
        difficultyLevel: getDifficulty(topic.difficultyLevel),
        enabled: normalizeEnabled(topic.enabled),
        description: cleanString(topic.description),
      };
      await upsertDocument("topic", "topicId", topicId, topicName, topicPayload, ctx, actions);
      knownTopics.delete(topicId);
      const effectiveTopic = ctx.dryRun
        ? { topicId, chapterId, subjectId }
        : await resolveTopic(topicId);
      knownTopics.set(topicId, { chapterId: effectiveTopic.chapterId, subjectId: effectiveTopic.subjectId });
      summary.topics += 1;

      for (const [subtopicIndex, subtopic] of (topic.subtopics || []).entries()) {
        await processSubtopic(
          {
            ...subtopic,
            subjectId: effectiveTopic.subjectId,
            chapterId: effectiveTopic.chapterId,
            topicId,
          },
          subtopicIndex,
          `${topicPath}.subtopics`
        );
      }
    } catch (error: any) {
      actions.push({
        level: "topic",
        id: cleanString(topic.topicId) || `topic-${topicIndex + 1}`,
        name: cleanString(topic.name) || "Invalid topic",
        action: "failed",
        status: "error",
        message: error.message || "Failed to process topic.",
        details: publicDetails({ topic, path: topicPath }),
      });
    }
  };

  const processSubtopic = async (subtopic: BulkSubtopic, subtopicIndex: number, pathPrefix = "subtopics") => {
    const subtopicPath = `${pathPrefix}[${subtopicIndex}]`;
    try {
      const subtopicId = getId(subtopic.subtopicId, "subtopicId", subtopicPath);
      const topicId = getId(subtopic.topicId, "topicId", subtopicPath);
      const chapterId = getId(subtopic.chapterId, "chapterId", subtopicPath);
      const subjectId = getId(subtopic.subjectId, "subjectId", subtopicPath);
      const subtopicName = requireText(subtopic.name, "name", subtopicPath);
      const topic = await resolveTopic(topicId);
      if (topic.chapterId !== chapterId || topic.subjectId !== subjectId) {
        throw new Error(
          `Topic "${topicId}" belongs to chapter "${topic.chapterId}" and subject "${topic.subjectId}".`
        );
      }
      const subtopicPayload = {
        subtopicId,
        topicId,
        chapterId,
        subjectId,
        name: subtopicName,
        order: normalizeOrder(subtopic.order, subtopicIndex + 1),
        enabled: normalizeEnabled(subtopic.enabled),
        description: cleanString(subtopic.description),
      };
      await upsertDocument("subtopic", "subtopicId", subtopicId, subtopicName, subtopicPayload, ctx, actions);
      summary.subtopics += 1;
    } catch (error: any) {
      actions.push({
        level: "subtopic",
        id: cleanString(subtopic.subtopicId) || `subtopic-${subtopicIndex + 1}`,
        name: cleanString(subtopic.name) || "Invalid subtopic",
        action: "failed",
        status: "error",
        message: error.message || "Failed to process subtopic.",
        details: publicDetails({ subtopic, path: subtopicPath }),
      });
    }
  };

  for (const [subjectIndex, subject] of payload.subjects.entries()) {
    await processSubject(subject, subjectIndex);
  }
  for (const [chapterIndex, chapter] of payload.chapters.entries()) {
    await processChapter(chapter, chapterIndex);
  }
  for (const [topicIndex, topic] of payload.topics.entries()) {
    await processTopic(topic, topicIndex);
  }
  for (const [subtopicIndex, subtopic] of payload.subtopics.entries()) {
    await processSubtopic(subtopic, subtopicIndex);
  }

  for (const action of actions) {
    if (action.action === "created") summary.created += 1;
    if (action.action === "updated") summary.updated += 1;
    if (action.action === "skipped") summary.skipped += 1;
    if (action.action === "failed") summary.failed += 1;
  }

  await writePlatformLogs([
    {
      category: "taxonomy",
      action: ctx.dryRun ? "bulk_json_validation" : "bulk_json_import",
      status: summary.failed > 0 ? "warning" : "success",
      message: ctx.dryRun
        ? `Taxonomy bulk JSON validation completed: ${actions.length} actions checked, ${summary.failed} failed.`
        : `Taxonomy bulk JSON import completed: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped, ${summary.failed} failed.`,
      targetType: "taxonomy",
      details: { summary, mode: ctx.mode, dryRun: ctx.dryRun },
      performedBy: ctx.performedBy,
      requestId: ctx.requestId,
    },
    ...actions.map((action) => ({
      category: "taxonomy",
      action: `bulk_json_${action.action}`,
      status: action.status,
      message: action.message,
      targetType: action.level,
      targetId: action.id,
      details: action.details,
      performedBy: ctx.performedBy,
      requestId: ctx.requestId,
    })),
  ]);

  return {
    requestId: ctx.requestId,
    dryRun: ctx.dryRun,
    mode: ctx.mode,
    summary,
    actions,
  };
}
