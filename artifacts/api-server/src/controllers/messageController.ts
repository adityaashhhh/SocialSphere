import { Request, Response } from "express";
import { db } from "@workspace/db";
import {
  conversationsTable,
  conversationParticipantsTable,
  messagesTable,
  messageReadByTable,
  usersTable,
  followsTable,
} from "@workspace/db";
import { eq, and, inArray, desc, count } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { AuthRequest } from "../middlewares/auth.js";

async function formatUser(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [followRow] = await db.select({ cnt: count() }).from(followsTable).where(eq(followsTable.followingId, userId));
  return {
    id: user?.id ?? userId,
    username: user?.username ?? "",
    displayName: user?.displayName ?? "",
    profilePicture: user?.profilePicture ?? null,
    bio: user?.bio ?? null,
    isFollowing: false,
    followersCount: Number(followRow?.cnt ?? 0),
  };
}

async function formatMessage(msg: typeof messagesTable.$inferSelect) {
  const sender = await formatUser(msg.senderId);
  const readByRows = await db
    .select()
    .from(messageReadByTable)
    .where(eq(messageReadByTable.messageId, msg.id));

  return {
    id: msg.id,
    conversationId: msg.conversationId,
    sender,
    text: msg.text ?? null,
    mediaUrl: msg.mediaUrl ?? null,
    readBy: readByRows.map((r) => r.userId),
    createdAt: msg.createdAt.toISOString(),
  };
}

export async function getConversations(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;

  const participantRows = await db
    .select({ conversationId: conversationParticipantsTable.conversationId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, userId));

  const conversationIds = participantRows.map((p) => p.conversationId);
  if (conversationIds.length === 0) {
    res.json([]);
    return;
  }

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(inArray(conversationsTable.id, conversationIds))
    .orderBy(desc(conversationsTable.updatedAt));

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const participantRows = await db
        .select({ userId: conversationParticipantsTable.userId })
        .from(conversationParticipantsTable)
        .where(eq(conversationParticipantsTable.conversationId, conv.id));

      const participants = await Promise.all(participantRows.map((p) => formatUser(p.userId)));

      let lastMessage = null;
      if (conv.lastMessageId) {
        const [msg] = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.id, conv.lastMessageId))
          .limit(1);
        if (msg) lastMessage = await formatMessage(msg);
      }

      const unreadMessages = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conv.id));

      let unreadCount = 0;
      for (const msg of unreadMessages) {
        if (msg.senderId !== userId) {
          const readRow = await db
            .select()
            .from(messageReadByTable)
            .where(and(eq(messageReadByTable.messageId, msg.id), eq(messageReadByTable.userId, userId)))
            .limit(1);
          if (readRow.length === 0) unreadCount++;
        }
      }

      return {
        id: conv.id,
        participants,
        lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt.toISOString(),
      };
    }),
  );

  res.json(result);
}

export async function getConversationMessages(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;
  const { conversationId } = req.params as { conversationId: string };

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(desc(messagesTable.createdAt));

  for (const msg of messages) {
    if (msg.senderId !== userId) {
      const existing = await db
        .select()
        .from(messageReadByTable)
        .where(and(eq(messageReadByTable.messageId, msg.id), eq(messageReadByTable.userId, userId)))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(messageReadByTable).values({ messageId: msg.id, userId });
      }
    }
  }

  const formatted = await Promise.all(messages.map(formatMessage));
  res.json(formatted.reverse());
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;
  const { recipientId, text, mediaUrl } = req.body as {
    recipientId: string;
    text?: string;
    mediaUrl?: string;
  };

  if (!text && !mediaUrl) {
    res.status(400).json({ error: "Bad Request", message: "text or mediaUrl is required" });
    return;
  }

  const myConvs = await db
    .select({ conversationId: conversationParticipantsTable.conversationId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, userId));

  const theirConvs = await db
    .select({ conversationId: conversationParticipantsTable.conversationId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, recipientId));

  const myIds = new Set(myConvs.map((c) => c.conversationId));
  const sharedId = theirConvs.find((c) => myIds.has(c.conversationId))?.conversationId;

  let conversationId: string;
  if (sharedId) {
    conversationId = sharedId;
  } else {
    conversationId = generateId();
    await db.insert(conversationsTable).values({ id: conversationId });
    await db.insert(conversationParticipantsTable).values([
      { conversationId, userId },
      { conversationId, userId: recipientId },
    ]);
  }

  const msgId = generateId();
  const [message] = await db
    .insert(messagesTable)
    .values({
      id: msgId,
      conversationId,
      senderId: userId,
      text: text ?? null,
      mediaUrl: mediaUrl ?? null,
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({ lastMessageId: msgId, updatedAt: new Date() })
    .where(eq(conversationsTable.id, conversationId));

  await db.insert(messageReadByTable).values({ messageId: msgId, userId });

  const formatted = await formatMessage(message);
  res.status(201).json(formatted);
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  const userId = (req as AuthRequest).user!.userId;
  const { messageId } = req.params as { messageId: string };

  const [msg] = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.id, messageId))
    .limit(1);

  if (!msg) {
    res.status(404).json({ error: "Not Found" });
    return;
  }
  if (msg.senderId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(messagesTable).where(eq(messagesTable.id, messageId));
  res.json({ message: "Message deleted" });
}
