import { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | null {
  return global.io ?? null;
}

export function emitBoardEvent(
  boardId: string,
  event: string,
  payload: unknown
) {
  const io = getIO();
  if (io) {
    io.to(`board:${boardId}`).emit(event, payload);
  }
}
