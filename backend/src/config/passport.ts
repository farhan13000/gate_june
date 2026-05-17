import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import User from "../models/User";

const configurePassport = (): void => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const clientURL = process.env.CLIENT_URL || "http://localhost:8080";

  if (!clientID || !clientSecret) {
    console.warn(
      "⚠️  Google OAuth credentials not set — Google login will be disabled"
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: "http://localhost:8080/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done
      ) => {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : undefined;

          if (!email) {
            return done(new Error("No email found in Google profile"), false);
          }

          // Check if user already exists (by googleId or email)
          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            // Link Google account if user registered with email/password before
            if (!user.googleId) {
              user.googleId = profile.id;
              user.authProvider =
                user.authProvider === "local" ? "google" : user.authProvider;
              if (!user.avatarUrl && profile.photos?.[0]?.value) {
                user.avatarUrl = profile.photos[0].value;
              }
              await user.save();
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            googleId: profile.id,
            email,
            fullName: profile.displayName || "User",
            avatarUrl: profile.photos?.[0]?.value || undefined,
            authProvider: "google",
            role: "student",
            rating: 0,
            domains: ["GATE_DA"],
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );

  // Serialize / deserialize (not used with JWT but required by Passport)
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
