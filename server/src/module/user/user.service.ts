import {
  ConflictException,
  NotFoundException,
} from "../../common/exception/error.responce";

import {
  hashWord,
  compareWord,
} from "../../common/middleware/security/HashWord";
import { EncryptWord } from "../../common/middleware/security/phoneCrypto";
import { IUserUpdateData } from "../../common";
import { UserRepository } from "./userRepo";
import { publicImageUrl } from "../../common/utils/multer/multer";
import { deleteImage } from "../../common/service/cloudinary.service";

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
    return {
      ...obj,
      profileImage: publicImageUrl(obj.profileImage),
    };
  }

  async getUsers(userId: string) {
    const users = await this.userRepository.findAll({
      filter: { _id: { $ne: userId } },
      select: "_id username firstName lastName email unique_name profileImage",
      lean: true,
    });

    return users.map((user: any) => ({
      ...user,
      profileImage: publicImageUrl(user.profileImage),
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
        updatedFields.phoneNumber = await EncryptWord(updatedPhone);
      }
    }

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
    return {
      ...obj,
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
