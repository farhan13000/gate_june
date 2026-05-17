import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import User, { IUser } from "../models/User";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      currentUser?: IUser;
    }
  }
}

/**
 * Middleware: Requires a valid JWT in the `token` cookie.
 * Attaches the user document to `req.currentUser`.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({ message: "Not authenticated — no token" });
      return;
    }

    const { userId } = verifyToken(token);
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.currentUser = user;
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    res.status(500).json({ message: "Auth middleware error" });
  }
};

/**
 * Middleware: Requires the authenticated user to have role "admin".
 * Must be used AFTER requireAuth.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.currentUser || req.currentUser.role !== "admin") {
    res.status(403).json({ message: "Forbidden — admin access required" });
    return;
  }
  next();
};
