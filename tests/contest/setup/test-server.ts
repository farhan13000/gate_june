import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import adminRoutes from "../../../backend/src/routes/admin";
import authRoutes from "../../../backend/src/routes/auth";
import contestRoutes from "../../../backend/src/routes/contests";

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/contests", contestRoutes);
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
  return app;
}
