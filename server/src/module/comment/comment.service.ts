import { NotFoundException } from "../../common/exception/error.responce";
import { IComment } from "../../common/interfaces/comment.interface";
import { CommentRepository } from "./commentRepo";
import {
  CreateCommentInput,
  UpdateCommentInput,
} from "./comment.validation";
import { UserRepository } from "../user/userRepo";
import { publicImageUrl } from "../../common/utils/multer/multer";
import { commentLikeModel } from "../../database/model/like.model";
import { commentModel } from "../../database/model/comment.model";

export class CommentService {
  private readonly commentRepository: CommentRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.userRepository = new UserRepository();
  }

  private async withCommentRelations(comments: Array<any>, currentUserId: string) {
    if (!comments.length) return comments;

    const commentIds = comments.map(c => String(c._id)).filter(Boolean);

    // Likes count and status
    const likeCounts = await commentLikeModel.aggregate([
      { $match: { commentId: { $in: commentIds } } },
      { $group: { _id: "$commentId", count: { $sum: 1 } } }
    ]);
    const likesById = new Map(likeCounts.map((item: any) => [String(item._id), item.count]));

    const userLikes = await commentLikeModel.find({ commentId: { $in: commentIds }, userId: currentUserId }).lean();
    const userLikesSet = new Set(userLikes.map(l => String(l.commentId)));

    // Replies count
    const repliesCounts = await commentModel.aggregate([
      { $match: { parentCommentId: { $in: commentIds } } },
      { $group: { _id: "$parentCommentId", count: { $sum: 1 } } }
    ]);
    const repliesById = new Map(repliesCounts.map((item: any) => [String(item._id), item.count]));

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
        likesCount: likesById.get(String(comment._id)) ?? 0,
        liked: userLikesSet.has(String(comment._id)),
        repliesCount: repliesById.get(String(comment._id)) ?? 0,
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
    return (await this.withCommentRelations([plain], userId))[0];
  }

  async createReply(commentId: string, content: string, userId: string) {
    const parentComment = await this.commentRepository.findOne({ filter: { _id: commentId } });
    if (!parentComment) throw new NotFoundException("Parent comment not found");

    const created: any = await this.commentRepository.create({
      postId: parentComment.postId,
      parentCommentId: commentId,
      content,
      userId,
    });
    const plain = typeof created.toObject === "function" ? created.toObject() : created;
    return (await this.withCommentRelations([plain], userId))[0];
  }

  async getComments(postId: string, currentUserId: string) {
    const rawComments = await this.commentRepository.findAll({
      filter: { postId, parentCommentId: { $exists: false } },
      lean: true,
    });

    const sorted = rawComments.sort((first: any, second: any) => {
      const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return firstDate - secondDate;
    });

    return this.withCommentRelations(sorted, currentUserId);
  }

  async getReplies(commentId: string, currentUserId: string) {
    const rawReplies = await this.commentRepository.findAll({
      filter: { parentCommentId: commentId },
      lean: true,
    });

    const sorted = rawReplies.sort((first: any, second: any) => {
      const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return firstDate - secondDate;
    });

    return this.withCommentRelations(sorted, currentUserId);
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

    return (await this.withCommentRelations([comment], userId))[0];
  }

  async deleteComment(commentId: string, userId: string) {
    const result = await this.commentRepository.deleteOne({
      _id: commentId,
      userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException("Comment not found");
    }
    
    await commentModel.deleteMany({ parentCommentId: commentId });
    await commentLikeModel.deleteMany({ commentId });

    return { deleted: true };
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({ filter: { _id: commentId } });
    if (!comment) throw new NotFoundException("Comment not found");

    await commentLikeModel.updateOne(
      { commentId, userId },
      { $setOnInsert: { commentId, userId } },
      { upsert: true }
    );

    const likesCount = await commentLikeModel.countDocuments({ commentId });
    return { liked: true, likesCount };
  }

  async unlikeComment(commentId: string, userId: string) {
    await commentLikeModel.deleteOne({ commentId, userId });
    const likesCount = await commentLikeModel.countDocuments({ commentId });
    return { liked: false, likesCount };
  }
}
