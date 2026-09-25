import { api } from "./axios";
import { unwrap } from "@/types/api";

export interface AdminPage<T> {
  [key: string]: unknown;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getDashboard() {
  return unwrap<{
    stats: Record<string, number>;
    recentUsers: Array<Record<string, unknown>>;
    recentPosts: Array<Record<string, unknown>>;
    recentComments: Array<Record<string, unknown>>;
  }>((await api.get("/admin/dashboard")).data);
}

export async function getUsers(params: Record<string, string | number | boolean>) {
  return unwrap<AdminPage<{ _id: string; username?: string; email?: string; role?: number; isBlocked?: boolean; confirmEmail?: boolean }[]>>(
    (await api.get("/admin/users", { params })).data,
  );
}

export async function getPosts(params: Record<string, string | number>) {
  return unwrap<AdminPage<Array<Record<string, unknown>>> & { posts: Array<Record<string, unknown>> }>(
    (await api.get("/admin/posts", { params })).data,
  );
}

export async function getComments(params: Record<string, string | number>) {
  return unwrap<AdminPage<Array<Record<string, unknown>>> & { comments: Array<Record<string, unknown>> }>(
    (await api.get("/admin/comments", { params })).data,
  );
}

export async function setUserBlocked(id: string, blocked: boolean) {
  return api.patch(`/admin/users/${id}/${blocked ? "block" : "unblock"}`);
}

export async function deletePost(id: string) {
  return api.delete(`/admin/posts/${id}`);
}

export async function deleteComment(id: string) {
  return api.delete(`/admin/comments/${id}`);
}
