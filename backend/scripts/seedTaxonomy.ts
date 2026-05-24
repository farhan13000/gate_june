/**
 * Seed taxonomy: npm run seed:taxonomy (from backend/)
 */
import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/config/db";
import Subject from "../src/models/Subject";
import Chapter from "../src/models/Chapter";
import Topic from "../src/models/Topic";
import Subtopic from "../src/models/Subtopic";
import { flattenTaxonomySeed } from "../src/data/taxonomySeed";

async function seed() {
  await connectDB();
  const { subjects, chapters, topics, subtopics } = flattenTaxonomySeed();

  console.log("Seeding taxonomy...");
  console.log(`  ${subjects.length} subjects, ${chapters.length} chapters, ${topics.length} topics, ${subtopics.length} subtopics`);

  for (const s of subjects) {
    await Subject.findOneAndUpdate({ subjectId: s.subjectId }, s, { upsert: true, new: true });
  }
  for (const c of chapters) {
    await Chapter.findOneAndUpdate({ chapterId: c.chapterId }, c, { upsert: true, new: true });
  }
  for (const t of topics) {
    await Topic.findOneAndUpdate({ topicId: t.topicId }, t, { upsert: true, new: true });
  }
  for (const st of subtopics) {
    await Subtopic.findOneAndUpdate({ subtopicId: st.subtopicId }, st, { upsert: true, new: true });
  }

  console.log("Taxonomy seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
