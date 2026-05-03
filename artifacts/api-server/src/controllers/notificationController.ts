import { Request, Response } from "express";
import { db } from "@workspace/db";
import { notificationsTable, usersTable, followsTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { AuthRequest } from "../middlewares/auth.js";
import { emitNotification } from "../socket/socketHandler.js";
import { io } from "../index.js";

async function formatNotification(n: typeof notificationsTable.$inferSelect) {
  const [sender] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, n.senderId))
    .limit(1);

  const [followRow] = await db
    .select({ cnt: count() })
    .from(followsTable)
    .where(eq(followsTable.followingId, n.senderId));

  return {
    id: n.id,
    type: n.type,
    sender: {
      id: sender?.id ?? n.senderId,
      username: sender?.username ?? "",
      displayName: sender?.displayName ?? "",
      profilePicture: sender?.profilePicture ?? null,
      bio: sender?.bio ?? null,
      isFollowing: false,
      followersCount: Number(followRow?.cnt ?? 0),
    },
    postId: n.postId ?? null,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.recipientId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const formatted = await Promise.all(notifications.map(formatNotification));

  res.json({ notifications: formatted, unreadCount });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;
  const { notificationId } = req.params as { notificationId: string };

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(
      eq(notificationsTable.id, notificationId),
    );

  emitNotification(io, userId);
  res.json({ message: "Notification marked as read" });
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.recipientId, userId));

  emitNotification(io, userId);
  res.json({ message: "All notifications marked as read" });
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;
  const { notificationId } = req.params as { notificationId: string };

  await db
    .delete(notificationsTable)
    .where(eq(notificationsTable.id, notificationId));

  emitNotification(io, userId);
  res.json({ message: "Notification deleted" });
}
