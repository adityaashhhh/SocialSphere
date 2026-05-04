import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, followsTable, postsTable, notificationsTable } from "@workspace/db";
import { eq, and, ilike, count, ne, notInArray, sql } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { emitNotification } from "../socket/socketHandler.js";
import { io } from "../index.js";
import { AuthRequest } from "../middlewares/auth.js";
import { formatUser } from "./authController.js";

async function getCounts(userId: string) {
  const [followersRow] = await db
    .select({ cnt: count() })
    .from(followsTable)
    .where(eq(followsTable.followingId, userId));
  const [followingRow] = await db
    .select({ cnt: count() })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));
  const [postsRow] = await db
    .select({ cnt: count() })
    .from(postsTable)
    .where(eq(postsTable.authorId, userId));
  return {
    followersCount: Number(followersRow?.cnt ?? 0),
    followingCount: Number(followingRow?.cnt ?? 0),
    postsCount: Number(postsRow?.cnt ?? 0),
  };
}

async function isFollowing(viewerId: string | undefined, targetId: string): Promise<boolean> {
  if (!viewerId) return false;
  const rows = await db
    .select()
    .from(followsTable)
    .where(and(eq(followsTable.followerId, viewerId), eq(followsTable.followingId, targetId)))
    .limit(1);
  return rows.length > 0;
}

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as { userId: string };
  const viewerId = (req as AuthRequest).user?.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Not Found", message: "User not found" });
    return;
  }

  const counts = await getCounts(userId);
  const following = await isFollowing(viewerId, userId);

  res.json(formatUser(user, following, counts.followersCount, counts.followingCount, counts.postsCount));
}

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { userId } = req.params as { userId: string };

  if (authReq.user?.userId !== userId && authReq.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { displayName, bio, profilePicture, coverPhoto, username } = req.body as {
    displayName?: string;
    bio?: string;
    profilePicture?: string;
    coverPhoto?: string;
    username?: string;
    password?: string;
  };

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (profilePicture !== undefined) updates.profilePicture = profilePicture;
  if (coverPhoto !== undefined) updates.coverPhoto = coverPhoto;
  if (username !== undefined) updates.username = username;
  if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  const counts = await getCounts(userId);
  res.json(formatUser(updated, false, counts.followersCount, counts.followingCount, counts.postsCount));
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { userId } = req.params as { userId: string };

  if (authReq.user?.userId !== userId && authReq.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ message: "Account deleted successfully" });
}

export async function toggleFollow(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { userId: targetId } = req.params as { userId: string };
  const followerId = authReq.user!.userId;

  if (followerId === targetId) {
    res.status(400).json({ error: "Bad Request", message: "Cannot follow yourself" });
    return;
  }

  const existing = await db
    .select()
    .from(followsTable)
    .where(and(eq(followsTable.followerId, followerId), eq(followsTable.followingId, targetId)))
    .limit(1);

  let following: boolean;
  if (existing.length > 0) {
    await db
      .delete(followsTable)
      .where(and(eq(followsTable.followerId, followerId), eq(followsTable.followingId, targetId)));
    following = false;
  } else {
    await db.insert(followsTable).values({ followerId, followingId: targetId });
    following = true;

    // Add notification
    if (true) {
      await db.insert(notificationsTable).values({
        id: generateId(),
        recipientId: targetId,
        senderId: followerId,
        type: "follow",
      });
      emitNotification(io, targetId);
    }
  }

  const [row] = await db
    .select({ cnt: count() })
    .from(followsTable)
    .where(eq(followsTable.followingId, targetId));

  res.json({ following, followersCount: Number(row?.cnt ?? 0) });
}

export async function getFollowers(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as { userId: string };
  const viewerId = (req as AuthRequest).user?.userId;

  const followers = await db
    .select({ user: usersTable })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followerId, usersTable.id))
    .where(eq(followsTable.followingId, userId));

  const result = await Promise.all(
    followers.map(async ({ user }) => {
      const [row] = await db.select({ cnt: count() }).from(followsTable).where(eq(followsTable.followingId, user.id));
      const following = await isFollowing(viewerId, user.id);
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture ?? null,
        bio: user.bio ?? null,
        isFollowing: following,
        followersCount: Number(row?.cnt ?? 0),
      };
    }),
  );

  res.json(result);
}

export async function getFollowing(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as { userId: string };
  const viewerId = (req as AuthRequest).user?.userId;

  const following = await db
    .select({ user: usersTable })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followingId, usersTable.id))
    .where(eq(followsTable.followerId, userId));

  const result = await Promise.all(
    following.map(async ({ user }) => {
      const [row] = await db.select({ cnt: count() }).from(followsTable).where(eq(followsTable.followingId, user.id));
      const isF = await isFollowing(viewerId, user.id);
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture ?? null,
        bio: user.bio ?? null,
        isFollowing: isF,
        followersCount: Number(row?.cnt ?? 0),
      };
    }),
  );

  res.json(result);
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const q = (req.query["q"] as string) ?? "";
  const viewerId = (req as AuthRequest).user?.userId;

  if (!q.trim()) {
    res.json([]);
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(
      sql`${usersTable.username} ilike ${`%${q}%`} OR ${usersTable.displayName} ilike ${`%${q}%`}`,
    )
    .limit(20);

  const result = await Promise.all(
    users.map(async (user) => {
      const [row] = await db.select({ cnt: count() }).from(followsTable).where(eq(followsTable.followingId, user.id));
      const following = await isFollowing(viewerId, user.id);
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture ?? null,
        bio: user.bio ?? null,
        isFollowing: following,
        followersCount: Number(row?.cnt ?? 0),
      };
    }),
  );

  res.json(result);
}

export async function getSuggestedUsers(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;

  let excludeIds: string[] = [];
  if (userId) {
    const following = await db
      .select({ id: followsTable.followingId })
      .from(followsTable)
      .where(eq(followsTable.followerId, userId));
    excludeIds = [userId, ...following.map((f) => f.id)];
  }

  const query = db.select().from(usersTable).limit(10);

  const users =
    excludeIds.length > 0
      ? await db.select().from(usersTable).where(notInArray(usersTable.id, excludeIds)).limit(10)
      : await query;

  const result = await Promise.all(
    users.map(async (user) => {
      const [row] = await db.select({ cnt: count() }).from(followsTable).where(eq(followsTable.followingId, user.id));
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture ?? null,
        bio: user.bio ?? null,
        isFollowing: false,
        followersCount: Number(row?.cnt ?? 0),
      };
    }),
  );

  res.json(result);
}
