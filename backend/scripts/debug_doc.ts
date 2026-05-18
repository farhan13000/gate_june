import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.collection("theories");
    
    const doc = await db.findOne({ _id: new mongoose.Types.ObjectId("6a0b5ac4d22dfaf2cd7aedb4") });
    console.log("Document 6a0b5ac4d22dfaf2cd7aedb4:", doc);
    
    const all = await db.find({ contentId: "PROB-TH-0022" }).toArray();
    console.log("Docs with PROB-TH-0022:", all.map(d => d._id));

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
