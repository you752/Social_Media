import mongoose, { Schema } from "mongoose";
import { IBookmark } from "../../common/interfaces/bookmark.interface";

const bookmarkSchema = new Schema<IBookmark>(
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

bookmarkSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const bookmarkModel = mongoose.model<IBookmark>("Bookmark", bookmarkSchema);
