
import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { UpdateProfilePayload, User } from "@/types/user";

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
  if (payload.profileImage) formData.append("profileImage", payload.profileImage);

  const res = await api.put("/user/UpDateUserProfile", formData);

  return unwrap<User>(res.data);
}

export async function getUsers() {
  const res = await api.get("/user/");
  return unwrap<User[]>(res.data);
}

