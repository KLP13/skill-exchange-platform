import { Router } from "express";
import { getMentors, getMentorById, updateMyAvailability } from "./mentorsController";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.get("/", getMentors);
router.put("/availability", requireAuth, updateMyAvailability);
router.get("/:id", getMentorById);

export default router;

