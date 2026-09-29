import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { AppNotification, NotificationPage } from "@/types/notification";

export async function getNotifications(page = 1, limit = 20) {
  const response = await api.get("/notifications", { params: { page, limit } });
  return unwrap<NotificationPage>(response.data);
}

export async function getUnreadNotificationCount() {
  const response = await api.get("/notifications/unread-count");
  return unwrap<{ count: number }>(response.data);
}

export async function markNotificationRead(id: string) {
  const response = await api.patch(`/notifications/${id}/read`);
  return unwrap<AppNotification>(response.data);
}

export async function markAllNotificationsRead() {
  const response = await api.patch("/notifications/read-all");
  return unwrap(response.data);
}

export async function deleteNotification(id: string) {
  const response = await api.delete(`/notifications/${id}`);
  return unwrap<AppNotification>(response.data);
}
