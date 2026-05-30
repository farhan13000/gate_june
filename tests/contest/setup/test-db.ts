import mongoose from "mongoose";
import Contest from "../../../backend/src/models/Contest";
import ContestClaim from "../../../backend/src/models/ContestClaim";
import ContestRegistration from "../../../backend/src/models/ContestRegistration";
import ContestStanding from "../../../backend/src/models/ContestStanding";
import ContestSubmission from "../../../backend/src/models/ContestSubmission";
import Question from "../../../backend/src/models/Question";
import RatingHistory from "../../../backend/src/models/RatingHistory";
import User from "../../../backend/src/models/User";

export async function connectTestDb() {
  const uri = process.env.MONGO_TEST_URI;
  if (!uri) {
    throw new Error("Set MONGO_TEST_URI to an isolated test database. Refusing to use production DB.");
  }
  if (!/test|contest-qa|localhost|127\.0\.0\.1/i.test(uri)) {
    throw new Error(`MONGO_TEST_URI does not look isolated: ${uri}`);
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

export async function resetContestCollections() {
  await Promise.all([
    Contest.deleteMany({}),
    ContestClaim.deleteMany({}),
    ContestRegistration.deleteMany({}),
    ContestStanding.deleteMany({}),
    ContestSubmission.deleteMany({}),
    Question.deleteMany({}),
    RatingHistory.deleteMany({}),
    User.deleteMany({}),
  ]);
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
