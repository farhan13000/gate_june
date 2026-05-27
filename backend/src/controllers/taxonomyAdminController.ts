import { Request, Response } from "express";
import Subject from "../models/Subject";
import Chapter from "../models/Chapter";
import Topic from "../models/Topic";
import Subtopic from "../models/Subtopic";
import { processBulkTaxonomyJson } from "../utils/taxonomyBulkProcessor";

// ── Subjects ─────────────────────────────────────────────────────────────────

export const adminGetSubjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find().sort({ order: 1 });
    res.json(subjects);
  } catch {
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

export const adminCreateSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create subject" });
  }
};

export const adminUpdateSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { subjectId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }
    res.json(subject);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update subject" });
  }
};

export const adminDeleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Subject.findOneAndDelete({ subjectId: id });
    await Chapter.deleteMany({ subjectId: id });
    await Topic.deleteMany({ subjectId: id });
    await Subtopic.deleteMany({ subjectId: id });
    res.json({ message: "Subject and descendants deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete subject" });
  }
};

// ── Chapters ─────────────────────────────────────────────────────────────────

export const adminGetChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    const chapters = await Chapter.find(filter).sort({ order: 1 });
    res.json(chapters);
  } catch {
    res.status(500).json({ message: "Failed to fetch chapters" });
  }
};

export const adminCreateChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await Chapter.create(req.body);
    res.status(201).json(chapter);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create chapter" });
  }
};

export const adminUpdateChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await Chapter.findOneAndUpdate(
      { chapterId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }
    res.json(chapter);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update chapter" });
  }
};

export const adminDeleteChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Chapter.findOneAndDelete({ chapterId: id });
    await Topic.deleteMany({ chapterId: id });
    await Subtopic.deleteMany({ chapterId: id });
    res.json({ message: "Chapter and descendants deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete chapter" });
  }
};

// ── Topics ───────────────────────────────────────────────────────────────────

export const adminGetTopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    const topics = await Topic.find(filter).sort({ order: 1 });
    res.json(topics);
  } catch {
    res.status(500).json({ message: "Failed to fetch topics" });
  }
};

export const adminCreateTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const topic = await Topic.create(req.body);
    res.status(201).json(topic);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create topic" });
  }
};

export const adminUpdateTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const topic = await Topic.findOneAndUpdate(
      { topicId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!topic) {
      res.status(404).json({ message: "Topic not found" });
      return;
    }
    res.json(topic);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update topic" });
  }
};

export const adminDeleteTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Topic.findOneAndDelete({ topicId: id });
    await Subtopic.deleteMany({ topicId: id });
    res.json({ message: "Topic and subtopics deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete topic" });
  }
};

// ── Subtopics ────────────────────────────────────────────────────────────────

export const adminGetSubtopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.topicId) filter.topicId = req.query.topicId;
    const subtopics = await Subtopic.find(filter).sort({ order: 1 });
    res.json(subtopics);
  } catch {
    res.status(500).json({ message: "Failed to fetch subtopics" });
  }
};

export const adminCreateSubtopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const subtopic = await Subtopic.create(req.body);
    res.status(201).json(subtopic);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create subtopic" });
  }
};

export const adminUpdateSubtopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const subtopic = await Subtopic.findOneAndUpdate(
      { subtopicId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subtopic) {
      res.status(404).json({ message: "Subtopic not found" });
      return;
    }
    res.json(subtopic);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update subtopic" });
  }
};

export const adminDeleteSubtopic = async (req: Request, res: Response): Promise<void> => {
  try {
    await Subtopic.findOneAndDelete({ subtopicId: req.params.id });
    res.json({ message: "Subtopic deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete subtopic" });
  }
};

/** POST /api/admin/taxonomy/reorder — bulk reorder any level */
export const adminReorderTaxonomy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, items } = req.body as {
      level: "subjects" | "chapters" | "topics" | "subtopics";
      items: { id: string; order: number }[];
    };

    if (!Array.isArray(items)) {
      res.status(400).json({ message: "items must be an array" });
      return;
    }

    const updates = items.map((item) => {
      switch (level) {
        case "subjects":
          return Subject.updateOne({ subjectId: item.id }, { $set: { order: item.order } });
        case "chapters":
          return Chapter.updateOne({ chapterId: item.id }, { $set: { order: item.order } });
        case "topics":
          return Topic.updateOne({ topicId: item.id }, { $set: { order: item.order } });
        case "subtopics":
          return Subtopic.updateOne({ subtopicId: item.id }, { $set: { order: item.order } });
        default:
          return Promise.resolve();
      }
    });

    await Promise.all(updates);

    res.json({ message: "Reorder applied" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to reorder" });
  }
};

/** POST /api/admin/taxonomy/bulk-json - import nested taxonomy JSON */
export const adminBulkTaxonomyJson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, mode, dryRun } = req.body as {
      data?: unknown;
      mode?: "upsert" | "createOnly";
      dryRun?: boolean;
    };

    const result = await processBulkTaxonomyJson(data, {
      mode: mode || "upsert",
      dryRun: Boolean(dryRun),
      performedBy: req.currentUser!._id,
    });

    res.status(result.summary.failed > 0 ? 207 : 200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to process taxonomy JSON" });
  }
};
