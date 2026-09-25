import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
} from "graphql";

import {
  GenderEnum,
  providerEnum,
  UserRoleEnum,
} from "../../../common/enum/user.enum";

export const hellotype = new GraphQLObjectType({
  name: "HelloType",
  fields: {
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  },
});

export const GenderEnumGQL = new GraphQLEnumType({
  name: "GenderEnumsGQL",
  values: {
    Male: { value: GenderEnum.MALE },
    Female: { value: GenderEnum.FEMALE },
  },
});

export const ProviderEnumGQL = new GraphQLEnumType({
  name: "ProviderEnumsGQL",
  values: {
    System: { value: providerEnum.SYSTEM },
    Google: { value: providerEnum.GOOGLE },
  },
});

export const RoleEnumGQL = new GraphQLEnumType({
  name: "RoleEnumsGQL",
  values: {
    User: { value: UserRoleEnum.USER },
    Admin: { value: UserRoleEnum.ADMIN },
  },
});

export const OneUserType = new GraphQLObjectType({
  name: "OneUserType",
  fields: {
    userName: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: new GraphQLNonNull(GraphQLString) },
    phone: { type: new GraphQLNonNull(GraphQLString) },
    profilePic: { type: new GraphQLList(GraphQLString) },
    password: { type: GraphQLString },
    confirmEmail: { type: GraphQLBoolean },
    gender: { type: GenderEnumGQL },
    provider: { type: ProviderEnumGQL },
    role: { type: RoleEnumGQL },
  },
});
