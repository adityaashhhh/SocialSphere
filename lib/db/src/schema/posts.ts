import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const postsTable = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    visibility: text("visibility", { enum: ["public", "followers", "private"] }).notNull().default("public"),
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (t) => [
    index("posts_author_idx").on(t.authorId),
    index("posts_created_at_idx").on(t.createdAt),
  ],
);

export const postMediaTable = sqliteTable("post_media", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: text("type", { enum: ["image", "video"] }).notNull(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  createdAt: true,
  updatedAt: true,
  likesCount: true,
  commentsCount: true,
});
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
export type PostMedia = typeof postMediaTable.$inferSelect;
