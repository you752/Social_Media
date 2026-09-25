import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { Comment } from "@/types/post";
import type { CreateCommentPayload, UpdateCommentPayload } from "@/types/comment";

export async function createComment(payload: CreateCommentPayload) {
  const res = await api.post("/comment/", payload);
  return unwrap<Comment>(res.data);
}

export async function getCommentsForPost(postId: string) {
  const res = await api.get(`/comment/post/${postId}`);
  return unwrap<Comment[]>(res.data);
}

export async function updateComment(commentId: string, payload: UpdateCommentPayload) {
  const res = await api.patch(`/comment/${commentId}`, payload);
  return unwrap<Comment>(res.data);
}

export async function deleteComment(commentId: string) {
  const res = await api.delete(`/comment/${commentId}`);
  return unwrap(res.data);
}
