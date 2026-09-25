import mongoose from "mongoose";

import { IUser } from "../../common/interfaces/user.interface";
import { GenderEnum, providerEnum, UserRoleEnum } from "../../common/index";

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
    },

    firstName: {
      type: String,
    },

    lastName: {
      type: String,

    },

    unique_name: {
      type: String,
      unique: true,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === providerEnum.SYSTEM;
      },
    },

    age: {
      type: Number,
    },

    phoneNumber: {
      type: String,
    },

    profileImage: {
      type: String,
    },

    confirmEmail: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.MALE,
    },

    role: {
      type: Number,
      default: UserRoleEnum.USER,
    },

    provider: {
      type: Number,
      default: providerEnum.SYSTEM,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

userSchema.pre("validate", function () {
  if (this.username) {
    const [firstName, ...lastName] = this.username.trim().split(/\s+/);

    this.firstName = firstName ?? "";
    this.lastName = lastName.join(" ");
  }

});

export const userModel = mongoose.model<IUser>("User", userSchema);
