import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { Message } from "@/types/chat";

export async function getConversation(userId: string) {
  const res = await api.get(`/chat/${userId}`);
  return unwrap<Message[]>(res.data);
}

export async function sendMessage(payload: { receiverId?: string; recipientId?: string; content: string }) {
  const recipientId = payload.recipientId || payload.receiverId;
  const res = await api.post("/chat/message", { recipientId, content: payload.content });
  return unwrap<Message>(res.data);
}

export async function markConversationRead(userId: string) {
  const res = await api.patch(`/chat/${userId}/read`);
  return unwrap(res.data);
}
