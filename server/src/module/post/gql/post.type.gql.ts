import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { OneUserType } from "../../user/gql/user.type.gql";
export const PostListTypes = new GraphQLObjectType({
  name: "PostListTypes",
  fields: {
   message:{ type:GraphQLString }
  },
});

export const CreatePostTypes = new GraphQLObjectType({
  name: "PostListTypes",
  fields: {
    message: { type: GraphQLString },
  },
});

export const onePostTypes = new GraphQLObjectType({
  name: "onePostTypes",
  fields: {
    userId: { type: GraphQLString },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    image: { type: GraphQLString },
    comments: { type: new GraphQLList(GraphQLString) },
    likes: { type: new GraphQLList(OneUserType) },
    tags: { type: new GraphQLList(OneUserType) },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
    restoredAt: { type: GraphQLString },
  },
});
