import { createServer } from "http";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initSocketIO } from "./socket/socketHandler.js";

const rawPort = process.env["PORT"] || "8080";
const port = Number(rawPort);

const httpServer = createServer(app);
const io = initSocketIO(httpServer);

export { io };

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});

httpServer.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
