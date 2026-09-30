
import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { UpdateProfilePayload, User, UserProfile } from "@/types/user";

export interface UserSettings {
  notifications: boolean;
  privateAccount: boolean;
}

export async function getProfile() {
  const res = await api.get("/user/profile");
  return unwrap<User>(res.data);
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const formData = new FormData();

  if (payload.username !== undefined) formData.append("username", payload.username);
  if (payload.age !== undefined) formData.append("age", String(payload.age));
  if (payload.phoneNumber !== undefined) formData.append("phoneNumber", payload.phoneNumber);
  if (payload.gender !== undefined) formData.append("gender", payload.gender);
  if (payload.bio !== undefined) formData.append("bio", payload.bio);
  if (payload.profileImage) formData.append("profileImage", payload.profileImage);

  const res = await api.put("/user/UpDateUserProfile", formData);

  return unwrap<User>(res.data);
}

export async function getUsers(options: { discoverableOnly?: boolean } = {}) {
  const res = await api.get("/user/", {
    params: options.discoverableOnly ? { discoverable: true } : undefined,
  });
  return unwrap<User[]>(res.data);
}

export async function getSuggestions(limit = 10) {
  const res = await api.get("/user/suggestions", { params: { limit } });
  return unwrap<User[]>(res.data);
}

export async function getUserProfile(userId: string) {
  const res = await api.get(`/user/profile/${userId}`);
  return unwrap<UserProfile>(res.data);
}

export async function getUserProfileByUsername(username: string) {
  const res = await api.get(`/user/profile/username/${encodeURIComponent(username)}`);
  return unwrap<UserProfile>(res.data);
}

export async function getUserSettings() {
  const res = await api.get("/user/settings");
  return unwrap<UserSettings>(res.data);
}

export async function updateUserSettings(payload: Partial<UserSettings>) {
  const res = await api.patch("/user/settings", payload);
  return unwrap<UserSettings>(res.data);
}
