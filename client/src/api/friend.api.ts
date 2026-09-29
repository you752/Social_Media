import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { FriendRequest } from "@/types/friend";
import type { User } from "@/types/user";

export const FRIENDSHIP_CHANGED_EVENT = "wave:friendship-changed";

function notifyFriendshipChanged() {
  window.dispatchEvent(new Event(FRIENDSHIP_CHANGED_EVENT));
}

export async function sendFriendRequest(friendId: string) {
  const res = await api.post("/friend/sendFriendRequest", { friendId });
  const result = unwrap(res.data);
  notifyFriendshipChanged();
  return result;
}

export async function acceptFriendRequest(requestId: string) {
  // ASSUMPTION: backend validation expects the request/user id under this
  // key. Adjust here if the real schema uses a different field name.
  const res = await api.post("/friend/acceptFriendRequest", { requestId });
  const result = unwrap(res.data);
  notifyFriendshipChanged();
  return result;
}

export async function rejectFriendRequest(requestId: string) {
  const res = await api.post("/friend/rejectFriendRequest", { requestId });
  const result = unwrap(res.data);
  notifyFriendshipChanged();
  return result;
}

export async function getFriends() {
  const res = await api.get("/friend/getFriends");
  return unwrap<User[]>(res.data);
}

export async function getFriendRequests() {
  const res = await api.get("/friend/getFriendRequests");
  return unwrap<FriendRequest[]>(res.data);
}

export async function blockUser(userId: string) {
  const res = await api.post("/friend/blockUser", { userId });
  const result = unwrap(res.data);
  notifyFriendshipChanged();
  return result;
}
