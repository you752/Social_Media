import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { postSchemaGQL } from "../post/gql/post.schema.gql";





const query = new GraphQLObjectType({
  name:"RootDirQuery",
  fields: {
      ...postSchemaGQL.registerQuery(),
  },
}) 

const mutation = new GraphQLObjectType({
  name: "RootDirMutation",
  fields: {
    ...postSchemaGQL.registerMutation,
  },
});




export const schema = new GraphQLSchema({query , mutation})