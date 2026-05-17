import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/jwt";

/**
 * POST /api/auth/register
 * Register a new user with email + password.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, institution, targetGateYear } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ message: "fullName, email, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // Will be hashed by the pre-save hook
      authProvider: "local",
      role: "student",
      rating: 0,
      domains: ["GATE_DA"],
      institution: institution?.trim(),
      targetGateYear: targetGateYear ? Number(targetGateYear) : undefined,
    });

    // Issue JWT
    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.status(201).json({
      message: "Account created successfully",
      user: user.toProfile(),
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

/**
 * POST /api/auth/login
 * Login with email + password.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Find user WITH passwordHash (normally excluded via select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash"
    );

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.authProvider === "google" && !user.passwordHash) {
      res.status(401).json({
        message: "This account uses Google Sign-In. Please log in with Google.",
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.json({
      message: "Login successful",
      user: user.toProfile(),
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

/**
 * Called after successful Google OAuth.
 * Issues JWT cookie and redirects to frontend.
 */
export const googleCallback = (req: Request, res: Response): void => {
  try {
    const user = req.user as any;
    if (!user || !user._id) {
      res.redirect(`${process.env.CLIENT_URL || "http://localhost:8080"}/login?error=auth_failed`);
      return;
    }

    const token = generateToken(user._id.toString());
    setTokenCookie(res, token);

    res.redirect(`${process.env.CLIENT_URL || "http://localhost:8080"}/dashboard`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:8080"}/login?error=server_error`);
  }
};

/**
 * POST /api/auth/logout
 * Clear JWT cookie.
 */
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 * (requireAuth middleware must run before this)
 */
export const getMe = (req: Request, res: Response): void => {
  if (!req.currentUser) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  res.json({ user: req.currentUser.toProfile() });
};

// ── Helper ──────────────────────────────────────────────────────────────────

function setTokenCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}
