import { Types } from "mongoose";

export interface IChatMessage {
  _id?: Types.ObjectId | string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  sender?: IChatUser;
  recipient?: IChatUser;
}

export interface IChatUser {
  _id: Types.ObjectId | string;
  username?: string;
  firstName?: string;
  lastName?: string;
  unique_name?: string;
  profileImage?: string;
}
