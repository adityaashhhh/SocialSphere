import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const likeTargetEnum = pgEnum("like_target", ["post", "comment"]);

export const likesTable = pgTable(
  "likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    targetId: text("target_id").notNull(),
    targetType: likeTargetEnum("target_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.targetId, t.targetType] }),
    index("likes_target_idx").on(t.targetId, t.targetType),
    index("likes_user_idx").on(t.userId),
  ],
);

export type Like = typeof likesTable.$inferSelect;
