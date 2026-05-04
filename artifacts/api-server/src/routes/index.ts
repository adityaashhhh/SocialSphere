import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import postsRouter from "./posts.js";
import commentsRouter from "./comments.js";
import notificationsRouter from "./notifications.js";
import messagesRouter from "./messages.js";
import uploadRouter from "./upload.js";

const router = Router();

router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/posts", postsRouter);
router.use("/comments", commentsRouter);
router.use("/notifications", notificationsRouter);
router.use("/messages", messagesRouter);
router.use("/upload", uploadRouter);

export default router;
