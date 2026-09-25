export interface IChatMessage {
  senderId: string;
  recipientId: string;
  content: string;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
