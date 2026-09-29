import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/utils/storage";

// Single shared socket instance for the whole app so we never open more
// than one connection per logged-in user.
let socket: Socket | null = null;

export function connectSocket(): Socket {
  const token = tokenStorage.get();
  if (socket) {
    socket.auth = { token };
    if (!socket.connected && !socket.active) socket.connect();
    return socket;
  }

  const baseUrl = (import.meta.env.VITE_SOCKET_URL || "http://localhost:8000").replace(/\/+$/, "");
  const socketUrl = `${baseUrl}/user`;

  socket = io(socketUrl, {
    auth: { token },
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on("connect_error", (error) => {
    console.error("Realtime connection failed", error.message);
  });
  socket.on("disconnect", (reason) => {
    if (reason !== "io client disconnect") {
      console.warn("Realtime connection disconnected", reason);
    }
  });
  socket.connect();

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function refreshSocketAuthentication() {
  const token = tokenStorage.get();
  if (!socket) {
    connectSocket();
    return;
  }

  socket.auth = { token };
  if (socket.connected) socket.disconnect();
  socket.connect();
}

export function disconnectSocket() {
  if (socket) {
    const activeSocket = socket;
    socket = null;
    activeSocket.removeAllListeners();
    activeSocket.disconnect();
  }
}
