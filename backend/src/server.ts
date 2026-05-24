import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";

import connectDB from "./config/db";
import { ensureTaxonomySeeded } from "./utils/ensureTaxonomy";
import configurePassport from "./config/passport";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import problemRoutes from "./routes/problems";
import dashboardRoutes from "./routes/dashboard";
import leaderboardRoutes from "./routes/leaderboard";
import homeRoutes from "./routes/home";
import taxonomyRoutes from "./routes/taxonomy";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    credentials: true, // Allow cookies
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport (no sessions — we use JWT cookies)
app.use(passport.initialize());
configurePassport();

// ── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/taxonomy", taxonomyRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }
);

// ── Start ────────────────────────────────────────────────────────────────────

const startServer = async () => {
  await connectDB();
  await ensureTaxonomySeeded();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
