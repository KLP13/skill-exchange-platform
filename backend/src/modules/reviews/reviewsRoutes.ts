import { Router } from "express";
import { createReview, getMentorReviews, getMyReviews } from "./reviewsController";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.get("/my", requireAuth, getMyReviews);
router.get("/mentor/:mentorId", getMentorReviews);
router.post("/", requireAuth, createReview);

export default router;
