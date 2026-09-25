
class Resolver {
  constructor() {}

  hellowres(parent: any, args: any) {
    return `Hello, ${args.name || 'World'}! Your email is ${args.email || 'not provided'} and your password is ${args.password || 'not provided'}.`;
  }
}

const userResolver = new Resolver();

export default userResolver;