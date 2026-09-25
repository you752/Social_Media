export interface CreateCommentPayload {
  postId: string;
  content: string;
}

export interface UpdateCommentPayload {
  content: string;
}
