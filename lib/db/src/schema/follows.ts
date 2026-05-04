import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const followsTable = sqliteTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follows_follower_idx").on(t.followerId),
    index("follows_following_idx").on(t.followingId),
  ],
);

export type Follow = typeof followsTable.$inferSelect;
