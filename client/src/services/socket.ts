import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/utils/storage";

// Single shared socket instance for the whole app so we never open more
// than one connection per logged-in user.
let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket && socket.connected) return socket;

  const token = tokenStorage.get();

  const baseUrl = (import.meta.env.VITE_SOCKET_URL || "http://localhost:8000").replace(/\/+$/, "");
  const socketUrl = `${baseUrl}/user`;

  socket = io(socketUrl, {
    auth: { token },
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
