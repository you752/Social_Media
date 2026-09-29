import { Schema, Types, model } from "mongoose";

export type NotificationType = "friend_request" | "friend_accepted" | "message";

export interface INotification {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: NotificationType;
  reference?: Types.ObjectId;
  isRead: boolean;
  createdAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["friend_request", "friend_accepted", "message"],
      required: true,
    },
    reference: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index(
  { recipient: 1, sender: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "message", isRead: false },
  },
);

export const notificationModel = model<INotification>(
  "Notification",
  notificationSchema,
);
