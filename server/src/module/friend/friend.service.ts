import { FriendRepository } from "./friendRepo";
import { IFriend } from "../../common/interfaces/friend.interface";
import { FriendStatus } from "../../common/enum/friend.enum";
import { Types } from "mongoose";
import { UserRepository } from "../user/userRepo";
import { publicImageUrl } from "../../common/utils/multer/multer";

export class friendservice {
  private FriendRepository: FriendRepository;
  private userRepository: UserRepository;

  constructor() {
    this.FriendRepository = new FriendRepository();
    this.userRepository = new UserRepository();
  }

  async sendFriendRequest(data: { userId: string; friendId: string }) {
    if (data.userId === data.friendId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const existing = await this.FriendRepository.findOne({
      filter: {
        $or: [
          { userId: data.userId, friendId: data.friendId },
          { userId: data.friendId, friendId: data.userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendStatus.ACCEPTED) {
        throw new Error("You are already friends with this user");
      }
      if (existing.status === FriendStatus.PENDING) {
        throw new Error("A pending friend request already exists");
      }
      return this.FriendRepository.updateOne({
        filter: { _id: existing._id },
        data: { userId: data.userId, friendId: data.friendId, status: FriendStatus.PENDING },
      });
    }

    return this.FriendRepository.create({
      userId: data.userId,
      friendId: data.friendId,
      status: FriendStatus.PENDING,
    });
  }

  async acceptFriendRequest(data: { userId: string; friendId?: string; requestId?: string }) {
    let existing;
    if (data.requestId && Types.ObjectId.isValid(data.requestId)) {
      existing = await this.FriendRepository.findOne({
        filter: { _id: data.requestId, status: FriendStatus.PENDING },
      });
    }

    if (!existing && data.friendId) {
      existing = await this.FriendRepository.findOne({
        filter: {
          $or: [
            { userId: data.friendId, friendId: data.userId, status: FriendStatus.PENDING },
            { userId: data.userId, friendId: data.friendId, status: FriendStatus.PENDING },
          ],
        },
      });
    }

    if (!existing) {
      throw new Error("No pending friend request found");
    }

    return this.FriendRepository.updateOne({
      filter: { _id: existing._id },
      data: { status: FriendStatus.ACCEPTED },
    });
  }

  async rejectFriendRequest(data: { userId: string; friendId?: string; requestId?: string }) {
    let existing;
    if (data.requestId && Types.ObjectId.isValid(data.requestId)) {
      existing = await this.FriendRepository.findOne({
        filter: { _id: data.requestId, status: FriendStatus.PENDING },
      });
    }

    if (!existing && data.friendId) {
      existing = await this.FriendRepository.findOne({
        filter: {
          $or: [
            { userId: data.friendId, friendId: data.userId, status: FriendStatus.PENDING },
            { userId: data.userId, friendId: data.friendId, status: FriendStatus.PENDING },
          ],
        },
      });
    }

    if (!existing) {
      throw new Error("No pending friend request found");
    }

    return this.FriendRepository.updateOne({
      filter: { _id: existing._id },
      data: { status: FriendStatus.REJECTED },
    });
  }

  async getFriends(userId: string) {
    const friendDocs = await this.FriendRepository.findAll({
      filter: {
        $or: [
          { userId, status: FriendStatus.ACCEPTED },
          { friendId: userId, status: FriendStatus.ACCEPTED },
        ],
      },
      lean: true,
    });

    const otherUserIds = friendDocs.map((doc: any) =>
      doc.userId === userId ? doc.friendId : doc.userId
    ).filter(Boolean);

    if (otherUserIds.length === 0) return [];

    const users = await this.userRepository.findAll({
      filter: { _id: { $in: otherUserIds } },
      select: "_id username firstName lastName email unique_name profileImage",
      lean: true,
    });

    return users.map((user: any) => ({
      ...user,
      profileImage: publicImageUrl(user.profileImage),
    }));
  }

  async friendList(userId: string | Types.ObjectId) {
    const friends = await this.FriendRepository.findAll({
      filter: {
        $or: [
          { userId, status: FriendStatus.ACCEPTED },
          { friendId: userId, status: FriendStatus.ACCEPTED },
        ],
      },
      lean: true,
    });

    return friends;
  }

  async getFriendRequests(userId: string) {
    const requests = await this.FriendRepository.findAll({
      filter: {
        friendId: userId,
        status: FriendStatus.PENDING,
      },
      lean: true,
    });

    if (requests.length === 0) return [];

    const senderIds = requests.map((req: any) => req.userId).filter(Boolean);
    const senders = await this.userRepository.findAll({
      filter: { _id: { $in: senderIds } },
      select: "_id username firstName lastName email unique_name profileImage",
      lean: true,
    });

    const sendersById = new Map(senders.map((s: any) => [String(s._id), s]));

    return requests.map((req: any) => {
      const senderObj = sendersById.get(String(req.userId)) as any;
      return {
        ...req,
        sender: senderObj
          ? {
              ...senderObj,
              profileImage: publicImageUrl(senderObj.profileImage),
            }
          : { _id: req.userId },
      };
    });
  }

  async blockUser(data: { userId: string; friendId: string }) {
    const existing = await this.FriendRepository.findOne({
      filter: {
        $or: [
          { userId: data.userId, friendId: data.friendId },
          { userId: data.friendId, friendId: data.userId },
        ],
      },
    });

    if (existing) {
      await this.FriendRepository.updateOne({
        filter: { _id: existing._id },
        data: { status: FriendStatus.BLOCKED },
      });
    } else {
      await this.FriendRepository.create({
        userId: data.userId,
        friendId: data.friendId,
        status: FriendStatus.BLOCKED,
      });
    }

    return { blocked: true };
  }

  async cancelFriendRequest(data: { userId: string; friendId: string }) {
    const existing = await this.FriendRepository.findOne({
      filter: {
        userId: data.userId,
        friendId: data.friendId,
        status: FriendStatus.PENDING,
      },
    });
    if (!existing) {
      throw new Error("No pending friend request found");
    }
    return this.FriendRepository.deleteOne({
      filter: { _id: existing._id },
    });
  }
}
