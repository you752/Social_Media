export interface ILike {
  postId: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommentLike {
  commentId: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
