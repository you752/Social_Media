import mongoose, { Schema } from "mongoose";
import { IChatMessage } from "../../common/interfaces/chat.interface";

const chatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    readAt: { type: Date },
  },
  { timestamps: true },
);

chatMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
chatMessageSchema.index({ recipientId: 1, senderId: 1, createdAt: -1 });

export const chatMessageModel = mongoose.model<IChatMessage>(
  "ChatMessage",
  chatMessageSchema,
);
