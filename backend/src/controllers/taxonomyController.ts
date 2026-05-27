import { Request, Response } from "express";
import Subject from "../models/Subject";
import Chapter from "../models/Chapter";
import Topic from "../models/Topic";
import Subtopic from "../models/Subtopic";
import Question from "../models/Question";
import Theory from "../models/Theory";
import Submission from "../models/Submission";

/** GET /api/taxonomy/tree — full hierarchy for navigation */
export const getTaxonomyTree = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [subjects, chapters, topics, subtopics] = await Promise.all([
      Subject.find({ enabled: true }).sort({ order: 1 }).lean(),
      Chapter.find({ enabled: true }).sort({ order: 1 }).lean(),
      Topic.find({ enabled: true }).sort({ order: 1 }).lean(),
      Subtopic.find({ enabled: true }).sort({ order: 1 }).lean(),
    ]);

    const tree = subjects.map((s) => ({
      ...s,
      chapters: chapters
        .filter((c) => c.subjectId === s.subjectId)
        .map((c) => ({
          ...c,
          topics: topics
            .filter((t) => t.chapterId === c.chapterId)
            .map((t) => ({
              ...t,
              subtopics: subtopics.filter((st) => st.topicId === t.topicId),
            })),
        })),
    }));

    res.json(tree);
  } catch {
    res.status(500).json({ message: "Failed to fetch taxonomy tree" });
  }
};

/** GET /api/taxonomy/subjects */
export const getSubjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find({ enabled: true }).sort({ order: 1 });
    res.json(subjects);
  } catch {
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

/** GET /api/taxonomy/chapters?subjectId= */
export const getChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { enabled: true };
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    const chapters = await Chapter.find(filter).sort({ order: 1 });
    res.json(chapters);
  } catch {
    res.status(500).json({ message: "Failed to fetch chapters" });
  }
};

/** GET /api/taxonomy/topics?chapterId= */
export const getTopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { enabled: true };
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    const topics = await Topic.find(filter).sort({ order: 1 });
    res.json(topics);
  } catch {
    res.status(500).json({ message: "Failed to fetch topics" });
  }
};

/** GET /api/taxonomy/subtopics?topicId= */
export const getSubtopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { enabled: true };
    if (req.query.topicId) filter.topicId = req.query.topicId;
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    const subtopics = await Subtopic.find(filter).sort({ order: 1 });
    res.json(subtopics);
  } catch {
    res.status(500).json({ message: "Failed to fetch subtopics" });
  }
};

/** GET /api/taxonomy/stats?subtopicId=&topicId=&chapterId=&subjectId= */
export const getTaxonomyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, chapterId, topicId, subtopicId } = req.query;
    const qFilter: Record<string, unknown> = { status: "approved" };
    const tFilter: Record<string, unknown> = { status: "approved" };

    if (subtopicId) {
      qFilter.subtopicId = subtopicId;
      tFilter.subtopicId = subtopicId;
    } else if (topicId) {
      qFilter.topicId = topicId;
      tFilter.topicId = topicId;
    } else if (chapterId) {
      qFilter.chapterId = chapterId;
      tFilter.chapterId = chapterId;
    } else if (subjectId) {
      qFilter.subjectId = subjectId;
      tFilter.subjectId = subjectId;
    }

    const [questions, theories] = await Promise.all([
      Question.find(qFilter).select("_id difficulty questionType").lean(),
      Theory.find(tFilter).select("_id").lean(),
    ]);

    const difficultyDist = { Easy: 0, Medium: 0, Hard: 0 };
    const typeDist = { MCQ: 0, MSQ: 0, NAT: 0 };
    for (const q of questions) {
      if (q.difficulty in difficultyDist) {
        difficultyDist[q.difficulty as keyof typeof difficultyDist]++;
      }
      if (q.questionType in typeDist) {
        typeDist[q.questionType as keyof typeof typeDist]++;
      }
    }

    let attempts = 0;
    let solvedCount = 0;
    if (req.currentUser && questions.length > 0) {
      const rows = await Submission.aggregate([
        {
          $match: {
            userId: req.currentUser._id,
            questionId: { $in: questions.map((question) => question._id) },
          },
        },
        {
          $group: {
            _id: "$questionId",
            attempts: { $sum: 1 },
            solved: { $max: { $cond: ["$isCorrect", 1, 0] } },
          },
        },
      ]);
      attempts = rows.reduce((sum, row) => sum + row.attempts, 0);
      solvedCount = rows.filter((row) => row.solved > 0).length;
    }

    res.json({
      questionCount: questions.length,
      theoryCount: theories.length,
      difficultyDistribution: difficultyDist,
      questionTypeDistribution: typeDist,
      solvedCount,
      attempts,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch taxonomy stats" });
  }
};
