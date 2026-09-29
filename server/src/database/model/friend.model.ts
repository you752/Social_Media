import mongoose, { Schema } from "mongoose";
import { IFriend } from "../../common/interfaces/friend.interface";
import { FriendStatus } from "../../common/enum/friend.enum";


const friendSchema = new Schema<IFriend>(
  {
    userId: {
        type: String,
        required: true,
    },
    friendId: {
        type: String,
        required: true,
    },
    relationshipKey: {
        type: String,
        select: false,
    },
    status: {
        type: String,
        default: FriendStatus.PENDING,
    },
  },
  { timestamps: true }
);

friendSchema.index({ relationshipKey: 1 }, { unique: true, sparse: true });

export const friendModel = mongoose.model<IFriend>("Friend", friendSchema);


