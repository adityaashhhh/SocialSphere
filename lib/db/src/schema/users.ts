import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    profilePicture: text("profile_picture"),
    coverPhoto: text("cover_photo"),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (t) => [index("users_username_idx").on(t.username), index("users_email_idx").on(t.email)],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectUserSchema = createSelectSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
