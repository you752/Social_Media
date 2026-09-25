import mongoose, { Schema } from "mongoose";
import { IComment } from "../../common/interfaces/comment.interface";

const commentSchema = new Schema<IComment>(
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
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1, createdAt: -1 });

export const commentModel = mongoose.model<IComment>("Comment", commentSchema);
