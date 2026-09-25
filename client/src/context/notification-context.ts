import { createContext } from "react";

export interface AppNotification {
  id: string;
  type: "friend:request" | "friend:accepted" | "friend:rejected" | "message" | "comment";
  message: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  friendRequestCount: number;
  unreadMessageCount: number;
  markAllRead: () => void;
  bumpFriendRequestCount: (delta: number) => void;
  resetUnreadMessages: () => void;
  incrementUnreadMessages: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
