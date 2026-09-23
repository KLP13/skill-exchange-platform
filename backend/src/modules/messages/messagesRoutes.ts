import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from "./messagesController";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/conversations", getConversations);
router.get("/:conversationId", getMessages);
router.post("/send", sendMessage);
router.patch("/:conversationId/read", markConversationAsRead);

export default router;
