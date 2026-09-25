import mongoose, { Schema } from "mongoose";
import { ILike, ICommentLike } from "../../common/interfaces/like.interface";

const likeSchema = new Schema<ILike>(
  {
    postId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const likeModel = mongoose.model<ILike>("Like", likeSchema);

const commentLikeSchema = new Schema<ICommentLike>(
  {
    commentId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

commentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export const commentLikeModel = mongoose.model<ICommentLike>("CommentLike", commentLikeSchema);
