import { Request, Response } from "express";
import Question from "../models/Question";
import Theory from "../models/Theory";
import Contest from "../models/Contest";
import User from "../models/User";
import Announcement from "../models/Announcement";
import { getOrCreateSettings } from "../models/PlatformSettings";
import { formatCountdown, formatContestDate, formatAnnouncementDate } from "../utils/countdown";

export const getHomeData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    const now = new Date();

    let problemOfTheDay = null;
    if (settings.problemOfTheDayId) {
      const q = await Question.findOne({
        _id: settings.problemOfTheDayId,
        status: "approved",
      }).select("-auditLog");
      if (q) {
        problemOfTheDay = {
          _id: q._id,
          contentId: q.contentId,
          title: q.title,
          topic: q.topic,
          difficulty: q.difficulty,
          statement: q.statement,
          questionType: q.questionType,
          options: q.options?.map((o: any, idx: number) => ({
            _id: o._id?.toString() || String(idx),
            text: o.text,
          })),
          imageUrl: q.imageUrl,
        };
      }
    }

    const contests = await Contest.find({
      status: "approved",
      showOnHome: true,
      endTime: { $gt: now },
    })
      .sort({ startTime: 1 })
      .limit(5)
      .lean();

    const contestList = contests.map((c) => {
      const start = new Date(c.startTime);
      const { month, day } = formatContestDate(start);
      return {
        _id: c._id,
        month,
        day,
        title: c.title,
        meta: c.meta || c.description,
        countdown: formatCountdown(start),
        startTime: c.startTime,
        endTime: c.endTime,
      };
    });

    const [importantRaw, recentRaw] = await Promise.all([
      Announcement.find({ type: "important", isActive: true })
        .sort({ sortOrder: -1, publishedAt: -1 })
        .limit(10)
        .lean(),
      Announcement.find({ type: "recent", isActive: true })
        .sort({ sortOrder: -1, publishedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const mapAnnouncement = (a: any) => ({
      _id: a._id,
      title: a.title,
      link: a.link,
      date: formatAnnouncementDate(new Date(a.publishedAt)),
      isNew: a.showNewBadge,
    });

    const [problemCount, theoryCount, contestCount, userCount] = await Promise.all([
      Question.countDocuments({ status: "approved" }),
      Theory.countDocuments({ status: "approved" }),
      Contest.countDocuments({ status: "approved" }),
      User.countDocuments(),
    ]);

    res.json({
      problemOfTheDay,
      contests: contestList,
      importantAnnouncements: importantRaw.map(mapAnnouncement),
      recentAnnouncements: recentRaw.map(mapAnnouncement),
      stats: {
        problems: problemCount,
        theories: theoryCount,
        contests: contestCount,
        users: userCount,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getHomeData error:", error);
    res.status(500).json({ message: "Failed to load home data" });
  }
};
