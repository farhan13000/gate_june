import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env") });

import User from "../src/models/User";

const email = process.argv[2];

if (!email) {
  console.log("Usage: npx ts-node scripts/makeAdmin.ts <your-email>");
  process.exit(1);
}

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);
    const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
    
    if (user) {
      console.log(`✅ Successfully promoted ${user.email} to Admin!`);
    } else {
      console.log(`❌ User with email ${email} not found.`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
};

run();
