import type { User } from "./user";

export interface FriendRequest {
  _id: string;
  sender?: User | string;
  receiver?: User | string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}
