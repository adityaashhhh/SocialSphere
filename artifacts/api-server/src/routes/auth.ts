import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);
router.post("/refresh-token", refreshToken);

export default router;
