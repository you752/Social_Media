import { Types } from "mongoose";

export interface IChatMessage {
  _id?: Types.ObjectId | string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
