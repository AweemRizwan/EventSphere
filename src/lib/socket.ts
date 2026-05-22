import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}

export function joinEventRoom(eventId: string): void {
  getSocket().emit("event:join", { eventId });
}

export function leaveEventRoom(eventId: string): void {
  getSocket().emit("event:leave", { eventId });
}
