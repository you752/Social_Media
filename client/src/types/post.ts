import type { User } from "./user";

export interface Comment {
  _id: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  author?: User | string;
  postId?: string;
  [key: string]: unknown;
}

export interface Post {
  _id: string;
  content: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: User | string;
  comments?: Comment[];
  commentsCount?: number;
  [key: string]: unknown;
}

export interface CreatePostPayload {
  content: string;
  image?: File | null;
}

export interface UpdatePostPayload {
  content?: string;
  image?: File | null;
  removeImage?: boolean;
}
