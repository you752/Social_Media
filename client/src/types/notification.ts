import type { User } from "./user";

export type NotificationType = "friend_request" | "friend_accepted" | "message";

export interface AppNotification {
  _id: string;
  recipient: string;
  sender: User;
  type: NotificationType;
  reference?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
}
