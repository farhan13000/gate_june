import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboard, streamDashboard } from "../controllers/dashboardController";

const router = Router();

router.get("/", requireAuth, getDashboard);
router.get("/stream", requireAuth, streamDashboard);

export default router;
