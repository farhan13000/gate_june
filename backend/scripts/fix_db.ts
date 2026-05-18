import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.collection("theories");
    
    const theories = await db.find({}).toArray();
    for (const t of theories) {
      if (t.status === "pending_review") {
        // Unset the contentId so the pre('save') hook can trigger normally when approved
        await db.updateOne({ _id: t._id }, { $unset: { contentId: "" } });
      }
    }
    console.log("Cleared contentId for all pending items.");
    
    // Drop the unique index temporarily and recreate it cleanly
    await db.dropIndex("contentId_1").catch(() => {});
    await db.createIndex({ contentId: 1 }, { unique: true, sparse: true });
    console.log("Rebuilt contentId index.");

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
