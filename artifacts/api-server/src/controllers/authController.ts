import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateTokens, verifyRefreshToken } from "../lib/jwt.js";
import { generateId } from "../lib/id.js";

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password, displayName } = req.body as {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  };

  if (!username || !email || !password) {
    res.status(400).json({ error: "Bad Request", message: "username, email and password are required" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "Bad Request", message: "Email already in use" });
    return;
  }

  const existingUsername = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existingUsername.length > 0) {
    res.status(400).json({ error: "Bad Request", message: "Username already taken" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = generateId();

  const [user] = await db
    .insert(usersTable)
    .values({
      id,
      username,
      email,
      password: hashed,
      displayName: displayName ?? username,
    })
    .returning();

  const tokens = generateTokens({ userId: user.id, username: user.username, role: user.role });

  res.status(201).json({
    user: formatUser(user, false),
    ...tokens,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, username, password } = req.body as { email?: string; username?: string; password: string };
  const identifier = email ?? username;

  if (!identifier || !password) {
    res.status(400).json({ error: "Bad Request", message: "username or email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(email ? eq(usersTable.email, email) : eq(usersTable.username, username!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const tokens = generateTokens({ userId: user.id, username: user.username, role: user.role });

  res.json({
    user: formatUser(user, false),
    ...tokens,
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ message: "Logged out successfully" });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const authReq = req as import("../middlewares/auth.js").AuthRequest;
  if (!authReq.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, authReq.user.userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  res.json(formatUser(user, false));
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken: string };

  if (!token) {
    res.status(400).json({ error: "Bad Request", message: "refreshToken is required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const tokens = generateTokens(payload);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired refresh token" });
  }
}

export function formatUser(
  user: import("@workspace/db").User,
  isFollowing: boolean,
  followersCount = 0,
  followingCount = 0,
  postsCount = 0,
) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio ?? null,
    profilePicture: user.profilePicture ?? null,
    coverPhoto: user.coverPhoto ?? null,
    followersCount,
    followingCount,
    postsCount,
    isFollowing,
    isVerified: user.isVerified,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
