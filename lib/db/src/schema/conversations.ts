import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const conversationsTable = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  lastMessageId: text("last_message_id"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

export const conversationParticipantsTable = sqliteTable(
  "conversation_participants",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index("conv_participants_user_idx").on(t.userId),
    index("conv_participants_conv_idx").on(t.conversationId),
  ],
);

export const messagesTable = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    text: text("text"),
    mediaUrl: text("media_url"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (t) => [
    index("messages_conv_idx").on(t.conversationId),
    index("messages_sender_idx").on(t.senderId),
    index("messages_created_at_idx").on(t.createdAt),
  ],
);

export const messageReadByTable = sqliteTable(
  "message_read_by",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => messagesTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId] })],
);

export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
