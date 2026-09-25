import mongoose, { Schema } from "mongoose";
import { IShare } from "../../common/interfaces/share.interface";

const shareSchema = new Schema<IShare>(
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

shareSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const shareModel = mongoose.model<IShare>("Share", shareSchema);
