import mongoose, { Schema } from "mongoose";
import { ISettings } from "../../common/interfaces/settings.interface";

const settingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    privateAccount: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const settingsModel = mongoose.model<ISettings>("Settings", settingsSchema);
