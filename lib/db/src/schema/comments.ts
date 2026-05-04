import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";

export const commentsTable = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    parentCommentId: text("parent_comment_id"),
    likesCount: integer("likes_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (t) => [
    index("comments_post_idx").on(t.postId),
    index("comments_author_idx").on(t.authorId),
    index("comments_parent_idx").on(t.parentCommentId),
  ],
);

export type Comment = typeof commentsTable.$inferSelect;
