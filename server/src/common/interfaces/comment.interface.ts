export interface IComment {
  postId: string;
  userId: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}
