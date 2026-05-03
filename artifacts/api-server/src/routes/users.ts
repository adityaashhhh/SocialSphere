import { Router } from "express";
import { authMiddleware, optionalAuth } from "../middlewares/auth.js";
import {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  toggleFollow,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
} from "../controllers/userController.js";

const router = Router();

router.get("/suggestions/list", authMiddleware, getSuggestedUsers);
router.get("/search", optionalAuth, searchUsers);
router.get("/:userId", optionalAuth, getUserProfile);
router.put("/:userId", authMiddleware, updateUserProfile);
router.delete("/:userId", authMiddleware, deleteUser);
router.post("/:userId/follow", authMiddleware, toggleFollow);
router.get("/:userId/followers", optionalAuth, getFollowers);
router.get("/:userId/following", optionalAuth, getFollowing);

export default router;
