import Subject from "../models/Subject";
import Chapter from "../models/Chapter";
import Topic from "../models/Topic";
import Subtopic from "../models/Subtopic";
import { flattenTaxonomySeed } from "../data/taxonomySeed";

export async function ensureTaxonomySeeded(): Promise<void> {
  const count = await Subject.countDocuments();
  if (count > 0) return;

  const { subjects, chapters, topics, subtopics } = flattenTaxonomySeed();

  for (const s of subjects) {
    await Subject.findOneAndUpdate({ subjectId: s.subjectId }, s, { upsert: true });
  }
  for (const c of chapters) {
    await Chapter.findOneAndUpdate({ chapterId: c.chapterId }, c, { upsert: true });
  }
  for (const t of topics) {
    await Topic.findOneAndUpdate({ topicId: t.topicId }, t, { upsert: true });
  }
  for (const st of subtopics) {
    await Subtopic.findOneAndUpdate({ subtopicId: st.subtopicId }, st, { upsert: true });
  }

}
