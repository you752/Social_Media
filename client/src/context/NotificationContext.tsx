import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as notificationApi from "@/api/notification.api";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { connectSocket, getSocket } from "@/services/socket";
import { FRIENDSHIP_CHANGED_EVENT } from "@/api/friend.api";
import { displayName } from "@/utils/getUser";
import type { AppNotification } from "@/types/notification";
import { NotificationContext } from "./notification-context";

function notificationMessage(notification: AppNotification) {
  const name = displayName(notification.sender);
  if (notification.type === "friend_request") return `${name} sent you a friend request`;
  if (notification.type === "friend_accepted") return `${name} accepted your friend request`;
  return `${name} sent you a message`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const notificationsRef = useRef<AppNotification[]>([]);

  const updateNotifications = useCallback((next: AppNotification[]) => {
    notificationsRef.current = next;
    setNotifications(next);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      notificationsRef.current = [];
      setNotifications([]);
      setUnreadCount(0);
      setFriendRequestCount(0);
      setUnreadMessageCount(0);
      return;
    }

    let active = true;
    const socket = getSocket() ?? connectSocket();
    const onNotification = (notification: AppNotification) => {
      const existing = notificationsRef.current.find((item) => item._id === notification._id);
      const next = [
        notification,
        ...notificationsRef.current.filter((item) => item._id !== notification._id),
      ].slice(0, 50);
      updateNotifications(next);

      if (!notification.isRead && !existing) {
        setUnreadCount((count) => count + 1);
        if (notification.type === "friend_request") {
          setFriendRequestCount((count) => count + 1);
        }
      } else if (notification.isRead && existing && !existing.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
        if (notification.type === "friend_request") {
          setFriendRequestCount((count) => Math.max(0, count - 1));
        }
      }
      if (!notification.isRead) {
        showToast(notificationMessage(notification), "info");
      }
      if (notification.type !== "message") {
        window.dispatchEvent(new Event(FRIENDSHIP_CHANGED_EVENT));
      }
    };

    socket.on("notification:new", onNotification);
    Promise.all([
      notificationApi.getNotifications(1, 50),
      notificationApi.getUnreadNotificationCount(),
    ])
      .then(([page, count]) => {
        if (!active) return;
        const liveNotifications = notificationsRef.current;
        const byId = new Map<string, AppNotification>();
        for (const item of page.notifications) byId.set(item._id, item);
        for (const item of liveNotifications) byId.set(item._id, item);
        const merged = [...byId.values()]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 50);
        updateNotifications(merged);
        setUnreadCount(count.count);
        setFriendRequestCount(
          merged.filter((item) => item.type === "friend_request" && !item.isRead).length,
        );
      })
      .catch((error) => {
        if (active) {
          showToast(getApiErrorMessage(error, "Could not load notifications"), "error");
        }
      });

    return () => {
      active = false;
      socket.off("notification:new", onNotification);
    };
  }, [isAuthenticated, showToast, updateNotifications]);

  const markRead = useCallback(async (id: string) => {
    try {
      const updated = await notificationApi.markNotificationRead(id);
      const previous = notificationsRef.current.find((item) => item._id === id);
      updateNotifications(
        notificationsRef.current.map((item) => (item._id === id ? updated : item)),
      );
      if (previous && !previous.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
        if (previous.type === "friend_request") {
          setFriendRequestCount((count) => Math.max(0, count - 1));
        }
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not mark notification as read"), "error");
      throw error;
    }
  }, [showToast, updateNotifications]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllNotificationsRead();
      updateNotifications(notificationsRef.current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      setFriendRequestCount(0);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not mark notifications as read"), "error");
      throw error;
    }
  }, [showToast, updateNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      const item = notificationsRef.current.find((notification) => notification._id === id);
      updateNotifications(notificationsRef.current.filter((notification) => notification._id !== id));
      if (item && !item.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
        if (item.type === "friend_request") {
          setFriendRequestCount((count) => Math.max(0, count - 1));
        }
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not delete notification"), "error");
      throw error;
    }
  }, [showToast, updateNotifications]);

  const bumpFriendRequestCount = useCallback((delta: number) => {
    setFriendRequestCount((count) => Math.max(0, count + delta));
  }, []);
  const resetUnreadMessages = useCallback(() => setUnreadMessageCount(0), []);
  const incrementUnreadMessages = useCallback(() => setUnreadMessageCount((count) => count + 1), []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      friendRequestCount,
      unreadMessageCount,
      markRead,
      markAllRead,
      deleteNotification,
      bumpFriendRequestCount,
      resetUnreadMessages,
      incrementUnreadMessages,
    }),
    [
      notifications,
      unreadCount,
      friendRequestCount,
      unreadMessageCount,
      markRead,
      markAllRead,
      deleteNotification,
      bumpFriendRequestCount,
      resetUnreadMessages,
      incrementUnreadMessages,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
