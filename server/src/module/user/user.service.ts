import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exception/error.responce";

import {
  hashWord,
  compareWord,
} from "../../common/middleware/security/HashWord";
import {
  decryptPhoneNumber,
  encryptPhoneNumber,
} from "../../common/middleware/security/phoneCrypto";
import { IUserUpdateData } from "../../common";
import { UserRepository } from "./userRepo";
import { publicImageUrl } from "../../common/utils/multer/multer";
import { deleteImage } from "../../common/service/cloudinary.service";
import { friendModel } from "../../database/model/friend.model";
import { FriendStatus } from "../../common/enum/friend.enum";
import { settingsModel } from "../../database/model/settings.model";
import { ISettings } from "../../common/interfaces/settings.interface";
import { PostService } from "../post/post.service";

interface UserDirectoryRecord {
  _id: string | { toString(): string };
  username?: string;
  firstName?: string;
  lastName?: string;
  unique_name?: string;
  profileImage?: string;
  email?: string;
  [key: string]: unknown;
}

class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getData(user_id: string) {
    const userData = await this.userRepository.findById({
      id: user_id,
    });

    if (!userData) {
      throw new NotFoundException("User not found");
    }

    const obj = userData.toObject();
    delete obj.password;
    delete obj.passwordChangedAt;
    return {
      ...obj,
      uniqueName: obj.unique_name,
      phoneNumber: obj.phoneNumber
        ? await decryptPhoneNumber(obj.phoneNumber)
        : obj.phoneNumber,
      profileImage: publicImageUrl(obj.profileImage),
      cover: obj.cover ?? "",
    };
  }

  async getProfile(user_id: string, currentUserId: string) {
    const userData = await this.userRepository.findById({ id: user_id });
    if (!userData) throw new NotFoundException("User not found");

    const friendRecords = await friendModel.find({
      $or: [
        { userId: user_id, status: FriendStatus.ACCEPTED },
        { friendId: user_id, status: FriendStatus.ACCEPTED },
      ],
    }).select("userId friendId").lean();
    const friendsCount = new Set(friendRecords.map((friend) =>
      String(friend.userId) === user_id ? String(friend.friendId) : String(friend.userId)
    )).size;
    const posts = await new PostService().getUserPosts(user_id, currentUserId);

    const obj = userData.toObject();
    const profile = {
      _id: obj._id,
      username: obj.username,
      uniqueName: obj.unique_name,
      firstName: obj.firstName,
      lastName: obj.lastName,
      profileImage: publicImageUrl(obj.profileImage),
      cover: obj.cover ?? "",
      bio: obj.bio,
      createdAt: obj.createdAt,
      friendsCount,
      postsCount: posts.length,
      posts: posts,
    };
    if (user_id !== currentUserId) return profile;
    return {
      ...profile,
      email: obj.email,
      gender: obj.gender,
      phoneNumber: obj.phoneNumber
        ? await decryptPhoneNumber(obj.phoneNumber)
        : obj.phoneNumber,
    };
  }

  async getProfileByUsername(username: string, currentUserId: string) {
    const userData = await this.userRepository.findOne({
      filter: { $or: [{ unique_name: username }, { username }] },
      select: "_id",
    });
    if (!userData) throw new NotFoundException("User not found");
    return this.getProfile(String(userData._id), currentUserId);
  }

  async getSuggestions(userId: string, limit: number) {
    const users = await this.getUsers(userId, true);
    return users.slice(0, limit);
  }

  async updateCover(user_id: string, cover: string) {
    const user = await this.userRepository.findByIdAndUpdate({
      id: user_id,
      data: { cover },
    });
    if (!user) throw new NotFoundException("User not found");
    return { cover: user.cover ?? "" };
  }

  async getSettings(user_id: string) {
    let settings = await settingsModel.findOne({ userId: user_id });
    if (!settings) {
      settings = await settingsModel.create({ userId: user_id });
    }
    return settings;
  }

  async updateSettings(
    user_id: string,
    data: Partial<Pick<ISettings, "notifications" | "privateAccount">>,
  ) {
    const settings = await settingsModel.findOneAndUpdate(
      { userId: user_id },
      { $set: data },
      { new: true, upsert: true }
    );
    return settings;
  }

  async getUsers(userId: string, discoverableOnly = false) {
    const relationships = await friendModel.find(
      { $or: [{ userId }, { friendId: userId }] },
      "userId friendId status",
    ).lean();

    const friendshipStatuses = new Map<string, "friends" | "blocked" | "pending-sent" | "pending-received">();
    for (const relationship of relationships) {
      const senderId = String(relationship.userId);
      const receiverId = String(relationship.friendId);
      const otherUserId = senderId === userId ? receiverId : senderId;
      const status = String(relationship.status).toUpperCase();

      if (status === FriendStatus.ACCEPTED) {
        friendshipStatuses.set(otherUserId, "friends");
      } else if (status === FriendStatus.BLOCKED) {
        friendshipStatuses.set(otherUserId, "blocked");
      } else if (
        status === FriendStatus.PENDING &&
        friendshipStatuses.get(otherUserId) !== "friends" &&
        friendshipStatuses.get(otherUserId) !== "blocked"
      ) {
        const nextStatus = senderId === userId ? "pending-sent" : "pending-received";
        const currentStatus = friendshipStatuses.get(otherUserId);
        if (currentStatus !== "pending-received" || nextStatus === "pending-received") {
          friendshipStatuses.set(otherUserId, nextStatus);
        }
      }
    }

    const excludedUserIds = [...friendshipStatuses.keys()];
    const excludedIds = discoverableOnly ? [...excludedUserIds, userId] : [userId];
    const userFilter: { _id: { $nin: string[] } } = { _id: { $nin: excludedIds } };

    const users: UserDirectoryRecord[] = await this.userRepository.findAll({
      filter: userFilter,
      select: discoverableOnly
        ? "_id username firstName lastName unique_name profileImage"
        : "_id username firstName lastName email unique_name profileImage",
      lean: true,
    });

    const uniqueUsers = new Map<string, UserDirectoryRecord>();
    for (const user of users) {
      const id = String(user._id);
      if (id !== userId && !uniqueUsers.has(id)) uniqueUsers.set(id, user);
    }

    return [...uniqueUsers.values()].map((user) => ({
      ...user,
      uniqueName: user.unique_name,
      profileImage: publicImageUrl(user.profileImage),
      friendshipStatus: friendshipStatuses.get(String(user._id)) ?? "none",
    }));
  }

  async updateData(
    user_id: string,
    data: IUserUpdateData & { unique_name?: string },
    uploadedProfileImage?: string,
  ) {
    const {
      password,
      newPassword,
      phone,
      phoneNumber,
      name,
      username,
      uniqueName,
      unique_name,
      profileImage,
      bio,
      age,
      gender,
    } = data;

    const userData = await this.userRepository.findById({
      id: user_id,
    });

    if (!userData) {
      throw new NotFoundException("User not found");
    }

    const updatedFields: Record<string, unknown> = {};

    if (name || username) {
      const newUsername = name || username;
      updatedFields.username = newUsername;
      const [first, ...rest] = (newUsername || "").trim().split(/\s+/);
      updatedFields.firstName = first || "";
      updatedFields.lastName = rest.join(" ");
    }

    const targetUniqueName = unique_name || uniqueName;

    if (targetUniqueName) {
      const uniqueNameExist = await this.userRepository.findOne({
        filter: {
          unique_name: targetUniqueName,
          _id: { $ne: user_id },
        },
      });

      if (uniqueNameExist) {
        throw new ConflictException("Unique name already taken");
      }

      updatedFields.unique_name = targetUniqueName;
    }

    if (phone || phoneNumber) {
      const updatedPhone = phone || phoneNumber;
      if (updatedPhone) {
        updatedFields.phoneNumber = await encryptPhoneNumber(updatedPhone);
      }

    }

    if (bio !== undefined) {
      if (bio.length > 500) throw new BadRequestException("Bio must be 500 characters or fewer");
      updatedFields.bio = bio;
    }
    if (age !== undefined && age !== "") {
      const numericAge = Number(age);
      if (!Number.isFinite(numericAge) || numericAge < 0) {
        throw new BadRequestException("Age must be a valid non-negative number");
      }
      updatedFields.age = numericAge;
    }
    if (gender !== undefined) updatedFields.gender = gender;

    if (password && newPassword) {
      if (!userData.password) {
        throw new ConflictException("User does not have a password");
      }

      const isMatch = await compareWord(password, userData.password);

      if (!isMatch) {
        throw new ConflictException("Current password is incorrect");
      }

      updatedFields.password = await hashWord(newPassword);
    }

    if (uploadedProfileImage) {
      updatedFields.profileImage = uploadedProfileImage;
    } else if (profileImage) {
      updatedFields.profileImage = profileImage;
    }

    const updatedUser = await this.userRepository.findByIdAndUpdate({
      id: user_id,
      data: updatedFields,
    });

    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    const nextProfileImage = uploadedProfileImage || (profileImage as string | undefined);
    if (nextProfileImage && userData.profileImage !== nextProfileImage) {
      await deleteImage(userData.profileImage);
    }

    const obj = typeof updatedUser.toObject === "function" ? updatedUser.toObject() : updatedUser;
    delete obj.password;
    delete obj.passwordChangedAt;
    return {
      ...obj,
      uniqueName: obj.unique_name,
      phoneNumber: obj.phoneNumber
        ? await decryptPhoneNumber(obj.phoneNumber)
        : obj.phoneNumber,
      profileImage: publicImageUrl(obj.profileImage),
    };
  }

  async deleteUser({ user_id }: { user_id: string }) {
    const userData = await this.userRepository.findById({
      id: user_id,
    });
    if (!userData) {
      throw new NotFoundException("User not found");
    }
    const deletedUser = await this.userRepository.findByIdAndDelete(user_id);

    if (!deletedUser) {
      throw new NotFoundException("User not found");
    }
    return deletedUser;
  }
}
export default new UserService();
