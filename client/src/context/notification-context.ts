import { createContext } from "react";
import type { AppNotification } from "@/types/notification";

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  friendRequestCount: number;
  unreadMessageCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  bumpFriendRequestCount: (delta: number) => void;
  resetUnreadMessages: () => void;
  incrementUnreadMessages: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
