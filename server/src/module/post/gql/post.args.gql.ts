import { GraphQLString, GraphQLList, GraphQLID } from "graphql";
export const PostListargs = {};

export const addPostArgs = {
  title: { type: GraphQLString },
  content: { type: GraphQLString },
  userId: { type: GraphQLID },
  comments: { type: new GraphQLList(GraphQLID) },
  likes: { type: new GraphQLList(GraphQLID) },
  tags: { type: new GraphQLList(GraphQLID) },
};