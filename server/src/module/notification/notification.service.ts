import { Types, type QueryFilter, type UpdateQuery } from "mongoose";
import {
  notificationModel,
  type INotification,
  type NotificationType,
} from "../../database/model/notification.model";

interface CreateNotificationInput {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  reference?: string;
}

type NotificationEmitter = (
  userId: string,
  event: string,
  payload: unknown,
) => void;

const senderProjection = "_id username firstName lastName unique_name profileImage";

export async function createNotification(
  input: CreateNotificationInput,
  emitToUser: NotificationEmitter,
) {
  let notificationId: Types.ObjectId;

  if (input.type === "message") {
    const unreadMessageFilter: QueryFilter<INotification> = {
      recipient: input.recipientId,
      sender: input.senderId,
      type: "message",
      isRead: false,
    };
    const messageFields = {
      ...(input.reference ? { reference: input.reference } : {}),
    };
    const messageUpdate: UpdateQuery<INotification> = {
      $set: messageFields,
      $setOnInsert: {
        recipient: input.recipientId,
        sender: input.senderId,
        type: input.type,
        isRead: false,
      },
    };
    try {
      const merged = await notificationModel.findOneAndUpdate(
        unreadMessageFilter,
        messageUpdate,
        { returnDocument: "after", upsert: true, includeResultMetadata: false },
      );
      if (!merged) throw new Error("Could not create message notification");
      notificationId = merged._id;
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("code" in error) ||
        error.code !== 11000
      ) {
        throw error;
      }
      const existing = await notificationModel.findOne(unreadMessageFilter);
      if (!existing) throw error;
      existing.set(messageFields);
      await existing.save();
      notificationId = existing._id;
    }
  } else {
    const created = await notificationModel.create({
      recipient: input.recipientId,
      sender: input.senderId,
      type: input.type,
      ...(input.reference ? { reference: input.reference } : {}),
    });
    notificationId = created._id;
  }

  const populated = await notificationModel
    .findById(notificationId)
    .populate("sender", senderProjection)
    .lean();
  if (!populated) throw new Error("Could not load created notification");

  emitToUser(input.recipientId, "notification:new", populated);
  return populated;
}

export async function listNotifications(
  recipientId: string,
  page: number,
  limit: number,
) {
  const filter = { recipient: recipientId };
  const [notifications, total] = await Promise.all([
    notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", senderProjection)
      .lean(),
    notificationModel.countDocuments(filter),
  ]);
  return { notifications, total, page, limit };
}

export function getUnreadNotificationCount(recipientId: string) {
  return notificationModel.countDocuments({ recipient: recipientId, isRead: false });
}

export function markNotificationRead(recipientId: string, notificationId: string) {
  return notificationModel.findOneAndUpdate(
    { _id: notificationId, recipient: recipientId },
    { $set: { isRead: true } },
    { new: true },
  ).populate("sender", senderProjection).lean();
}

export function markAllNotificationsRead(recipientId: string) {
  return notificationModel.updateMany(
    { recipient: recipientId, isRead: false },
    { $set: { isRead: true } },
  );
}

export function deleteNotification(recipientId: string, notificationId: string) {
  return notificationModel.findOneAndDelete({
    _id: notificationId,
    recipient: recipientId,
  });
}
