import express from "express";
import {
  checkInContest,
  createContestClaim,
  finishContest,
  getContestRoom,
  getContestClaims,
  getContestStandings,
  getPublicContestDetail,
  getPublicContests,
  registerForContest,
  streamContestStandings,
  streamPublicContests,
  submitContestAnswer,
  withdrawFromContest,
} from "../controllers/contestController";
import { optionalAuth, requireAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", optionalAuth, getPublicContests);
router.get("/stream", optionalAuth, streamPublicContests);
router.get("/:id", optionalAuth, getPublicContestDetail);
router.get("/:id/room", requireAuth, getContestRoom);
router.get("/:id/standings", optionalAuth, getContestStandings);
router.get("/:id/standings/stream", optionalAuth, streamContestStandings);
router.get("/:id/claims", requireAuth, getContestClaims);
router.post("/:id/register", requireAuth, registerForContest);
router.post("/:id/withdraw", requireAuth, withdrawFromContest);
router.post("/:id/check-in", requireAuth, checkInContest);
router.post("/:id/finish", requireAuth, finishContest);
router.post("/:id/questions/:questionId/submit", requireAuth, submitContestAnswer);
router.post("/:id/claims", requireAuth, createContestClaim);

export default router;
