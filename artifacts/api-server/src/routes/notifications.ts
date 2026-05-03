import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.put("/read-all", authMiddleware, markAllNotificationsRead);
router.put("/:notificationId/read", authMiddleware, markNotificationRead);
router.delete("/:notificationId", authMiddleware, deleteNotification);

export default router;
