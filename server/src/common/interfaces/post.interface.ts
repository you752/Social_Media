export interface IPost {
  userId: string;
  title: string;
  content: string;
  image?: string;
  comments: string[];
  likes: string[];
  tags: string[];
  taggedUsers?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
