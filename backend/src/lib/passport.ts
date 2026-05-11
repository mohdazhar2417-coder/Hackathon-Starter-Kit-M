import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createUser, findUserByEmail } from "./store.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "placeholder_id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "placeholder_secret";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        let user = await findUserByEmail(email);
        if (!user) {
          // Create a new user if they don't exist
          // We generate a random password hash since they'll use OAuth
          user = await createUser({
            name: profile.displayName,
            email: email,
            passwordHash: "OAUTH_USER_" + Math.random().toString(36).substring(7),
            role: "student",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
