import { GraphQLString } from "graphql";
export const helloargs = {
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString }
}