import { Request, Response } from "express";
import Contest from "../models/Contest";
import ContestRegistration from "../models/ContestRegistration";
import ContestClaim from "../models/ContestClaim";
import ContestStanding from "../models/ContestStanding";
import ContestSubmission from "../models/ContestSubmission";
import Question from "../models/Question";
import RatingHistory from "../models/RatingHistory";
import { getContestState, isContestOpenForArena, isContestOpenForRegistration, isPostContestState } from "../utils/contestLifecycle";
import { recomputeContestRanks, recomputeUserStanding } from "../utils/contestScoring";
import { syncContestLifecycleById, syncDueContestLifecycles } from "../utils/contestLifecycleSync";

function normalizeNat(value: string) {
  return String(value || "").trim().toLowerCase();
}

function getNatCorrectValue(solution: any) {
  if (!solution) return "";
  if (typeof solution === "object") {
    if (solution.finalAnswer) return String(solution.finalAnswer);
    if (solution.final_answer) return String(solution.final_answer);
    const block = solution.blocks?.find((item: any) => item.type === "finalAnswer");
    if (block?.content) return String(block.content);
  }
  if (typeof solution === "string") {
    try {
      return getNatCorrectValue(JSON.parse(solution));
    } catch {
      return solution;
    }
  }
  return "";
}

function judgeAnswer(question: any, body: any) {
  let isCorrect = false;

  if (question.questionType === "MCQ") {
    const correct = question.options?.find((option: any) => option.isCorrect);
    isCorrect = Boolean(correct && String(correct._id) === String(body.mcqSelected));
  } else if (question.questionType === "MSQ") {
    const submitted = Array.isArray(body.msqSelected) ? body.msqSelected.map(String).sort() : [];
    const correct = (question.options || [])
      .filter((option: any) => option.isCorrect)
      .map((option: any) => String(option._id))
      .sort();
    isCorrect = submitted.length === correct.length && submitted.every((id: string, index: number) => id === correct[index]);
  } else if (question.questionType === "NAT") {
    const submitted = normalizeNat(body.natAnswer);
    const correct = normalizeNat(getNatCorrectValue(question.solution));
    const subNum = Number(submitted);
    const correctNum = Number(correct);
    isCorrect = submitted === correct;
    if (!isCorrect && Number.isFinite(subNum) && Number.isFinite(correctNum)) {
      isCorrect = Math.abs(subNum - correctNum) < 1e-4;
    }
  }

  const marksAwarded = isCorrect
    ? question.markingScheme?.positive ?? 1
    : -(question.markingScheme?.negative ?? 0);

  return { isCorrect, marksAwarded };
}

async function attachUserRegistration(contests: any[], userId?: string) {
  if (!userId || contests.length === 0) {
    return contests.map((contest) => ({
      ...contest,
      userRegistration: null,
      contestState: getContestState(contest),
    }));
  }

  const ids = contests.map((contest) => contest._id);
  const registrations = await ContestRegistration.find({ contestId: { $in: ids }, userId }).lean();
  const byContest = new Map(registrations.map((registration) => [String(registration.contestId), registration]));

  return contests.map((contest) => ({
    ...contest,
    userRegistration: byContest.get(String(contest._id)) || null,
    contestState: getContestState(contest),
  }));
}

function writeSse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function buildPublicContests(userId?: string) {
  await syncDueContestLifecycles();
  const now = new Date();
  const contests = await Contest.find({
      status: { $in: ["approved", "completed"] },
      visibility: "public",
      lifecycle: { $ne: "draft" },
  })
    .select(
      "title description meta questions contestType visibility scoringMode lifecycle registrationStartTime registrationEndTime startTime endTime freezeTime answerKeyReleaseTime claimsOpenTime claimsCloseTime durationMinutes wrongPenaltyMinutes ratingEnabled instantFeedback maxParticipants rules showOnHome status"
    )
    .populate("questions", "title contentId problemId difficulty questionType topic markingScheme")
    .sort({ startTime: 1 })
    .lean();

  const registrationCounts = await ContestRegistration.aggregate([
    { $match: { contestId: { $in: contests.map((contest) => contest._id) }, status: { $ne: "withdrawn" } } },
    { $group: { _id: "$contestId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(registrationCounts.map((row) => [String(row._id), row.count]));
  const enriched = contests.map((contest) => ({
    ...contest,
    registrationCount: countMap.get(String(contest._id)) || 0,
    isPast: new Date(contest.endTime) < now,
  }));

  return attachUserRegistration(enriched, userId);
}

async function buildContestStandingsPayload(contestId: string, currentUserId?: string) {
  await syncContestLifecycleById(contestId);
  const contest = await Contest.findById(contestId).lean();
  if (!contest) return null;

  await recomputeContestRanks(contest._id);
  const state = getContestState(contest);
  const isFrozen = ["frozen", "live"].includes(state) && contest.freezeTime && Date.now() >= new Date(contest.freezeTime).getTime();
  const showFinal = isPostContestState(state);
  const useVisible = Boolean(isFrozen && !showFinal);

  const standings = await ContestStanding.find({ contestId: contest._id, disqualified: false })
    .populate("userId", "fullName email rating")
    .sort(useVisible ? { visibleRank: 1, updatedAt: 1 } : { rank: 1, updatedAt: 1 })
    .limit(200)
    .lean();

  return {
    contestId: contest._id,
    contestState: state,
    frozen: useVisible,
    final: showFinal,
    standings: standings.map((standing: any) => ({
      _id: standing._id,
      rank: useVisible ? standing.visibleRank || standing.rank : standing.rank,
      user: {
        _id: standing.userId?._id,
        fullName: standing.userId?.fullName || "User",
        rating: standing.userId?.rating || 0,
      },
      score: useVisible ? standing.visibleScore : standing.score,
      solvedCount: standing.solvedCount,
      penaltyMinutes: standing.penaltyMinutes,
      lastAcceptedAt: standing.lastAcceptedAt,
      isCurrentUser: currentUserId ? String(standing.userId?._id) === String(currentUserId) : false,
    })),
  };
}

export const getPublicContests = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await buildPublicContests(req.currentUser?._id?.toString()));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contests" });
  }
};

export const streamPublicContests = async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendUpdate = async () => {
    try {
      writeSse(res, "contests-update", {
        timestamp: new Date().toISOString(),
        contests: await buildPublicContests(req.currentUser?._id?.toString()),
      });
    } catch (error) {
      writeSse(res, "contests-error", { message: "Failed to stream contests" });
    }
  };

  await sendUpdate();
  const timer = setInterval(sendUpdate, 10000);
  req.on("close", () => clearInterval(timer));
};

export const getPublicContestDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    await syncContestLifecycleById(req.params.id);
    const contest = await Contest.findOne({
      _id: req.params.id,
      status: { $in: ["approved", "completed"] },
      visibility: "public",
      lifecycle: { $ne: "draft" },
    })
      .populate("questions", "title contentId problemId difficulty questionType topic markingScheme")
      .lean();

    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    const [registrationCount, personalized] = await Promise.all([
      ContestRegistration.countDocuments({ contestId: contest._id, status: { $ne: "withdrawn" } }),
      attachUserRegistration([contest], req.currentUser?._id?.toString()),
    ]);

    res.json({ ...personalized[0], registrationCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contest" });
  }
};

export const registerForContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await syncContestLifecycleById(req.params.id);
    if (!contest || contest.status !== "approved" || contest.visibility !== "public") {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    if (!isContestOpenForRegistration(contest)) {
      res.status(400).json({ message: "Registration is not open for this contest" });
      return;
    }

    if (contest.maxParticipants) {
      const count = await ContestRegistration.countDocuments({
        contestId: contest._id,
        status: { $ne: "withdrawn" },
      });
      if (count >= contest.maxParticipants) {
        res.status(400).json({ message: "Contest registration is full" });
        return;
      }
    }

    const registration = await ContestRegistration.findOneAndUpdate(
      { contestId: contest._id, userId: req.currentUser!._id },
      {
        $set: {
          status: "registered",
          ratingBefore: req.currentUser!.rating || 0,
        },
        $setOnInsert: { registeredAt: new Date() },
      },
      { new: true, upsert: true }
    );

    res.status(201).json(registration);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to register for contest" });
  }
};

export const withdrawFromContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const registration = await ContestRegistration.findOne({
      contestId: req.params.id,
      userId: req.currentUser!._id,
    });
    if (!registration) {
      res.status(404).json({ message: "Registration not found" });
      return;
    }

    registration.status = "withdrawn";
    await registration.save();
    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: "Failed to withdraw from contest" });
  }
};

export const checkInContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await syncContestLifecycleById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    if (!isContestOpenForArena(contest)) {
      res.status(400).json({ message: "Contest is not live yet" });
      return;
    }

    const registration = await ContestRegistration.findOne({
      contestId: contest._id,
      userId: req.currentUser!._id,
      status: { $in: ["registered", "checked_in"] },
    });
    if (!registration) {
      res.status(403).json({ message: "Register before entering this contest" });
      return;
    }

    registration.status = "checked_in";
    registration.checkedInAt = registration.checkedInAt || new Date();
    registration.startedAt = registration.startedAt || new Date();
    await registration.save();
    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: "Failed to enter contest" });
  }
};

export const getContestRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    await syncContestLifecycleById(req.params.id);
    const contest = await Contest.findById(req.params.id)
      .populate("questions")
      .lean();
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    const state = getContestState(contest);
    if (!isContestOpenForArena(contest) && !isPostContestState(state)) {
      res.status(403).json({ message: "Contest room opens when the contest goes live" });
      return;
    }

    const registration = await ContestRegistration.findOne({
      contestId: contest._id,
      userId: req.currentUser!._id,
      status: { $in: ["registered", "checked_in"] },
    }).lean();
    if (!registration) {
      res.status(403).json({ message: "Register before entering this contest" });
      return;
    }

    const [submissions, claims, ratingChange] = await Promise.all([
      ContestSubmission.find({
      contestId: contest._id,
      userId: req.currentUser!._id,
      }).sort({ submittedAt: -1 }).lean(),
      ContestClaim.find({ contestId: contest._id, userId: req.currentUser!._id })
        .populate("questionId", "title contentId problemId")
        .sort({ createdAt: -1 })
        .lean(),
      RatingHistory.findOne({ contestId: contest._id, userId: req.currentUser!._id }).lean(),
    ]);
    const standing = await ContestStanding.findOne({ contestId: contest._id, userId: req.currentUser!._id }).lean();
    const canReveal = ["answer_key_released", "claims_open", "claims_closed", "finalized", "ratings_applied"].includes(state);
    const claimsOpen = state === "claims_open";
    const attemptedQuestionIds = new Set(submissions.map((submission) => String(submission.questionId)));
    const sanitizedSubmissions = submissions.map((submission: any) => ({
      _id: submission._id,
      contestId: submission.contestId,
      questionId: submission.questionId,
      answer: submission.answer,
      attemptNumber: submission.attemptNumber,
      submittedAt: submission.submittedAt,
      ...(canReveal
        ? {
            isCorrect: submission.isCorrect,
            marksAwarded: submission.marksAwarded,
            judgeStatus: submission.judgeStatus,
          }
        : { judgeStatus: "submitted" }),
    }));
    const visibleStanding = canReveal
      ? standing
      : {
          attemptedCount: attemptedQuestionIds.size,
          problemStats: Array.from(attemptedQuestionIds).map((questionId) => ({
            questionId,
            attempts: submissions.filter((submission) => String(submission.questionId) === questionId).length,
          })),
        };

    const questions = (contest.questions || []).map((question: any) => ({
      _id: question._id,
      title: question.title,
      contentId: question.contentId,
      problemId: question.problemId,
      topic: question.topic,
      difficulty: question.difficulty,
      statement: question.statement,
      questionType: question.questionType,
      imageUrl: question.imageUrl,
      markingScheme: question.markingScheme,
      options: (question.options || []).map((option: any) => ({
        _id: option._id,
        text: option.text,
        ...(canReveal ? { isCorrect: option.isCorrect } : {}),
      })),
      ...(canReveal ? { solution: question.solution } : {}),
    }));

    res.json({
      contest: {
        ...contest,
        questions,
        contestState: state,
      },
      registration,
      submissions: sanitizedSubmissions,
      standing: visibleStanding,
      claims,
      canSubmit: isContestOpenForArena(contest) && !registration.finishedAt,
      canReveal,
      claimsOpen,
      ratingChange: canReveal ? ratingChange : null,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load contest room" });
  }
};

export const createContestClaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await syncContestLifecycleById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }
    if (getContestState(contest) !== "claims_open") {
      res.status(400).json({ message: "Claims are not open for this contest" });
      return;
    }

    const { questionId, type, title, description } = req.body;
    if (!type || !title || !description) {
      res.status(400).json({ message: "type, title, and description are required" });
      return;
    }

    if (questionId && !contest.questions.map((id) => String(id)).includes(String(questionId))) {
      res.status(400).json({ message: "Question is not part of this contest" });
      return;
    }

    const claim = await ContestClaim.create({
      contestId: contest._id,
      questionId: questionId || undefined,
      userId: req.currentUser!._id,
      type,
      title: String(title).trim(),
      description: String(description).trim(),
    });

    res.status(201).json(claim);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create claim" });
  }
};

export const getContestClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const claims = await ContestClaim.find({
      contestId: req.params.id,
      userId: req.currentUser!._id,
    })
      .populate("questionId", "title contentId problemId")
      .sort({ createdAt: -1 })
      .lean();
    res.json(claims);
  } catch {
    res.status(500).json({ message: "Failed to fetch claims" });
  }
};

export const submitContestAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await syncContestLifecycleById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }
    if (!isContestOpenForArena(contest)) {
      res.status(400).json({ message: "Contest is not accepting submissions" });
      return;
    }

    const registration = await ContestRegistration.findOne({
      contestId: contest._id,
      userId: req.currentUser!._id,
      status: { $in: ["registered", "checked_in"] },
    });
    if (!registration) {
      res.status(403).json({ message: "Register before submitting" });
      return;
    }
    if (registration.finishedAt) {
      res.status(400).json({ message: "Exam already submitted. Responses are locked." });
      return;
    }

    const questionId = req.params.questionId;
    if (!contest.questions.map((id) => String(id)).includes(String(questionId))) {
      res.status(400).json({ message: "Question is not part of this contest" });
      return;
    }

    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    const previousAttempts = await ContestSubmission.countDocuments({
      contestId: contest._id,
      userId: req.currentUser!._id,
      questionId,
    });

    const judged = judgeAnswer(question, req.body);
    const submission = await ContestSubmission.create({
      contestId: contest._id,
      userId: req.currentUser!._id,
      questionId,
      answer: {
        mcqSelected: req.body.mcqSelected || null,
        msqSelected: Array.isArray(req.body.msqSelected) ? req.body.msqSelected : [],
        natAnswer: req.body.natAnswer || "",
      },
      isCorrect: judged.isCorrect,
      marksAwarded: judged.marksAwarded,
      attemptNumber: previousAttempts + 1,
      submittedAt: new Date(),
      judgedAt: new Date(),
      judgeStatus: judged.isCorrect ? "accepted" : "wrong",
    });

    const standing = await recomputeUserStanding(contest, req.currentUser!._id);
    await recomputeContestRanks(contest._id);
    res.status(201).json({
      submission,
      standing,
      result: { received: true },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to submit contest answer" });
  }
};

export const finishContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const contest = await syncContestLifecycleById(req.params.id);
    if (!contest) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    if (!isContestOpenForArena(contest)) {
      res.status(400).json({ message: "Contest is not accepting final submission" });
      return;
    }

    const registration = await ContestRegistration.findOne({
      contestId: contest._id,
      userId: req.currentUser!._id,
      status: { $in: ["registered", "checked_in"] },
    });
    if (!registration) {
      res.status(403).json({ message: "Register before finishing this contest" });
      return;
    }

    registration.finishedAt = registration.finishedAt || new Date();
    await registration.save();
    res.json({ finishedAt: registration.finishedAt });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to finish contest" });
  }
};

export const getContestStandings = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = await buildContestStandingsPayload(String(req.params.id), req.currentUser?._id?.toString());
    if (!payload) {
      res.status(404).json({ message: "Contest not found" });
      return;
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contest standings" });
  }
};

export const streamContestStandings = async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendUpdate = async () => {
    try {
      const payload = await buildContestStandingsPayload(String(req.params.id), req.currentUser?._id?.toString());
      if (!payload) {
        writeSse(res, "standings-error", { message: "Contest not found" });
        return;
      }
      writeSse(res, "standings-update", { timestamp: new Date().toISOString(), ...payload });
    } catch {
      writeSse(res, "standings-error", { message: "Failed to stream contest standings" });
    }
  };

  await sendUpdate();
  const timer = setInterval(sendUpdate, 5000);
  req.on("close", () => clearInterval(timer));
};
