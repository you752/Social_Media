import { NotFoundException } from "../../common/exception/error.responce";
import { IComment } from "../../common/interfaces/comment.interface";
import { CommentRepository } from "./commentRepo";
import {
  CreateCommentInput,
  UpdateCommentInput,
} from "./comment.validation";
import { UserRepository } from "../user/userRepo";
import { publicImageUrl } from "../../common/utils/multer/multer";

export class CommentService {
  private readonly commentRepository: CommentRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.userRepository = new UserRepository();
  }

  private async withAuthors(comments: Array<IComment & { _id?: string }>) {
    const userIds = [...new Set(comments.map((comment) => comment.userId).filter(Boolean))];
    const users = await this.userRepository.findAll({
      filter: { _id: { $in: userIds } },
      select: "_id username firstName lastName profileImage",
      lean: true,
    });
    const usersById = new Map(users.map((user: any) => [String(user._id), user]));

    return comments.map((comment) => {
      const authorObj = usersById.get(String(comment.userId)) as any;
      return {
        ...comment,
        author: authorObj
          ? {
              ...authorObj,
              profileImage: publicImageUrl(authorObj.profileImage),
            }
          : { _id: comment.userId },
      };
    });
  }

  async createComment(data: CreateCommentInput, userId: string) {
    const created: any = await this.commentRepository.create({
      ...data,
      userId,
    });
    const plain = typeof created.toObject === "function" ? created.toObject() : created;
    return (await this.withAuthors([plain]))[0];
  }

  async getComments(postId: string) {
    const rawComments = await this.commentRepository.findAll({
      filter: { postId },
      lean: true,
    });

    const sorted = rawComments.sort((first: IComment, second: IComment) => {
      const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return firstDate - secondDate;
    });

    return this.withAuthors(sorted);
  }

  async updateComment(
    commentId: string,
    data: UpdateCommentInput,
    userId: string,
  ) {
    const comment = await this.commentRepository.findOneAndUpdate({
      filter: { _id: commentId, userId },
      data,
      lean: true,
    });

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    return (await this.withAuthors([comment]))[0];
  }

  async deleteComment(commentId: string, userId: string) {
    const result = await this.commentRepository.deleteOne({
      _id: commentId,
      userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException("Comment not found");
    }

    return { deleted: true };
  }
}
