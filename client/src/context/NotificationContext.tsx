import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSocket } from "@/services/socket";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { NotificationContext, type AppNotification } from "./notification-context";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => [
      { ...n, id: crypto.randomUUID(), read: false, createdAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const onFriendRequest = () => {
      setFriendRequestCount((c) => c + 1);
      pushNotification({ type: "friend:request", message: "You have a new friend request" });
      showToast("New friend request", "info");
    };
    const onFriendAccepted = () => {
      pushNotification({ type: "friend:accepted", message: "A friend request was accepted" });
      showToast("Friend request accepted", "success");
    };
    const onFriendRejected = () => {
      pushNotification({ type: "friend:rejected", message: "A friend request was declined" });
    };

    socket.on("friend:request", onFriendRequest);
    socket.on("friend:accepted", onFriendAccepted);
    socket.on("friend:rejected", onFriendRejected);

    return () => {
      socket.off("friend:request", onFriendRequest);
      socket.off("friend:accepted", onFriendAccepted);
      socket.off("friend:rejected", onFriendRejected);
    };
  }, [isAuthenticated, pushNotification, showToast]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const bumpFriendRequestCount = useCallback((delta: number) => {
    setFriendRequestCount((c) => Math.max(0, c + delta));
  }, []);

  const resetUnreadMessages = useCallback(() => setUnreadMessageCount(0), []);
  const incrementUnreadMessages = useCallback(() => setUnreadMessageCount((c) => c + 1), []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      friendRequestCount,
      unreadMessageCount,
      markAllRead,
      bumpFriendRequestCount,
      resetUnreadMessages,
      incrementUnreadMessages,
    }),
    [notifications, unreadCount, friendRequestCount, unreadMessageCount, markAllRead, bumpFriendRequestCount, resetUnreadMessages, incrementUnreadMessages]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
