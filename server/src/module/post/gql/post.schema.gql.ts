import { addPostArgs, PostListargs } from "./post.args.gql"
import postResolver from "./post.resolver.sql"
import { onePostTypes, PostListTypes, CreatePostTypes } from "./post.type.gql";




class postSchema {
  constructor() {}
  registerQuery() {
    return {
      postlist: {
        name: "PostListQuery",
        type: onePostTypes,
        resolve: postResolver.PostList,
        args: PostListargs,
      },
    };
  }
  registerMutation() {
    return {
      addpost: {
        name: "CreatePostMutation",
        type: CreatePostTypes,
        resolve: postResolver.createPost,
        args: addPostArgs,
      },
    };
  }
}


export const postSchemaGQL = new postSchema