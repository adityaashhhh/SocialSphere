import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyAccessToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

const onlineUsers = new Map<string, string>(); // userId -> socketId

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env["CLIENT_URL"] ?? "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket.io",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as AuthSocket).userId = payload.userId;
      (socket as AuthSocket).username = payload.username;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthSocket;
    const userId = authSocket.userId;
    logger.info({ userId }, "Socket connected");

    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    io.emit("userOnline", { userId });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      logger.info({ userId }, "Socket disconnected");
      io.emit("userOffline", { userId });
    });

    socket.on("joinPost", (postId: string) => {
      socket.join(`post:${postId}`);
    });

    socket.on("leavePost", (postId: string) => {
      socket.leave(`post:${postId}`);
    });

    socket.on("joinConversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("leaveConversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });
  });

  return io;
}

export interface AuthSocket extends Socket {
  userId: string;
  username: string;
}

export function emitToUser(
  io: SocketIOServer,
  userId: string,
  event: string,
  data: unknown,
): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToPost(
  io: SocketIOServer,
  postId: string,
  event: string,
  data: unknown,
): void {
  io.to(`post:${postId}`).emit(event, data);
}

export function emitToConversation(
  io: SocketIOServer,
  conversationId: string,
  event: string,
  data: unknown,
): void {
  io.to(`conv:${conversationId}`).emit(event, data);
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
