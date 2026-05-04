import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const notificationsTable = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["like", "comment", "follow", "mention"] }).notNull(),
    postId: text("post_id"),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (t) => [
    index("notifications_recipient_idx").on(t.recipientId),
    index("notifications_read_idx").on(t.recipientId, t.read),
  ],
);

export type Notification = typeof notificationsTable.$inferSelect;
