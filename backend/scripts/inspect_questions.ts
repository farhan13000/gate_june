import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const questions = await mongoose.connection.collection("questions").find({ status: "approved" }).toArray();
    console.log(`Total approved questions: ${questions.length}`);
    
    questions.forEach((q, i) => {
      console.log(`\n--- Question ${i + 1} ---`);
      console.log(`ID: ${q._id}`);
      console.log(`Title: ${q.title}`);
      console.log(`Topic: ${q.topic}`);
      console.log(`Difficulty: ${q.difficulty}`);
      console.log(`Type: ${q.questionType}`);
      console.log(`Options:`, q.options);
      console.log(`Solution:`, typeof q.solution === 'object' ? JSON.stringify(q.solution) : q.solution);
      console.log(`Marking Scheme:`, q.markingScheme);
    });
    
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
