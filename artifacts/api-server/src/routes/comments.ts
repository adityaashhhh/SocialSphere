import { Router } from "express";
import { authMiddleware, optionalAuth } from "../middlewares/auth.js";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  replyToComment,
} from "../controllers/commentController.js";

const router = Router();

router.get("/:postId", optionalAuth, getComments);
router.post("/:postId", authMiddleware, createComment);
router.put("/:commentId/edit", authMiddleware, updateComment);
router.delete("/:commentId", authMiddleware, deleteComment);
router.post("/:commentId/like", authMiddleware, toggleCommentLike);
router.post("/:commentId/reply", authMiddleware, replyToComment);

export default router;
