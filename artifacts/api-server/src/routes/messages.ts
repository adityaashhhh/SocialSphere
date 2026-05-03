import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  deleteMessage,
} from "../controllers/messageController.js";

const router = Router();

router.get("/conversations", authMiddleware, getConversations);
router.get("/conversations/:conversationId", authMiddleware, getConversationMessages);
router.post("/send", authMiddleware, sendMessage);
router.delete("/:messageId", authMiddleware, deleteMessage);

export default router;
