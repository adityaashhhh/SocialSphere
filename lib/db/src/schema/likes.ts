import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const likesTable = sqliteTable(
  "likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    targetId: text("target_id").notNull(),
    targetType: text("target_type", { enum: ["post", "comment"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.targetId, t.targetType] }),
    index("likes_target_idx").on(t.targetId, t.targetType),
    index("likes_user_idx").on(t.userId),
  ],
);

export type Like = typeof likesTable.$inferSelect;
