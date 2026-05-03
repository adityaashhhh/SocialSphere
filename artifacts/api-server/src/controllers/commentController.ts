import { Request, Response } from "express";
import { db } from "@workspace/db";
import {
  commentsTable,
  usersTable,
  postsTable,
  likesTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { AuthRequest } from "../middlewares/auth.js";
import { emitNotification } from "../socket/socketHandler.js";
import { io } from "../index.js";

type FormattedComment = {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    profilePicture: string | null;
    bio: string | null;
    isFollowing: boolean;
    followersCount: number;
  };
  postId: string;
  parentCommentId: string | null;
  likesCount: number;
  isLiked: boolean;
  replies: FormattedComment[];
  createdAt: string;
};

async function formatComment(
  comment: typeof commentsTable.$inferSelect,
  viewerId: string | undefined,
  includeReplies = true,
): Promise<FormattedComment> {
  const [author] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, comment.authorId))
    .limit(1);

  let isLiked = false;
  if (viewerId) {
    const like = await db
      .select()
      .from(likesTable)
      .where(
        and(
          eq(likesTable.userId, viewerId),
          eq(likesTable.targetId, comment.id),
          eq(likesTable.targetType, "comment"),
        ),
      )
      .limit(1);
    isLiked = like.length > 0;
  }

  let replies: FormattedComment[] = [];
  if (includeReplies) {
    const replyRows = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.parentCommentId, comment.id));
    replies = await Promise.all(replyRows.map((r) => formatComment(r, viewerId, false))) as typeof replies;
  }

  return {
    id: comment.id,
    text: comment.text,
    author: {
      id: author?.id ?? comment.authorId,
      username: author?.username ?? "",
      displayName: author?.displayName ?? "",
      profilePicture: author?.profilePicture ?? null,
      bio: author?.bio ?? null,
      isFollowing: false,
      followersCount: 0,
    },
    postId: comment.postId,
    parentCommentId: comment.parentCommentId ?? null,
    likesCount: comment.likesCount,
    isLiked,
    replies,
    createdAt: comment.createdAt.toISOString(),
  };
}

export async function getComments(req: Request, res: Response): Promise<void> {
  const { postId } = req.params as { postId: string };
  const viewerId = (req as AuthRequest).user?.userId;

  const topLevel = await db
    .select()
    .from(commentsTable)
    .where(and(eq(commentsTable.postId, postId), isNull(commentsTable.parentCommentId)));

  const formatted = await Promise.all(topLevel.map((c) => formatComment(c, viewerId)));
  res.json(formatted);
}

async function rebuildPostCommentCount(postId: string) {
  const [row] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(commentsTable)
    .where(eq(commentsTable.postId, postId));

  await db
    .update(postsTable)
    .set({ commentsCount: Number(row?.cnt ?? 0) })
    .where(eq(postsTable.id, postId));
}

export async function createComment(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { postId } = req.params as { postId: string };
  const userId = authReq.user!.userId;
  const { text } = req.body as { text: string };

  if (!text?.trim()) {
    res.status(400).json({ error: "Bad Request", message: "text is required" });
    return;
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  if (!post) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  const id = generateId();
  const [comment] = await db
    .insert(commentsTable)
    .values({ id, postId, authorId: userId, text })
    .returning();

  await db
    .update(postsTable)
    .set({ commentsCount: sql`${postsTable.commentsCount} + 1` })
    .where(eq(postsTable.id, postId));

  if (post.authorId !== userId) {
    await db.insert(notificationsTable).values({
      id: generateId(),
      recipientId: post.authorId,
      senderId: userId,
      type: "comment",
      postId,
    });
    emitNotification(io, post.authorId);
  }

  const formatted = await formatComment(comment, userId);
  res.status(201).json(formatted);
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { commentId } = req.params as { commentId: string };
  const userId = authReq.user!.userId;
  const { text } = req.body as { text: string };

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (!comment) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  if (comment.authorId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(commentsTable)
    .set({ text })
    .where(eq(commentsTable.id, commentId))
    .returning();

  res.json(await formatComment(updated, userId));
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { commentId } = req.params as { commentId: string };
  const userId = authReq.user!.userId;

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (!comment) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  if (comment.authorId !== userId && authReq.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
  await rebuildPostCommentCount(comment.postId);

  res.json({ message: "Comment deleted" });
}

export async function toggleCommentLike(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { commentId } = req.params as { commentId: string };
  const userId = authReq.user!.userId;

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (!comment) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  const existing = await db
    .select()
    .from(likesTable)
    .where(
      and(
        eq(likesTable.userId, userId),
        eq(likesTable.targetId, commentId),
        eq(likesTable.targetType, "comment"),
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
          eq(likesTable.targetId, commentId),
          eq(likesTable.targetType, "comment"),
        ),
      );
    await db
      .update(commentsTable)
      .set({ likesCount: sql`${commentsTable.likesCount} - 1` })
      .where(eq(commentsTable.id, commentId));
    liked = false;
  } else {
    await db
      .insert(likesTable)
      .values({ userId, targetId: commentId, targetType: "comment" });
    await db
      .update(commentsTable)
      .set({ likesCount: sql`${commentsTable.likesCount} + 1` })
      .where(eq(commentsTable.id, commentId));
    liked = true;
  }

  const [updated] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  res.json({ liked, likesCount: updated?.likesCount ?? 0 });
}

export async function replyToComment(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const { commentId: parentCommentId } = req.params as { commentId: string };
  const userId = authReq.user!.userId;
  const { text } = req.body as { text: string };

  if (!text?.trim()) {
    res.status(400).json({ error: "Bad Request", message: "text is required" });
    return;
  }

  const [parent] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, parentCommentId))
    .limit(1);

  if (!parent) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  const id = generateId();
  const [reply] = await db
    .insert(commentsTable)
    .values({ id, postId: parent.postId, authorId: userId, text, parentCommentId })
    .returning();

  const formatted = await formatComment(reply, userId, false);
  res.status(201).json(formatted);
}
