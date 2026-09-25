import mongoose from "mongoose";
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "../../common/exception/error.responce";
import { UserRoleEnum } from "../../common";
import { userModel } from "../../database/model/user.model";
import { postModel } from "../../database/model/post.model";
import { commentModel } from "../../database/model/comment.model";
import { deleteImage } from "../../common/service/cloudinary.service";

const userProjection = "-password -__v";
const toPage = (value: unknown, fallback: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ensureId = (id: string) => {
  if (!mongoose.isValidObjectId(id))
    throw new BadRequestException("Invalid id");
};

class AdminService {
  async dashboard() {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      recentUsers,
      recentPosts,
      recentComments,
    ] = await Promise.all([
      userModel.countDocuments(),
      postModel.countDocuments(),
      commentModel.countDocuments(),
      userModel.countDocuments({ isBlocked: { $ne: true } }),
      userModel.countDocuments({ isBlocked: true }),
      userModel.countDocuments({ confirmEmail: true }),
      userModel
        .find({}, userProjection)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      postModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      commentModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    return {
      stats: {
        totalUsers,
        totalPosts,
        totalComments,
        activeUsers,
        blockedUsers,
        verifiedUsers,
      },
      recentUsers,
      recentPosts,
      recentComments,
    };
  }

  async users(query: Record<string, unknown>) {
    const page = toPage(query.page, 1, 100000),
      limit = toPage(query.limit, 10, 100);
    const filter: Record<string, unknown> = {};
    if (typeof query.search === "string" && query.search.trim()) {
      const search = new RegExp(escapeRegex(query.search.trim()), "i");
      filter.$or = [
        { username: search },
        { email: search },
        { unique_name: search },
      ];
    }
    if (query.role !== undefined) {
      const role = Number(query.role);
      if (![UserRoleEnum.USER, UserRoleEnum.ADMIN].includes(role))
        throw new BadRequestException("Invalid role");
      filter.role = role;
    }
    for (const [key, field] of [
      ["verified", "confirmEmail"],
      ["blocked", "isBlocked"],
    ] as const) {
      if (query[key] !== undefined) {
        if (!["true", "false"].includes(String(query[key])))
          throw new BadRequestException(`Invalid ${key} filter`);
        filter[field] = String(query[key]) === "true";
      }
    }
    const [users, total] = await Promise.all([
      userModel
        .find(filter, userProjection)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      userModel.countDocuments(filter),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async user(id: string) {
    ensureId(id);
    const user = await userModel.findById(id, userProjection).lean();
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async setBlocked(id: string, blocked: boolean) {
    ensureId(id);
    const user = await userModel.findById(id);
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRoleEnum.ADMIN)
      throw new ForbiddenException("Admin accounts require a protected action");
    return userModel
      .findByIdAndUpdate(
        id,
        { isBlocked: blocked },
        { returnDocument: "after", projection: userProjection },
      )
      .lean();
  }

  async setRole(id: string, role: number, confirmAdmin: boolean) {
    ensureId(id);
    if (
      !confirmAdmin ||
      ![UserRoleEnum.USER, UserRoleEnum.ADMIN].includes(role)
    )
      throw new BadRequestException(
        "Explicit role-change confirmation is required",
      );
    const user = await userModel
      .findByIdAndUpdate(
        id,
        { role },
        { returnDocument: "after", projection: userProjection },
      )
      .lean();
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async deleteUser(id: string, confirmAdmin: boolean) {
    ensureId(id);
    const user = await userModel.findById(id);
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRoleEnum.ADMIN && !confirmAdmin)
      throw new ForbiddenException(
        "Explicit admin deletion confirmation is required",
      );
    await userModel.findByIdAndDelete(id);
    return { id };
  }

  async posts(query: Record<string, unknown>) {
    const page = toPage(query.page, 1, 100000),
      limit = toPage(query.limit, 10, 100);
    const filter =
      typeof query.search === "string" && query.search.trim()
        ? { content: new RegExp(escapeRegex(query.search.trim()), "i") }
        : {};
    const [posts, total] = await Promise.all([
      postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      postModel.countDocuments(filter),
    ]);
    const users = await userModel
      .find(
        {
          _id: {
            $in: posts
              .map((post) => post.userId)
              .filter(mongoose.isValidObjectId),
          },
        },
        userProjection,
      )
      .lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    return {
      posts: posts.map((post) => ({
        ...post,
        user: userMap.get(String(post.userId)),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async post(id: string) {
    ensureId(id);
    const post = await postModel.findById(id).lean();
    if (!post) throw new NotFoundException("Post not found");
    return {
      ...post,
      user: await userModel.findById(post.userId, userProjection).lean(),
    };
  }

  async deletePost(id: string) {
    ensureId(id);
    const post = await postModel.findByIdAndDelete(id);
    if (!post) throw new NotFoundException("Post not found");
    await deleteImage(post.image);
    return { id };
  }

  async comments(query: Record<string, unknown>) {
    const page = toPage(query.page, 1, 100000),
      limit = toPage(query.limit, 10, 100);
    const filter: Record<string, unknown> = {};
    if (typeof query.search === "string" && query.search.trim())
      filter.content = new RegExp(escapeRegex(query.search.trim()), "i");
    if (typeof query.postId === "string") {
      ensureId(query.postId);
      filter.postId = query.postId;
    }
    if (typeof query.userId === "string") {
      ensureId(query.userId);
      filter.userId = query.userId;
    }
    const [comments, total] = await Promise.all([
      commentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      commentModel.countDocuments(filter),
    ]);
    const [users, posts] = await Promise.all([
      userModel
        .find(
          {
            _id: {
              $in: comments
                .map((comment) => comment.userId)
                .filter(mongoose.isValidObjectId),
            },
          },
          userProjection,
        )
        .lean(),
      postModel
        .find(
          {
            _id: {
              $in: comments
                .map((comment) => comment.postId)
                .filter(mongoose.isValidObjectId),
            },
          },
          "content userId createdAt",
        )
        .lean(),
    ]);
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    const postMap = new Map(posts.map((post) => [String(post._id), post]));
    return {
      comments: comments.map((comment) => ({
        ...comment,
        user: userMap.get(comment.userId),
        post: postMap.get(comment.postId),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async comment(id: string) {
    ensureId(id);
    const comment = await commentModel.findById(id).lean();
    if (!comment) throw new NotFoundException("Comment not found");
    return {
      ...comment,
      user: await userModel.findById(comment.userId, userProjection).lean(),
      post: await postModel
        .findById(comment.postId, "content userId createdAt")
        .lean(),
    };
  }

  async deleteComment(id: string) {
    ensureId(id);
    const result = await commentModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException("Comment not found");
    return { id };
  }
}

export default new AdminService();
