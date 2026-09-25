import { NotFoundException } from "../../common/exception/error.responce";
import { IPost } from "../../common/interfaces/post.interface";
import { PostRepository } from "./postRepo";
import { CreatePostInput, UpdatePostInput } from "./post.validation";
import { UserRepository } from "../user/userRepo";
import { publicImageUrl } from "../../common/utils/multer/multer";
import { deleteImage } from "../../common/service/cloudinary.service";
import { commentModel } from "../../database/model/comment.model";

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
    const post: IPost = {
      ...data,
      userId,
      title: "",
      comments: [],
      likes: [],
      tags: [],
      image: image ?? "",
    };

    const createdPost = await this.postRepository.create(post);
    return (await this.withAuthors([(createdPost as any).toObject()]))[0];
  }

  private async withCommentCounts(
    posts: Array<IPost & { _id?: string }>,
  ): Promise<Array<IPost & { _id?: string; commentsCount?: number }>> {
    if (!posts.length) {
      return posts as Array<IPost & { _id?: string; commentsCount?: number }>;
    }

    const postIds = posts
      .map((post) => String(post._id))
      .filter(Boolean);

    const counts = await commentModel.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countsByPostId = new Map(
      counts.map((item: { _id: string; count: number }) => [String(item._id), item.count]),
    );

    return posts.map((post) => ({
      ...post,
      commentsCount: countsByPostId.get(String(post._id)) ?? 0,
    }));
  }

  async getPosts() {
    const posts = await this.postRepository.findAll({ lean: true });
    const postsWithCounts = await this.withCommentCounts(posts);
    return this.withAuthors(postsWithCounts);
  }

  async getPostsGQL(){
        let posts = this.postRepository.findAll({ lean: true });
        return posts

  }
async creatPostGql(data :IPost){
      return this.postRepository.create(data);

}
  async getUserPosts(userId: string) {
    const posts = await this.postRepository.findAll({
      filter: { userId },
      lean: true,
    });
    const postsWithCounts = await this.withCommentCounts(posts);
    return this.withAuthors(postsWithCounts);
  }

  private async withAuthors(posts: Array<IPost & { _id?: string; commentsCount?: number }>) {
    const userIds = [...new Set(posts.map((post) => post.userId).filter(Boolean))];
    const users = await this.userRepository.findAll({
      filter: { _id: { $in: userIds } },
      select: "_id username firstName lastName profileImage",
      lean: true,
    });
    const usersById = new Map(users.map((user: any) => [String(user._id), user]));

    return posts.map((post) => {
      const authorObj = usersById.get(String(post.userId)) as any;
      return {
        ...post,
        image: publicImageUrl(post.image),
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

    const updateData = {
      ...data,
      ...(image ? { image } : {}),
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

    return (await this.withAuthors([post]))[0];
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

    return { deleted: true };
  }
  
}
