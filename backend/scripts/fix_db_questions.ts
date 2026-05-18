import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.collection("questions");
    
    const qs = await db.find({}).toArray();
    for (const q of qs) {
      if (q.status === "pending_review") {
        await db.updateOne({ _id: q._id }, { $unset: { contentId: "" } });
      }
    }
    console.log("Cleared contentId for all pending questions.");
    
    await db.dropIndex("contentId_1").catch(() => {});
    await db.createIndex({ contentId: 1 }, { unique: true, sparse: true });
    console.log("Rebuilt contentId index for questions.");

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
