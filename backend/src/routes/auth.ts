import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  getMe,
  googleCallback,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── Email / Password ────────────────────────────────────────────────────────

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ── Current User ────────────────────────────────────────────────────────────

router.get("/me", requireAuth, getMe);

// ── Google OAuth 2.0 ────────────────────────────────────────────────────────

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=google_auth_failed",
  }),
  googleCallback
);

export default router;
