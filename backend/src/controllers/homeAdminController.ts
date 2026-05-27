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
    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      res.status(400).json({ message: "endTime must be after startTime" });
      return;
    }

    const contest = await Contest.create({
      title: title.trim(),
      description: description.trim(),
      meta: meta?.trim(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      contestType: contestType || "practice",
      visibility: visibility || "public",
      scoringMode: scoringMode || "gate",
      lifecycle: lifecycle || "published",
      registrationStartTime: registrationStartTime ? new Date(registrationStartTime) : undefined,
      registrationEndTime: registrationEndTime ? new Date(registrationEndTime) : undefined,
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
    if (title !== undefined) contest.title = title.trim();
    if (description !== undefined) contest.description = description.trim();
    if (meta !== undefined) contest.meta = meta?.trim();
    if (startTime !== undefined) contest.startTime = new Date(startTime);
    if (endTime !== undefined) contest.endTime = new Date(endTime);
    if (contest.endTime.getTime() <= contest.startTime.getTime()) {
      res.status(400).json({ message: "endTime must be after startTime" });
      return;
    }
    if (contestType !== undefined) contest.contestType = contestType;
    if (visibility !== undefined) contest.visibility = visibility;
    if (scoringMode !== undefined) contest.scoringMode = scoringMode;
    if (lifecycle !== undefined) contest.lifecycle = lifecycle;
    if (registrationStartTime !== undefined) {
      contest.registrationStartTime = registrationStartTime ? new Date(registrationStartTime) : undefined;
    }
    if (registrationEndTime !== undefined) {
      contest.registrationEndTime = registrationEndTime ? new Date(registrationEndTime) : undefined;
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

    const standings = await ContestStanding.find({ contestId: contest._id })
      .populate("userId", "fullName email rating")
      .sort({ rank: 1, score: -1, penaltyMinutes: 1, updatedAt: -1 })
      .limit(300)
      .lean();

    res.json({
      contest,
      standings: standings.map((standing: any) => ({
        _id: standing._id,
        rank: standing.rank,
        visibleRank: standing.visibleRank,
        user: {
          fullName: standing.userId?.fullName || "User",
          email: standing.userId?.email || "",
          rating: standing.userId?.rating || 0,
        },
        score: standing.score,
        visibleScore: standing.visibleScore,
        solvedCount: standing.solvedCount,
        wrongAttempts: standing.wrongAttempts,
        penaltyMinutes: standing.penaltyMinutes,
        disqualified: standing.disqualified,
        updatedAt: standing.updatedAt,
      })),
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
      res.json({ contest, rating: { applied: false, count: 0, message: "Contest is unrated" } });
      return;
    }

    const rating = await applyContestRatings(contest._id.toString());
    if (rating.applied || rating.count > 0) {
      contest.lifecycle = "ratings_applied";
      await contest.save();
    }

    res.json({ contest, rating });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to finalize contest" });
  }
};
