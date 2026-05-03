import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const visibilityEnum = pgEnum("post_visibility", [
  "public",
  "followers",
  "private",
]);

export const postsTable = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("posts_author_idx").on(t.authorId),
    index("posts_created_at_idx").on(t.createdAt),
  ],
);

export const postMediaEnum = pgEnum("post_media_type", ["image", "video"]);

export const postMediaTable = pgTable("post_media", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: postMediaEnum("type").notNull(),
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
