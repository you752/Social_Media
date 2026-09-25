import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { CreatePostPayload, Post, UpdatePostPayload } from "@/types/post";

export async function getPosts() {
  const res = await api.get("/post/");
  return unwrap<Post[]>(res.data);
}

export async function getMyPosts() {
  const res = await api.get("/post/mine");
  return unwrap<Post[]>(res.data);
}

export async function createPost(payload: CreatePostPayload) {
  const formData = new FormData();
  formData.append("content", payload.content);
  if (payload.image) formData.append("image", payload.image);
  if (payload.taggedUsers?.length) formData.append("taggedUsers", JSON.stringify(payload.taggedUsers));
  const res = await api.post("/post/", formData);
  return unwrap<Post>(res.data);
}

export async function updatePost(postId: string, payload: UpdatePostPayload) {
  const formData = new FormData();
  if (payload.content !== undefined) formData.append("content", payload.content);
  if (payload.image) formData.append("image", payload.image);
  if (payload.removeImage) formData.append("removeImage", "true");
  if (payload.taggedUsers) formData.append("taggedUsers", JSON.stringify(payload.taggedUsers));
  const res = await api.patch(`/post/${postId}`, formData);
  return unwrap<Post>(res.data);
}

export async function deletePost(postId: string) {
  const res = await api.delete(`/post/${postId}`);
  return unwrap(res.data);
}

export async function likePost(postId: string) {
  const res = await api.post(`/post/${postId}/like`);
  return unwrap(res.data);
}

export async function unlikePost(postId: string) {
  const res = await api.delete(`/post/${postId}/like`);
  return unwrap(res.data);
}

export async function sharePost(postId: string) {
  const res = await api.post(`/post/${postId}/share`);
  return unwrap(res.data);
}

export async function bookmarkPost(postId: string) {
  const res = await api.post(`/post/${postId}/bookmark`);
  return unwrap(res.data);
}

export async function removeBookmark(postId: string) {
  const res = await api.delete(`/post/${postId}/bookmark`);
  return unwrap(res.data);
}

export async function getBookmarks() {
  const res = await api.get("/post/bookmarks");
  return unwrap<Post[]>(res.data);
}
