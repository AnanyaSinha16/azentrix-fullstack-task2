import { AsyncLocalStorage } from "async_hooks";
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { verifyToken } from "./src/lib/auth";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port, dir: process.cwd() });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      credentials: true,
    },
  });

  global.io = io;

  io.use(async (socket, nextFn) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.cookie
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("taskflow_token="))
        ?.split("=")[1];

    if (!token) {
      return nextFn(new Error("Unauthorized"));
    }

    const user = await verifyToken(token);
    if (!user) {
      return nextFn(new Error("Unauthorized"));
    }

    socket.data.user = user;
    nextFn();
  });

  io.on("connection", (socket) => {
    socket.on("join-board", (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on("leave-board", (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
