import { GraphQLString } from "graphql";
import { hellotype } from "./user.type.gql";
import { helloargs } from "./user.args.gql";
import userResolver from "./user.resolver.sql";


class user{
    constructor(){}
sigup(){
    return {
            name: 'RootQueryType',
            fields: {
              hello: {
                type: hellotype,
                resolve:userResolver.hellowres,
                args:helloargs
            }
          }
    }
}

}