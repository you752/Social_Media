import { PostService } from "../post.service";
import { TokenService } from "../../../common/middleware/auth/auth";
import { userModel } from "../../../database/model/user.model";

class PostResolver {
  private postservice: PostService;

  constructor() {
    this.postservice = new PostService();
  }

  private async authenticate(context: any) {
    const authorization = context.req.headers.authorization;

    if (!authorization) throw new Error("Authorization header is required");

    const [bearer, token] = authorization.split(" ");

    if (bearer !== "Bearer" || !token) {
      throw new Error("Invalid authorization format");
    }

    if (await TokenService.isRevoked(token)) {
      throw new Error("Token has been revoked");
    }

    const decoded = await TokenService.verifyAccessToken(token);

    const user = await userModel.findById(decoded.id);
    if (!user) throw new Error("User not found");

    return user;
  }

  PostList = async (parent: any, args: any, context: any) => {
    await this.authenticate(context);
    return this.postservice.getPostsGQL();
  };

  createPost = async (parent: any, args: any, context: any) => {
    const user = await this.authenticate(context);
    return this.postservice.creatPostGql({ ...args, userId: user._id });
  };
}

const postResolver = new PostResolver();

export default postResolver;
