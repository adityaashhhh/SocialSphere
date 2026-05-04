import { Request, Response } from "express";
import { db } from "@workspace/db";
import {
  postsTable,
  postMediaTable,
  usersTable,
  followsTable,
  likesTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, inArray, desc, count, sql } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { AuthRequest } from "../middlewares/auth.js";
import { emitNotification } from "../socket/socketHandler.js";
import { io } from "../index.js";

async function formatPost(
  post: typeof postsTable.$inferSelect,
  viewerId: string | undefined,
) {
  const [author] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, post.authorId))
    .limit(1);

  const media = await db
    .select()
    .from(postMediaTable)
    .where(eq(postMediaTable.postId, post.id));

  const [followRow] = await db
    .select({ cnt: count() })
    .from(followsTable)
    .where(eq(followsTable.followingId, post.authorId));

  let isLiked = false;
  if (viewerId) {
    const like = await db
      .select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.userId, viewerId),
          eq(likesTable.targetId, post.id),
          eq(likesTable.targetType, "post"),
        ),
      )
      .limit(1);
    isLiked = like.length > 0;
  }

  return {
    id: post.id,
    content: post.content,
    media: media.map((m) => ({ url: m.url, type: m.type })),
    author: {
      id: author?.id ?? post.authorId,
      username: author?.username ?? "",
      displayName: author?.displayName ?? "",
      profilePicture: author?.profilePicture ?? null,
      bio: author?.bio ?? null,
      isFollowing: false,
      followersCount: Number(followRow?.cnt ?? 0),
    },
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    isLiked,
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export async function getFeed(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId;
  const page = Math.max(1, Number(req.query["page"] ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query["limit"] ?? 20)));
  const offset = (page - 1) * limit;

  const following = await db
    .select({ id: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));

  const followingIds = following.map((f) => f.id);
  const authorIds = [userId, ...followingIds];

  const posts =
    authorIds.length > 0
      ? await db
          .select()
          .from(postsTable)
          .where(inArray(postsTable.authorId, authorIds))
          .orderBy(desc(postsTable.createdAt))
          .limit(limit)
          .offset(offset)
      : [];

  const [countRow] =
    authorIds.length > 0
      ? await db
          .select({ cnt: count() })
          .from(postsTable)
          .where(inArray(postsTable.authorId, authorIds))
      : [{ cnt: 0 }];

  const total = Number(countRow?.cnt ?? 0);
  const formatted = await Promise.all(posts.map((p) => formatPost(p, userId)));

  res.json({
    posts: formatted,
    totalCount: total,
    page,
    hasMore: offset + posts.length < total,
  });
}

export async function getExplorePosts(req: Request, res: Response): Promise<void> {
  const viewerId = (req as AuthRequest).user?.userId;
  const page = Math.max(1, Number(req.query["page"] ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query["limit"] ?? 20)));
  const offset = (page - 1) * limit;

  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.visibility, "public"))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ cnt: count() })
    .from(postsTable)
    .where(eq(postsTable.visibility, "public"));

  const total = Number(countRow?.cnt ?? 0);
  const formatted = await Promise.all(posts.map((p) => formatPost(p, viewerId)));

  res.json({
    posts: formatted,
    totalCount: total,
    page,
    hasMore: offset + posts.length < total,
  });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId;
  const { content, media = [], visibility = "public" } = req.body as {
    content: string;
    media?: Array<{ url: string; type: "image" | "video" }>;
    visibility?: "public" | "followers" | "private";
  };

  if (!content?.trim()) {
    res.status(400).json({ error: "Bad Request", message: "content is required" });
    return;
  }

  const id = generateId();
  const [post] = await db
    .insert(postsTable)
    .values({ id, authorId: userId, content, visibility })
    .returning();

  if (media.length > 0) {
    await db.insert(postMediaTable).values(
      media.map((m) => ({ id: generateId(), postId: id, url: m.url, type: m.type })),
    );
  }

  const formatted = await formatPost(post, userId);
  res.status(201).json(formatted);
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const { postId } = req.params as { postId: string };
  const viewerId = (req as AuthRequest).user?.userId;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  if (!post) {
    res.status(404).json({ error: "Not Found", message: "Post not found" });
    return;
  }

  res.json(await formatPost(post, viewerId));
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { postId } = req.params as { postId: string };
  const userId = authReq.user!.userId;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  if (!post) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  if (post.authorId !== userId && authReq.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { content, visibility } = req.body as {
    content?: string;
    visibility?: "public" | "followers" | "private";
  };

  const updates: Partial<typeof postsTable.$inferInsert> = { updatedAt: new Date() };
  if (content !== undefined) updates.content = content;
  if (visibility !== undefined) updates.visibility = visibility;

  const [updated] = await db
    .update(postsTable)
    .set(updates)
    .where(eq(postsTable.id, postId))
    .returning();

  res.json(await formatPost(updated, userId));
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { postId } = req.params as { postId: string };
  const userId = authReq.user!.userId;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  if (!post) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  if (post.authorId !== userId && authReq.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.id, postId));
  res.json({ message: "Post deleted" });
}

export async function togglePostLike(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { postId } = req.params as { postId: string };
  const userId = authReq.user!.userId;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  if (!post) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  const existing = await db
    .select()
    .from(likesTable)
    .where(
      and(
        eq(likesTable.userId, userId),
        eq(likesTable.targetId, postId),
        eq(likesTable.targetType, "post"),
      ),
    )
    .limit(1);

  let liked: boolean;
  if (existing.length > 0) {
    await db
      .delete(likesTable)
      .where(
        and(
          eq(likesTable.userId, userId),
          eq(likesTable.targetId, postId),
          eq(likesTable.targetType, "post"),
        ),
      );
    await db
      .update(postsTable)
      .set({ likesCount: sql`${postsTable.likesCount} - 1` })
      .where(eq(postsTable.id, postId));
    liked = false;
  } else {
    await db
      .insert(likesTable)
      .values({ userId, targetId: postId, targetType: "post" });
    await db
      .update(postsTable)
      .set({ likesCount: sql`${postsTable.likesCount} + 1` })
      .where(eq(postsTable.id, postId));
    liked = true;

    if (true) {
      await db.insert(notificationsTable).values({
        id: generateId(),
        recipientId: post.authorId,
        senderId: userId,
        type: "like",
        postId,
      });
      emitNotification(io, post.authorId);
    }
  }

  const [updated] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);

  res.json({ liked, likesCount: updated?.likesCount ?? 0 });
}

export async function getUserPosts(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as { userId: string };
  const viewerId = (req as AuthRequest).user?.userId;
  const page = Math.max(1, Number(req.query["page"] ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query["limit"] ?? 20)));
  const offset = (page - 1) * limit;

  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.authorId, userId))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ cnt: count() })
    .from(postsTable)
    .where(eq(postsTable.authorId, userId));

  const total = Number(countRow?.cnt ?? 0);
  const formatted = await Promise.all(posts.map((p) => formatPost(p, viewerId)));

  res.json({
    posts: formatted,
    totalCount: total,
    page,
    hasMore: offset + posts.length < total,
  });
}
