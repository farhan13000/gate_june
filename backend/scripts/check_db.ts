import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const theories = await mongoose.connection.collection("theories").find({}).toArray();
    console.log("Total Theories:", theories.length);
    console.log("Theories contentId distribution:");
    theories.forEach(t => console.log(`- ID: ${t._id}, contentId: '${t.contentId}', status: ${t.status}`));
    
    // Check indexes
    const indexes = await mongoose.connection.collection("theories").indexes();
    console.log("Indexes on theories:", indexes);
    
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
