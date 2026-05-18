import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env") });

import User from "../src/models/User";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);
    
    const email = "mdfstar3000@gmail.com";
    const password = "farhanDA@0712";
    
    let user = await User.findOne({ email });
    
    if (user) {
      user.role = "admin";
      user.passwordHash = password; // Will be hashed by pre-save hook
      await user.save();
      console.log(`✅ Updated existing user ${email} to Admin and updated password.`);
    } else {
      user = new User({
        fullName: "Admin",
        email,
        passwordHash: password,
        role: "admin",
        authProvider: "local"
      });
      await user.save();
      console.log(`✅ Created new Admin user ${email}.`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
};

run();
