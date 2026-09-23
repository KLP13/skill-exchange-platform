import { Router } from "express";
import { saveSessionNotes, getSessionNotes } from "./notesController";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.get("/:sessionId", getSessionNotes);
router.post("/:sessionId", requireAuth, saveSessionNotes);

export default router;
