import { Router } from "express";
import { authMiddleware, optionalAuth } from "../middlewares/auth.js";
import {
  getFeed,
  getExplorePosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  togglePostLike,
  getUserPosts,
} from "../controllers/postController.js";

const router = Router();

router.get("/feed", authMiddleware, getFeed);
router.get("/explore", optionalAuth, getExplorePosts);
router.post("/", authMiddleware, createPost);
router.get("/user/:userId", optionalAuth, getUserPosts);
router.get("/:postId", optionalAuth, getPost);
router.put("/:postId", authMiddleware, updatePost);
router.delete("/:postId", authMiddleware, deletePost);
router.post("/:postId/like", authMiddleware, togglePostLike);

export default router;
