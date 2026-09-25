import { BadRequestException, NotFoundException } from "../../common/exception/error.responce";
import { IPost } from "../../common/interfaces/post.interface";
import { PostRepository } from "./postRepo";
import { CreatePostInput, UpdatePostInput } from "./post.validation";
import { UserRepository } from "../user/userRepo";
import { publicImageUrl } from "../../common/utils/multer/multer";
import { deleteImage } from "../../common/service/cloudinary.service";
import { commentModel } from "../../database/model/comment.model";
import { likeModel } from "../../database/model/like.model";
import { shareModel } from "../../database/model/share.model";
import { bookmarkModel } from "../../database/model/bookmark.model";
import { userModel } from "../../database/model/user.model";

export class PostService {
  private readonly postRepository: PostRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    this.postRepository = new PostRepository();
    this.userRepository = new UserRepository();
  }

  async createPost(
    data: CreatePostInput,
    userId: string,
    image?: string,
  ) {
    let validTaggedUsers: string[] = [];
    if (data.taggedUsers && Array.isArray(data.taggedUsers)) {
      const requestedTaggedUsers = [...new Set(data.taggedUsers)];
      const users = await userModel.find({ _id: { $in: requestedTaggedUsers } }).select('_id');
      validTaggedUsers = users.map(u => String(u._id));
      if (validTaggedUsers.length !== requestedTaggedUsers.length) {
        throw new BadRequestException("One or more tagged users do not exist");
      }
    }

    const post: IPost = {
      ...data,
      userId,
      title: "",
      comments: [],
      likes: [],
      tags: [],
      taggedUsers: validTaggedUsers,
      image: image ?? "",
    };

    const createdPost = await this.postRepository.create(post);
    return (await this.withPostRelations([(createdPost as any).toObject()], userId))[0];
  }

  async getPosts(currentUserId: string) {
    const posts = await this.postRepository.findAll({ lean: true });
    return this.withPostRelations(posts, currentUserId);
  }

  async getPostsGQL() {
    let posts = this.postRepository.findAll({ lean: true });
    return posts;
  }
  
  async creatPostGql(data: IPost) {
    return this.postRepository.create(data);
  }

  async getUserPosts(userId: string, currentUserId: string) {
    const posts = await this.postRepository.findAll({
      filter: { userId },
      lean: true,
    });
    return this.withPostRelations(posts, currentUserId);
  }

  private async withPostRelations(
    posts: Array<any>,
    currentUserId: string
  ) {
    if (!posts.length) return posts;

    const postIds = posts.map((post) => String(post._id)).filter(Boolean);

    // Get Comments counts
    const commentCounts = await commentModel.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const commentsByPostId = new Map(commentCounts.map((item: any) => [String(item._id), item.count]));

    // Get Likes counts and user liked status
    const likeCounts = await likeModel.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const likesByPostId = new Map(likeCounts.map((item: any) => [String(item._id), item.count]));

    const userLikes = await likeModel.find({ postId: { $in: postIds }, userId: currentUserId }).lean();
    const userLikesSet = new Set(userLikes.map(l => String(l.postId)));

    // Get Shares counts
    const shareCounts = await shareModel.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const sharesByPostId = new Map(shareCounts.map((item: any) => [String(item._id), item.count]));

    // Get Bookmarks for current user
    const userBookmarks = await bookmarkModel.find({ postId: { $in: postIds }, userId: currentUserId }).lean();
    const userBookmarksSet = new Set(userBookmarks.map(b => String(b.postId)));

    // Collect all user IDs needed (authors + taggedUsers)
    const userIds = new Set<string>();
    posts.forEach(post => {
      if (post.userId) userIds.add(String(post.userId));
      if (post.taggedUsers) {
        post.taggedUsers.forEach((id: string) => userIds.add(id));
      }
    });

    const users = await this.userRepository.findAll({
      filter: { _id: { $in: Array.from(userIds) } },
      select: "_id username firstName lastName profileImage",
      lean: true,
    });
    const usersById = new Map(users.map((user: any) => [String(user._id), user]));

    return posts.map((post) => {
      const authorObj = usersById.get(String(post.userId)) as any;
      const populatedTaggedUsers = (post.taggedUsers || []).map((id: string) => {
        const u = usersById.get(id) as any;
        return u ? { ...u, profileImage: publicImageUrl(u.profileImage) } : { _id: id };
      });

      return {
        ...post,
        image: publicImageUrl(post.image),
        commentsCount: commentsByPostId.get(String(post._id)) ?? 0,
        likesCount: likesByPostId.get(String(post._id)) ?? 0,
        liked: userLikesSet.has(String(post._id)),
        sharesCount: sharesByPostId.get(String(post._id)) ?? 0,
        bookmarked: userBookmarksSet.has(String(post._id)),
        taggedUsers: populatedTaggedUsers,
        author: authorObj
          ? {
              ...authorObj,
              profileImage: publicImageUrl(authorObj.profileImage),
            }
          : { _id: post.userId },
      };
    });
  }

  async updatePost(
    postId: string,
    data: UpdatePostInput,
    userId: string,
    image?: string,
  ) {
    const existingPost = await this.postRepository.findOne({
      filter: { _id: postId, userId },
      lean: true,
    });
    if (!existingPost) {
      throw new NotFoundException("Post not found");
    }

    let validTaggedUsers: string[] | undefined = undefined;
    if (data.taggedUsers && Array.isArray(data.taggedUsers)) {
      const requestedTaggedUsers = [...new Set(data.taggedUsers)];
      const users = await userModel.find({ _id: { $in: requestedTaggedUsers } }).select('_id');
      validTaggedUsers = users.map(u => String(u._id));
      if (validTaggedUsers.length !== requestedTaggedUsers.length) {
        throw new BadRequestException("One or more tagged users do not exist");
      }
    }

    const updateData = {
      ...data,
      ...(image ? { image } : {}),
      ...(validTaggedUsers !== undefined ? { taggedUsers: validTaggedUsers } : {}),
    };
    const post = await this.postRepository.findOneAndUpdate({
      filter: { _id: postId, userId },
      data: updateData,
      lean: true,
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (image && existingPost.image !== image) {
      await deleteImage(existingPost.image);
    }

    return (await this.withPostRelations([post], userId))[0];
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      filter: { _id: postId, userId },
      lean: true,
    });
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const result = await this.postRepository.deleteOne({
      _id: postId,
      userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException("Post not found");
    }

    await deleteImage(post.image);
    await likeModel.deleteMany({ postId });
    await commentModel.deleteMany({ postId });
    await shareModel.deleteMany({ postId });
    await bookmarkModel.deleteMany({ postId });

    return { deleted: true };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ filter: { _id: postId } });
    if (!post) throw new NotFoundException("Post not found");

    await likeModel.updateOne(
      { postId, userId },
      { $setOnInsert: { postId, userId } },
      { upsert: true }
    );

    const likesCount = await likeModel.countDocuments({ postId });
    return { liked: true, likesCount };
  }

  async unlikePost(postId: string, userId: string) {
    await likeModel.deleteOne({ postId, userId });
    const likesCount = await likeModel.countDocuments({ postId });
    return { liked: false, likesCount };
  }

  async sharePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ filter: { _id: postId } });
    if (!post) throw new NotFoundException("Post not found");

    await shareModel.updateOne(
      { postId, userId },
      { $setOnInsert: { postId, userId } },
      { upsert: true },
    );
    const sharesCount = await shareModel.countDocuments({ postId });
    return { sharesCount };
  }

  async bookmarkPost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ filter: { _id: postId } });
    if (!post) throw new NotFoundException("Post not found");

    await bookmarkModel.updateOne(
      { postId, userId },
      { $setOnInsert: { postId, userId } },
      { upsert: true }
    );
    return { bookmarked: true };
  }

  async removeBookmark(postId: string, userId: string) {
    await bookmarkModel.deleteOne({ postId, userId });
    return { bookmarked: false };
  }

  async getBookmarks(userId: string) {
    const bookmarks = await bookmarkModel.find({ userId }).sort({ createdAt: -1 }).lean();
    const postIds = bookmarks.map(b => b.postId);
    const posts = await this.postRepository.findAll({ filter: { _id: { $in: postIds } }, lean: true });
    
    // Sort posts to match bookmark order
    const postsMap = new Map(posts.map((p: any) => [String(p._id), p]));
    const sortedPosts = postIds.map(id => postsMap.get(id)).filter(Boolean);

    return this.withPostRelations(sortedPosts, userId);
  }
}
