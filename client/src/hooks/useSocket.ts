import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/services/socket";

// Subscribe to a socket event for the lifetime of the calling component,
// automatically cleaning up the listener on unmount so we never leak or
// duplicate handlers.
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  useEffect(() => {
    const socket: Socket | null = getSocket();
    if (!socket) return;
    socket.on(event, handler as (...args: unknown[]) => void);
    return () => {
      socket.off(event, handler as (...args: unknown[]) => void);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, handler]);
}
