import type { User } from "./user";

export interface Message {
  _id: string;
  senderId: string;
  receiverId?: string;
  recipientId?: string;
  content: string;
  createdAt?: string;
  read?: boolean;
  readAt?: string;
  sender?: User;
  [key: string]: unknown;
}

export interface Conversation {
  userId: string;
  user?: User;
  lastMessage?: Message;
  unreadCount?: number;
}
