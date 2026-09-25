import mongoose, { Schema } from "mongoose";
import { IPost } from "../../common/interfaces/post.interface";

const postSchema = new Schema<IPost>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    image: {
      type: String,
    },
    taggedUsers: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

postSchema.index({ createdAt: -1 });

export const postModel = mongoose.model<IPost>("Post", postSchema);
