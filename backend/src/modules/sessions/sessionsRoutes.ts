import { Router } from "express";
import {
  getMySessions,
  bookSession,
  updateSessionStatus,
  updateSessionTiming,
} from "./sessionsController";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/my", getMySessions);
router.post("/book", bookSession);
router.patch("/:id/status", updateSessionStatus);
router.put("/:id/timing", updateSessionTiming);

export default router;

