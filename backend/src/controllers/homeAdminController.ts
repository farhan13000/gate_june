import { Request, Response } from "express";
import Announcement from "../models/Announcement";
import Contest from "../models/Contest";
import Question from "../models/Question";
import { getOrCreateSettings } from "../models/PlatformSettings";

// ── Problem of the Day ───────────────────────────────────────────────────────

export const getHomeSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    let problem = null;
    if (settings.problemOfTheDayId) {
      problem = await Question.findById(settings.problemOfTheDayId).select(
        "title contentId difficulty status topic"
      );
    }
    res.json({
      problemOfTheDayId: settings.problemOfTheDayId?.toString() || null,
      problemOfTheDay: problem,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch home settings" });
  }
};

export const setProblemOfTheDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId } = req.body;

    const settings = await getOrCreateSettings();

    if (!questionId) {
      settings.problemOfTheDayId = null;
      settings.updatedBy = req.currentUser!._id;
      await settings.save();
      res.json({ message: "Problem of the day cleared", problemOfTheDayId: null });
      return;
    }

    const question = await Question.findOne({ _id: questionId, status: "approved" });
    if (!question) {
      res.status(400).json({ message: "Question not found or not approved" });
      return;
    }

    settings.problemOfTheDayId = question._id;
    settings.updatedBy = req.currentUser!._id;
    await settings.save();

    res.json({
      message: "Problem of the day updated",
      problemOfTheDayId: question._id.toString(),
      problemOfTheDay: {
        _id: question._id,
        title: question.title,
        contentId: question.contentId,
        difficulty: question.difficulty,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to set problem of the day" });
  }
};

// ── Announcements ────────────────────────────────────────────────────────────

export const getAnnouncements = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await Announcement.find()
      .sort({ type: 1, sortOrder: -1, publishedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, link, type, isNew, showNewBadge, isActive, sortOrder, publishedAt } = req.body;
    if (!title || !type) {
      res.status(400).json({ message: "title and type are required" });
      return;
    }
    if (!["important", "recent"].includes(type)) {
      res.status(400).json({ message: "type must be important or recent" });
      return;
    }

    const item = await Announcement.create({
      title: title.trim(),
      link: link?.trim() || undefined,
      type,
      showNewBadge: Boolean(showNewBadge ?? isNew),
      isActive: isActive !== false,
      sortOrder: Number(sortOrder) || 0,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      createdBy: req.currentUser!._id,
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create announcement" });
  }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const allowed = ["title", "link", "type", "showNewBadge", "isActive", "sortOrder", "publishedAt"];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    const item = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: patch },
      { new: true, runValidators: true }
    );
    if (!item) {
      res.status(404).json({ message: "Announcement not found" });
      return;
    }
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update announcement" });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Announcement not found" });
      return;
    }
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete announcement" });
  }
};

// ── Contests ───────────────────────────────────────────────────────────────────

export const getContestsAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const contests = await Contest.find()
      .populate("createdBy", "fullName email")
      .sort({ startTime: -1 });
    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contests" });
  }
};

export const createContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, meta, startTime, endTime, showOnHome, status } = req.body;
    if (!title || !description || !startTime || !endTime) {
      res.status(400).json({ message: "title, description, startTime, and endTime are required" });
      return;
    }

    const contest = await Contest.create({
      title: title.trim(),
      description: description.trim(),
      meta: meta?.trim(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      showOnHome: showOnHome !== false,
      status: status || "approved",
      questions: [],
      createdBy: req.currentUser!._id,
      approvedBy: req.currentUser!._id,
    });
    res.status(201).json(contest);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create contest" });
  }
};

export const updateContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    const { title, description, meta, startTime, endTime, showOnHome, status } = req.body;
    if (title !== undefined) contest.title = title.trim();
    if (description !== undefined) contest.description = description.trim();
    if (meta !== undefined) contest.meta = meta?.trim();
    if (startTime !== undefined) contest.startTime = new Date(startTime);
    if (endTime !== undefined) contest.endTime = new Date(endTime);
    if (showOnHome !== undefined) contest.showOnHome = Boolean(showOnHome);
    if (status !== undefined) contest.status = status;

    await contest.save();
    res.json(contest);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update contest" });
  }
};

export const deleteContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }
    res.json({ message: "Contest deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete contest" });
  }
};
