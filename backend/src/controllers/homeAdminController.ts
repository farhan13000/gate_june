import { Request, Response } from "express";
import Announcement from "../models/Announcement";
import Contest from "../models/Contest";
import ContestClaim from "../models/ContestClaim";
import ContestRegistration from "../models/ContestRegistration";
import ContestStanding from "../models/ContestStanding";
import ContestSubmission from "../models/ContestSubmission";
import Question from "../models/Question";
import { getOrCreateSettings } from "../models/PlatformSettings";
import { applyContestRatings } from "../utils/contestRating";
import { invalidateHomeCache } from "../utils/homeCache";
import { writePlatformLog } from "../utils/platformLogger";

async function recordContestAdminEvent({
  req,
  contest,
  action,
  message,
  announcementTitle,
  announcementType = "recent",
  link,
  details,
}: {
  req: Request;
  contest: any;
  action: string;
  message: string;
  announcementTitle?: string;
  announcementType?: "important" | "recent";
  link?: string;
  details?: Record<string, unknown>;
}) {
  const contestId = String(contest?._id || "");
  const title = String(contest?.title || "Contest");
  await Promise.allSettled([
    writePlatformLog({
      category: "contest",
      action,
      message,
      targetType: "contest",
      targetId: contestId,
      performedBy: req.currentUser!._id,
      details: {
        contestTitle: title,
        contestType: contest?.contestType,
        lifecycle: contest?.lifecycle,
        status: contest?.status,
        ...details,
      },
    }),
    announcementTitle
      ? Announcement.create({
          title: announcementTitle,
          link: link ?? (contestId ? `/contests/${contestId}/details` : undefined),
          type: announcementType,
          showNewBadge: true,
          isActive: true,
          sortOrder: announcementType === "important" ? 50 : 0,
          publishedAt: new Date(),
          createdBy: req.currentUser!._id,
        })
      : Promise.resolve(),
  ]);
  if (announcementTitle) invalidateHomeCache();
}

function lifecycleAnnouncement(contest: any, previousLifecycle?: string) {
  if (!contest?.lifecycle || contest.lifecycle === previousLifecycle) return null;
  const title = String(contest.title || "Contest");
  if (contest.lifecycle === "registration_open") {
    return { title: `Registration open: ${title}`, type: "important" as const, link: `/contests/${contest._id}/details` };
  }
  if (contest.lifecycle === "live") {
    return { title: `Contest is live: ${title}`, type: "important" as const, link: `/contests/${contest._id}` };
  }
  if (contest.lifecycle === "answer_key_released") {
    return { title: `Answer key released: ${title}`, type: "important" as const, link: `/contests/${contest._id}` };
  }
  if (contest.lifecycle === "claims_open") {
    return { title: `Claims window open: ${title}`, type: "important" as const, link: `/contests/${contest._id}` };
  }
  if (contest.lifecycle === "finalized" || contest.lifecycle === "ratings_applied") {
    return { title: `Result declared: ${title}`, type: "important" as const, link: `/contests/${contest._id}` };
  }
  return null;
}

function parseOptionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateContestTiming({
  startTime,
  endTime,
  registrationStartTime,
  registrationEndTime,
}: {
  startTime?: Date;
  endTime?: Date;
  registrationStartTime?: Date;
  registrationEndTime?: Date;
}) {
  if (!startTime || Number.isNaN(startTime.getTime())) return "startTime must be a valid date";
  if (!endTime || Number.isNaN(endTime.getTime())) return "endTime must be a valid date";
  if (endTime.getTime() <= startTime.getTime()) return "endTime must be after startTime";
  if (registrationStartTime && Number.isNaN(registrationStartTime.getTime())) {
    return "registrationStartTime must be a valid date";
  }
  if (registrationEndTime && Number.isNaN(registrationEndTime.getTime())) {
    return "registrationEndTime must be a valid date";
  }
  const effectiveRegistrationStartTime =
    registrationStartTime || new Date(startTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  const effectiveRegistrationEndTime = registrationEndTime || startTime;
  if (effectiveRegistrationEndTime.getTime() <= effectiveRegistrationStartTime.getTime()) {
    return "registrationEndTime must be after registrationStartTime";
  }
  if (registrationStartTime && registrationStartTime.getTime() >= startTime.getTime()) {
    return "registrationStartTime must be before startTime";
  }
  if (registrationEndTime && registrationEndTime.getTime() > startTime.getTime()) {
    return "registrationEndTime must be before or equal to startTime";
  }
  return null;
}

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

    invalidateHomeCache();

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
    
    invalidateHomeCache();
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
    
    invalidateHomeCache();
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
    
    invalidateHomeCache();
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
      .populate("questions", "title contentId problemId difficulty questionType topic markingScheme")
      .sort({ startTime: -1 });
    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contests" });
  }
};

export const createContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      meta,
      startTime,
      endTime,
      showOnHome,
      status,
      contestType,
      visibility,
      scoringMode,
      lifecycle,
      registrationStartTime,
      registrationEndTime,
      freezeTime,
      answerKeyReleaseTime,
      claimsOpenTime,
      claimsCloseTime,
      wrongPenaltyMinutes,
      ratingEnabled,
      instantFeedback,
      maxParticipants,
      instructions,
      rules,
    } = req.body;
    if (!title || !description || !startTime || !endTime) {
      res.status(400).json({ message: "title, description, startTime, and endTime are required" });
      return;
    }
    const parsedStartTime = parseOptionalDate(startTime);
    const parsedEndTime = parseOptionalDate(endTime);
    const parsedRegistrationStartTime = parseOptionalDate(registrationStartTime);
    const parsedRegistrationEndTime = parseOptionalDate(registrationEndTime);
    const timingError = validateContestTiming({
      startTime: parsedStartTime || undefined,
      endTime: parsedEndTime || undefined,
      registrationStartTime: parsedRegistrationStartTime || undefined,
      registrationEndTime: parsedRegistrationEndTime || undefined,
    });
    if (timingError) {
      res.status(400).json({ message: timingError });
      return;
    }

    const contest = await Contest.create({
      title: title.trim(),
      description: description.trim(),
      meta: meta?.trim(),
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      contestType: contestType || "full_mock",
      visibility: visibility || "public",
      scoringMode: scoringMode || "gate",
      lifecycle: lifecycle || "published",
      registrationStartTime: parsedRegistrationStartTime || undefined,
      registrationEndTime: parsedRegistrationEndTime || undefined,
      freezeTime: freezeTime ? new Date(freezeTime) : undefined,
      answerKeyReleaseTime: answerKeyReleaseTime ? new Date(answerKeyReleaseTime) : undefined,
      claimsOpenTime: claimsOpenTime ? new Date(claimsOpenTime) : undefined,
      claimsCloseTime: claimsCloseTime ? new Date(claimsCloseTime) : undefined,
      wrongPenaltyMinutes: Number.isFinite(Number(wrongPenaltyMinutes)) ? Number(wrongPenaltyMinutes) : undefined,
      ratingEnabled: Boolean(ratingEnabled),
      instantFeedback: Boolean(instantFeedback),
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      instructions: instructions?.trim(),
      rules: Array.isArray(rules) ? rules.filter(Boolean).map((rule: string) => String(rule).trim()) : undefined,
      showOnHome: showOnHome !== false,
      status: status || "approved",
      questions: [],
      createdBy: req.currentUser!._id,
      approvedBy: req.currentUser!._id,
    });

    await recordContestAdminEvent({
      req,
      contest,
      action: "contest_created",
      message: `Contest "${contest.title}" created.`,
      announcementTitle: `Upcoming contest: ${contest.title}`,
      announcementType: "recent",
      link: `/contests/${contest._id}/details`,
      details: {
        startTime: contest.startTime,
        endTime: contest.endTime,
        ratingEnabled: contest.ratingEnabled,
        scoringMode: contest.scoringMode,
      },
    });
    
    invalidateHomeCache();
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
    const previousLifecycle = contest.lifecycle;

    const {
      title,
      description,
      meta,
      startTime,
      endTime,
      showOnHome,
      status,
      contestType,
      visibility,
      scoringMode,
      lifecycle,
      registrationStartTime,
      registrationEndTime,
      freezeTime,
      answerKeyReleaseTime,
      claimsOpenTime,
      claimsCloseTime,
      wrongPenaltyMinutes,
      ratingEnabled,
      instantFeedback,
      maxParticipants,
      instructions,
      rules,
    } = req.body;
    const hasTimingUpdate =
      startTime !== undefined ||
      endTime !== undefined ||
      registrationStartTime !== undefined ||
      registrationEndTime !== undefined;
    const parsedStartTime = startTime !== undefined ? parseOptionalDate(startTime) : contest.startTime;
    const parsedEndTime = endTime !== undefined ? parseOptionalDate(endTime) : contest.endTime;
    const parsedRegistrationStartTime =
      registrationStartTime !== undefined ? parseOptionalDate(registrationStartTime) : contest.registrationStartTime;
    const parsedRegistrationEndTime =
      registrationEndTime !== undefined ? parseOptionalDate(registrationEndTime) : contest.registrationEndTime;

    if (hasTimingUpdate) {
      const timingError = validateContestTiming({
        startTime: parsedStartTime || undefined,
        endTime: parsedEndTime || undefined,
        registrationStartTime: parsedRegistrationStartTime || undefined,
        registrationEndTime: parsedRegistrationEndTime || undefined,
      });
      if (timingError) {
        res.status(400).json({ message: timingError });
        return;
      }
    }

    if (title !== undefined) contest.title = title.trim();
    if (description !== undefined) contest.description = description.trim();
    if (meta !== undefined) contest.meta = meta?.trim();
    if (startTime !== undefined && parsedStartTime) contest.startTime = parsedStartTime;
    if (endTime !== undefined && parsedEndTime) contest.endTime = parsedEndTime;
    if (contestType !== undefined) contest.contestType = contestType;
    if (visibility !== undefined) contest.visibility = visibility;
    if (scoringMode !== undefined) contest.scoringMode = scoringMode;
    if (lifecycle !== undefined) contest.lifecycle = lifecycle;
    if (registrationStartTime !== undefined) {
      contest.registrationStartTime = parsedRegistrationStartTime || undefined;
    }
    if (registrationEndTime !== undefined) {
      contest.registrationEndTime = parsedRegistrationEndTime || undefined;
    }
    if (freezeTime !== undefined) contest.freezeTime = freezeTime ? new Date(freezeTime) : undefined;
    if (answerKeyReleaseTime !== undefined) {
      contest.answerKeyReleaseTime = answerKeyReleaseTime ? new Date(answerKeyReleaseTime) : undefined;
    }
    if (claimsOpenTime !== undefined) contest.claimsOpenTime = claimsOpenTime ? new Date(claimsOpenTime) : undefined;
    if (claimsCloseTime !== undefined) contest.claimsCloseTime = claimsCloseTime ? new Date(claimsCloseTime) : undefined;
    if (wrongPenaltyMinutes !== undefined) contest.wrongPenaltyMinutes = Number(wrongPenaltyMinutes);
    if (ratingEnabled !== undefined) contest.ratingEnabled = Boolean(ratingEnabled);
    if (instantFeedback !== undefined) contest.instantFeedback = Boolean(instantFeedback);
    if (maxParticipants !== undefined) contest.maxParticipants = maxParticipants ? Number(maxParticipants) : undefined;
    if (instructions !== undefined) contest.instructions = instructions?.trim();
    if (rules !== undefined && Array.isArray(rules)) {
      contest.rules = rules.filter(Boolean).map((rule: string) => String(rule).trim());
    }
    if (showOnHome !== undefined) contest.showOnHome = Boolean(showOnHome);
    if (status !== undefined) contest.status = status;

    await contest.save();
    const publicAnnouncement = lifecycleAnnouncement(contest, previousLifecycle);
    await recordContestAdminEvent({
      req,
      contest,
      action: "contest_updated",
      message: `Contest "${contest.title}" configuration updated.`,
      announcementTitle: publicAnnouncement?.title,
      announcementType: publicAnnouncement?.type,
      link: publicAnnouncement?.link,
      details: {
        previousLifecycle,
        startTime: contest.startTime,
        endTime: contest.endTime,
        lifecycle: contest.lifecycle,
        ratingEnabled: contest.ratingEnabled,
      },
    });
    invalidateHomeCache();
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
    await recordContestAdminEvent({
      req,
      contest,
      action: "contest_deleted",
      message: `Contest "${contest.title}" deleted.`,
    });
    
    invalidateHomeCache();
    res.json({ message: "Contest deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete contest" });
  }
};

export const getContestAdminDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate("createdBy", "fullName email")
      .populate("questions", "title contentId problemId difficulty questionType status topic markingScheme");
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    const [registrations, submissions, standings, claims] = await Promise.all([
      ContestRegistration.countDocuments({ contestId: contest._id }),
      ContestSubmission.countDocuments({ contestId: contest._id }),
      ContestStanding.countDocuments({ contestId: contest._id }),
      ContestClaim.countDocuments({ contestId: contest._id }),
    ]);

    res.json({
      contest,
      stats: {
        registrations,
        submissions,
        standings,
        claims,
        questions: contest.questions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contest detail" });
  }
};

export const updateContestProblems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      res.status(400).json({ message: "questionIds must be an array" });
      return;
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    const uniqueIds = [...new Set(questionIds.map((id: string) => String(id)).filter(Boolean))];
    const questions = await Question.find({ _id: { $in: uniqueIds }, status: "approved" }).select("_id");
    if (questions.length !== uniqueIds.length) {
      res.status(400).json({ message: "All contest questions must exist and be approved" });
      return;
    }

    contest.questions = questions.map((question) => question._id);
    await contest.save();
    await recordContestAdminEvent({
      req,
      contest,
      action: "contest_problem_set_updated",
      message: `Problem set for "${contest.title}" updated with ${questions.length} approved problems.`,
      details: {
        questionCount: questions.length,
        questionIds: questions.map((question) => String(question._id)),
      },
    });
    invalidateHomeCache();

    const populated = await Contest.findById(contest._id).populate(
      "questions",
      "title contentId problemId difficulty questionType status topic markingScheme"
    );
    res.json(populated);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update contest problems" });
  }
};

export const getContestProblemCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = "", difficulty = "", questionType = "", limit = "50" } = req.query;
    const query: Record<string, any> = { status: "approved" };
    if (difficulty) query.difficulty = difficulty;
    if (questionType) query.questionType = questionType;
    if (String(search).trim()) {
      const needle = String(search).trim();
      query.$or = [
        { title: { $regex: needle, $options: "i" } },
        { contentId: { $regex: needle, $options: "i" } },
        { problemId: { $regex: needle, $options: "i" } },
        { topic: { $regex: needle, $options: "i" } },
      ];
    }

    const questions = await Question.find(query)
      .select("title contentId problemId difficulty questionType topic markingScheme")
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Math.max(1, Number(limit) || 50)));

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contest problem candidates" });
  }
};

export const getContestAdminStandings = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id).select("title lifecycle startTime endTime freezeTime");
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    const [standings, registrations, submissionCounts, submissions] = await Promise.all([
      ContestStanding.find({ contestId: contest._id })
        .populate("userId", "fullName email rating")
        .sort({ rank: 1, score: -1, penaltyMinutes: 1, updatedAt: -1 })
        .limit(300)
        .lean(),
      ContestRegistration.find({ contestId: contest._id, status: { $ne: "withdrawn" } })
        .populate("userId", "fullName email rating")
        .sort({ registeredAt: 1 })
        .lean(),
      ContestSubmission.aggregate([
        { $match: { contestId: contest._id } },
        {
          $group: {
            _id: "$userId",
            submissions: { $sum: 1 },
            attemptedQuestions: { $addToSet: "$questionId" },
            lastSubmittedAt: { $max: "$submittedAt" },
          },
        },
      ]),
      ContestSubmission.find({ contestId: contest._id })
        .populate("questionId", "title contentId problemId questionType options markingScheme")
        .sort({ userId: 1, submittedAt: 1 })
        .lean(),
    ]);

    const submissionsByUser = new Map(
      submissionCounts.map((row: any) => [
        String(row._id),
        {
          submissions: row.submissions || 0,
          attemptedQuestions: row.attemptedQuestions?.length || 0,
          lastSubmittedAt: row.lastSubmittedAt,
        },
      ])
    );
    const responseDetailsByUser = new Map<string, any[]>();
    for (const submission of submissions as any[]) {
      const userId = String(submission.userId);
      const list = responseDetailsByUser.get(userId) || [];
      list.push({
        _id: submission._id,
        question: submission.questionId
          ? {
              _id: submission.questionId._id,
              title: submission.questionId.title,
              contentId: submission.questionId.contentId,
              problemId: submission.questionId.problemId,
              questionType: submission.questionId.questionType,
              options: submission.questionId.options || [],
              markingScheme: submission.questionId.markingScheme,
            }
          : null,
        answer: submission.answer,
        isCorrect: submission.isCorrect,
        marksAwarded: submission.marksAwarded,
        attemptNumber: submission.attemptNumber,
        judgeStatus: submission.judgeStatus,
        source: submission.source,
        submittedAt: submission.submittedAt,
        judgedAt: submission.judgedAt,
      });
      responseDetailsByUser.set(userId, list);
    }
    const registrationsByUser = new Map(registrations.map((registration: any) => [String(registration.userId?._id || registration.userId), registration]));
    const standingRows = standings.map((standing: any) => {
      const userId = String(standing.userId?._id || standing.userId);
      const registration = registrationsByUser.get(userId);
      const submissionStats = submissionsByUser.get(userId) || { submissions: 0, attemptedQuestions: 0, lastSubmittedAt: undefined };
      return {
        _id: standing._id,
        rank: standing.rank,
        visibleRank: standing.visibleRank,
        user: {
          fullName: standing.userId?.fullName || registration?.userId?.fullName || "User",
          email: standing.userId?.email || registration?.userId?.email || "",
          rating: standing.userId?.rating || registration?.userId?.rating || 0,
        },
        score: standing.score,
        visibleScore: standing.visibleScore,
        solvedCount: standing.solvedCount,
        wrongAttempts: standing.wrongAttempts,
        penaltyMinutes: standing.penaltyMinutes,
        disqualified: standing.disqualified,
        registrationStatus: registration?.status || "checked_in",
        registeredAt: registration?.registeredAt,
        startedAt: registration?.startedAt,
        finishedAt: registration?.finishedAt,
        submissionCount: submissionStats.submissions,
        attemptedQuestions: submissionStats.attemptedQuestions,
        lastSubmittedAt: submissionStats.lastSubmittedAt,
        responses: responseDetailsByUser.get(userId) || [],
        updatedAt: standing.updatedAt,
      };
    });
    const standingUserIds = new Set(standings.map((standing: any) => String(standing.userId?._id || standing.userId)));
    const registrationOnlyRows = registrations
      .filter((registration: any) => !standingUserIds.has(String(registration.userId?._id || registration.userId)))
      .map((registration: any) => {
        const userId = String(registration.userId?._id || registration.userId);
        const submissionStats = submissionsByUser.get(userId) || { submissions: 0, attemptedQuestions: 0, lastSubmittedAt: undefined };
        return {
          _id: registration._id,
          rank: undefined,
          visibleRank: undefined,
          user: {
            fullName: registration.userId?.fullName || "User",
            email: registration.userId?.email || "",
            rating: registration.userId?.rating || 0,
          },
          score: 0,
          visibleScore: 0,
          solvedCount: 0,
          wrongAttempts: 0,
          penaltyMinutes: 0,
          disqualified: registration.status === "disqualified",
          registrationStatus: registration.status,
          registeredAt: registration.registeredAt,
          startedAt: registration.startedAt,
          finishedAt: registration.finishedAt,
          submissionCount: submissionStats.submissions,
          attemptedQuestions: submissionStats.attemptedQuestions,
          lastSubmittedAt: submissionStats.lastSubmittedAt,
          responses: responseDetailsByUser.get(userId) || [],
          updatedAt: registration.updatedAt,
        };
      });

    res.json({
      contest,
      standings: [...standingRows, ...registrationOnlyRows],
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contest standings" });
  }
};

export const getContestAdminClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const claims = await ContestClaim.find({ contestId: req.params.id })
      .populate("userId", "fullName email")
      .populate("questionId", "title contentId problemId")
      .populate("reviewedBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(claims);
  } catch {
    res.status(500).json({ message: "Failed to fetch contest claims" });
  }
};

export const updateContestClaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const claim = await ContestClaim.findOne({ _id: req.params.claimId, contestId: req.params.id });
    if (!claim) {
      res.status(404).json({ message: "Claim not found" });
      return;
    }

    const { status, adminResponse } = req.body;
    if (status !== undefined) claim.status = status;
    if (adminResponse !== undefined) claim.adminResponse = String(adminResponse).trim();
    claim.reviewedBy = req.currentUser!._id;
    claim.reviewedAt = new Date();
    await claim.save();
    const contest = await Contest.findById(req.params.id).select("title contestType lifecycle status");
    if (contest) {
      await recordContestAdminEvent({
        req,
        contest,
        action: "contest_claim_updated",
        message: `Claim "${claim.title}" for "${contest.title}" moved to ${claim.status}.`,
        details: {
          claimId: String(claim._id),
          claimStatus: claim.status,
          claimType: claim.type,
        },
      });
    }

    res.json(claim);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update claim" });
  }
};

export const releaseContestAnswerKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }
    contest.lifecycle = "answer_key_released";
    contest.answerKeyReleaseTime = new Date();
    await contest.save();
    await recordContestAdminEvent({
      req,
      contest,
      action: "contest_answer_key_released",
      message: `Answer key released for "${contest.title}".`,
      announcementTitle: `Answer key released: ${contest.title}`,
      announcementType: "important",
      link: `/contests/${contest._id}`,
      details: {
        answerKeyReleaseTime: contest.answerKeyReleaseTime,
      },
    });
    res.json(contest);
  } catch {
    res.status(500).json({ message: "Failed to release answer key" });
  }
};

export const openContestClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }
    contest.lifecycle = "claims_open";
    contest.claimsOpenTime = contest.claimsOpenTime || new Date();
    if (req.body.claimsCloseTime) contest.claimsCloseTime = new Date(req.body.claimsCloseTime);
    await contest.save();
    await recordContestAdminEvent({
      req,
      contest,
      action: "contest_claims_opened",
      message: `Claims opened for "${contest.title}".`,
      announcementTitle: `Claims open: ${contest.title}`,
      announcementType: "important",
      link: `/contests/${contest._id}`,
      details: {
        claimsOpenTime: contest.claimsOpenTime,
        claimsCloseTime: contest.claimsCloseTime,
      },
    });
    res.json(contest);
  } catch {
    res.status(500).json({ message: "Failed to open claims" });
  }
};

export const closeContestClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }
    contest.lifecycle = "claims_closed";
    contest.claimsCloseTime = new Date();
    await contest.save();
    await recordContestAdminEvent({
      req,
      contest,
      action: "contest_claims_closed",
      message: `Claims closed for "${contest.title}".`,
      details: {
        claimsCloseTime: contest.claimsCloseTime,
      },
    });
    res.json(contest);
  } catch {
    res.status(500).json({ message: "Failed to close claims" });
  }
};

export const finalizeContestAndApplyRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    contest.lifecycle = "finalized";
    contest.status = "completed";
    await contest.save();

    if (!contest.ratingEnabled) {
      await recordContestAdminEvent({
        req,
        contest,
        action: "contest_finalized",
        message: `Contest "${contest.title}" finalized without rating changes because it is unrated.`,
        announcementTitle: `Result declared: ${contest.title}`,
        announcementType: "important",
        link: `/contests/${contest._id}`,
        details: {
          ratingEnabled: false,
        },
      });
      res.json({ contest, rating: { applied: false, count: 0, message: "Contest is unrated" } });
      return;
    }

    const rating = await applyContestRatings(contest._id.toString());
    if (rating.applied || rating.count > 0) {
      contest.lifecycle = "ratings_applied";
      await contest.save();
    }
    await recordContestAdminEvent({
      req,
      contest,
      action: rating.applied || rating.count > 0 ? "contest_ratings_applied" : "contest_finalized",
      message: `Contest "${contest.title}" finalized. ${rating.message || `${rating.count} rating changes processed.`}`,
      announcementTitle: rating.applied || rating.count > 0
        ? `Result declared and ratings applied: ${contest.title}`
        : `Result declared: ${contest.title}`,
      announcementType: "important",
      link: `/contests/${contest._id}`,
      details: {
        ratingEnabled: true,
        rating,
      },
    });

    res.json({ contest, rating });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to finalize contest" });
  }
};
