const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");
const { friendModel } = require("../dist/database/model/friend.model.js");
const { userModel } = require("../dist/database/model/user.model.js");
const { DatabaseRepository } = require("../dist/common/reposatery/database.resposatery.js");
const { FriendRepository } = require("../dist/module/friend/friendRepo.js");
const authModule = require("../dist/common/middleware/auth/auth.js");

const fixtureUsers = [
  {
    _id: "normal-user",
    username: "Normal User",
    firstName: "Normal",
    lastName: "User",
    unique_name: "normal_user",
    profileImage: "https://example.com/avatar.jpg",
    email: "normal@example.com",
    role: 0,
    confirmEmail: true,
  },
  {
    _id: "admin-user",
    username: "Admin",
    firstName: "Admin",
    unique_name: "Admin_01",
    profileImage: "https://example.com/admin.jpg",
    email: "admin@example.com",
    role: 1,
    confirmEmail: true,
  },
  {
    _id: "unverified-user",
    username: "Unverified User",
    role: 0,
    confirmEmail: false,
  },
  {
    _id: "blocked-account",
    username: "Blocked Account",
    role: 0,
    confirmEmail: true,
    isBlocked: true,
  },
  {
    _id: "followed-user",
    username: "Followed User",
    role: 0,
    confirmEmail: true,
  },
  {
    _id: "blocked-user",
    username: "Blocked User",
    role: 0,
    confirmEmail: true,
  },
  {
    _id: "current-user",
    username: "Current User",
    role: 0,
    confirmEmail: true,
  },
];

async function applyUserFindMiddleware(filter, includeAdmin = false) {
  const query = userModel.find(filter);
  if (includeAdmin) query.setOptions({ includeAdmin: true });
  await userModel.schema.s.hooks.execPre("find", query, []);
  return query.getFilter();
}

function matchesFilter(user, filter) {
  if (filter.role?.$ne !== undefined && user.role === filter.role.$ne) return false;
  if (filter._id?.$nin?.includes(user._id)) return false;
  if (filter._id?.$in && !filter._id.$in.includes(user._id)) return false;
  if (filter.confirmEmail !== undefined && user.confirmEmail !== filter.confirmEmail) return false;
  if (filter.isBlocked?.$ne !== undefined && user.isBlocked === filter.isBlocked.$ne) return false;
  return true;
}

function projectUser(user, select) {
  const fields = new Set(select.split(/\s+/).filter(Boolean));
  return Object.fromEntries(
    Object.entries(user).filter(([field]) => fields.has(field)),
  );
}

async function closeServer(server) {
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()),
  );
}

test("suggestions, discover search, and friends list hide admin accounts", async () => {
  const originalAuth = authModule.auth;
  const originalFindAll = DatabaseRepository.prototype.findAll;
  const originalFriendFindAll = FriendRepository.prototype.findAll;
  const originalFriendFind = friendModel.find;
  const observedQueries = [];
  authModule.auth = () => (req, _res, next) => {
    req.user = { id: "current-user" };
    next();
  };
  friendModel.find = () => ({
    lean: async () => [
      { userId: "current-user", friendId: "blocked-user", status: "BLOCKED" },
      { userId: "followed-user", friendId: "current-user", status: "ACCEPTED" },
    ],
  });
  DatabaseRepository.prototype.findAll = async function ({ filter = {}, select = "" }) {
    const effectiveFilter = await applyUserFindMiddleware(filter);
    observedQueries.push(effectiveFilter);
    return fixtureUsers
      .filter((user) => matchesFilter(user, effectiveFilter))
      .map((user) => projectUser(user, select));
  };
  FriendRepository.prototype.findAll = async () => [
    { userId: "current-user", friendId: "normal-user", status: "ACCEPTED" },
    { userId: "current-user", friendId: "admin-user", status: "ACCEPTED" },
  ];

  let server;
  try {
    const { default: userRouter } = require("../dist/module/user/user.controller.js");
    const { default: friendRouter } = require("../dist/module/friend/friend.controller.js");
    const app = express();
    app.use("/user", userRouter);
    app.use("/friend", friendRouter);
    server = app.listen(0);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const [suggestionsResponse, searchResponse, friendsResponse] = await Promise.all([
      fetch(`${baseUrl}/user/suggestions`),
      fetch(`${baseUrl}/user/?discoverable=true`),
      fetch(`${baseUrl}/friend/getFriends`),
    ]);
    const [suggestions, search, friends] = await Promise.all([
      suggestionsResponse.json(),
      searchResponse.json(),
      friendsResponse.json(),
    ]);

    assert.equal(suggestionsResponse.status, 200);
    assert.equal(searchResponse.status, 200);
    assert.equal(friendsResponse.status, 200);
    assert.deepEqual(suggestions.data.map((user) => user._id), ["normal-user"]);
    assert.deepEqual(suggestions.data[0], {
      _id: "normal-user",
      name: "Normal User",
      username: "normal_user",
      avatar: "https://example.com/avatar.jpg",
    });
    assert.deepEqual(search.data.map((user) => user._id), ["normal-user"]);
    assert.deepEqual(friends.data.map((user) => user._id), ["normal-user"]);
    assert.ok(observedQueries.every((filter) => filter.role?.$ne === 1));
    const discoveryQueries = observedQueries.filter((filter) => filter.confirmEmail === true);
    assert.equal(discoveryQueries.length, 2);
    assert.ok(discoveryQueries.every((filter) => {
      const excludedIds = filter._id?.$nin ?? [];
      return ["current-user", "blocked-user", "followed-user"]
        .every((id) => excludedIds.includes(id));
    }));
  } finally {
    if (server) await closeServer(server);
    authModule.auth = originalAuth;
    DatabaseRepository.prototype.findAll = originalFindAll;
    FriendRepository.prototype.findAll = originalFriendFindAll;
    friendModel.find = originalFriendFind;
    delete require.cache[require.resolve("../dist/module/user/user.controller.js")];
    delete require.cache[require.resolve("../dist/module/friend/friend.controller.js")];
  }
});

test("user aggregations exclude admins by default and support explicit opt-out", async () => {
  assert.equal(userModel.schema.path("role").instance, "Number");
  const aggregate = userModel.aggregate([{ $sort: { _id: 1 } }]);
  await userModel.schema.s.hooks.execPre("aggregate", aggregate, []);
  assert.deepEqual(aggregate.pipeline()[0], { $match: { role: { $ne: 1 } } });

  const adminAggregate = userModel.aggregate([]);
  adminAggregate.option({ includeAdmin: true });
  await userModel.schema.s.hooks.execPre("aggregate", adminAggregate, []);
  assert.deepEqual(adminAggregate.pipeline(), []);
});

test("admin login and admin routes retain explicit access", async () => {
  const { userModel } = require("../dist/database/model/user.model.js");
  const hashModule = require("../dist/common/middleware/security/HashWord.js");
  const { TokenService } = authModule;
  const adminServiceModule = require("../dist/module/admin/admin.service.js");
  const previousFindOne = DatabaseRepository.prototype.findOne;
  const previousCompareWord = hashModule.compareWord;
  const previousGenerateToken = TokenService.generateToken;
  const previousIsRevoked = TokenService.isRevoked;
  const previousVerifyAccessToken = TokenService.verifyAccessToken;
  const previousFindById = userModel.findById;
  const previousDashboard = adminServiceModule.default.dashboard;
  let loginOptions;
  let authOptions;
  let verifiedRole;

  const adminUser = {
    _id: { toString: () => "admin-user" },
    id: "admin-user",
    email: "admin@example.com",
    username: "Admin",
    role: 1,
    password: "hashed-password",
    confirmEmail: true,
  };
  DatabaseRepository.prototype.findOne = async function (options) {
    loginOptions = options;
    return adminUser;
  };
  hashModule.compareWord = async () => true;
  TokenService.generateToken = async (_payload, role) => {
    assert.equal(role, 1);
    return { accessToken: "admin-access", refreshToken: "admin-refresh" };
  };
  TokenService.isRevoked = async () => false;
  TokenService.verifyAccessToken = async (_token, role) => {
    verifiedRole = role;
    return { id: "admin-user", email: adminUser.email };
  };
  userModel.findById = () => ({
    setOptions(options) {
      authOptions = options;
      return this;
    },
    select() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(adminUser).then(resolve, reject);
    },
  });
  adminServiceModule.default.dashboard = async () => ({ stats: {}, recentUsers: [] });

  let server;
  try {
    const { default: authRouter } = require("../dist/module/auth/auth.controller.js");
    const { default: adminRouter } = require("../dist/module/admin/admin.controller.js");
    const app = express();
    app.use(express.json());
    app.use("/auth", authRouter);
    app.use("/admin", adminRouter);
    server = app.listen(0);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", connection: "close" },
      body: JSON.stringify({ email: adminUser.email, password: "password123" }),
    });
    const loginBody = await loginResponse.json();
    const dashboardResponse = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { authorization: "Bearer admin-access", connection: "close" },
    });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginOptions.includeAdmin, true);
    assert.equal(loginBody.data.user.role, 1);
    assert.equal(dashboardResponse.status, 200);
    assert.equal(verifiedRole, 1);
    assert.equal(authOptions.includeAdmin, true);
  } finally {
    if (server) await closeServer(server);
    DatabaseRepository.prototype.findOne = previousFindOne;
    hashModule.compareWord = previousCompareWord;
    TokenService.generateToken = previousGenerateToken;
    TokenService.isRevoked = previousIsRevoked;
    TokenService.verifyAccessToken = previousVerifyAccessToken;
    userModel.findById = previousFindById;
    adminServiceModule.default.dashboard = previousDashboard;
  }
});

test("post, comment, and chat APIs return public user avatars", async () => {
  const authModule = require("../dist/common/middleware/auth/auth.js");
  const { PostService } = require("../dist/module/post/post.service.js");
  const { PostRepository } = require("../dist/module/post/postRepo.js");
  const { CommentService } = require("../dist/module/comment/comment.service.js");
  const { CommentRepository } = require("../dist/module/comment/commentRepo.js");
  const { ChatService } = require("../dist/module/chat/chat.service.js");
  const { ChatRepository } = require("../dist/module/chat/chatRepo.js");
  const { UserRepository } = require("../dist/module/user/userRepo.js");
  const { commentModel } = require("../dist/database/model/comment.model.js");
  const { likeModel, commentLikeModel } =
    require("../dist/database/model/like.model.js");
  const { shareModel } = require("../dist/database/model/share.model.js");
  const { bookmarkModel } = require("../dist/database/model/bookmark.model.js");
  const { userModel } = require("../dist/database/model/user.model.js");
  const ids = {
    viewer: "aaaaaaaaaaaaaaaaaaaaaaaa",
    author: "bbbbbbbbbbbbbbbbbbbbbbbb",
    post: "cccccccccccccccccccccccc",
    comment: "dddddddddddddddddddddddd",
  };
  const avatar = "https://res.cloudinary.com/wave/image/upload/profile.jpg";
  const users = [
    { _id: ids.viewer, username: "Viewer", profileImage: avatar },
    { _id: ids.author, username: "Post Author", profileImage: avatar },
  ];
  const previous = {
    auth: authModule.auth,
    postFindAll: PostRepository.prototype.findAll,
    commentFindAll: CommentRepository.prototype.findAll,
    chatFindAll: ChatRepository.prototype.findAll,
    userFindAll: UserRepository.prototype.findAll,
    userFind: userModel.find,
    commentAggregate: commentModel.aggregate,
    likeAggregate: likeModel.aggregate,
    commentLikeAggregate: commentLikeModel.aggregate,
    shareAggregate: shareModel.aggregate,
    likeFind: likeModel.find,
    bookmarkFind: bookmarkModel.find,
    commentLikeFind: commentLikeModel.find,
  };
  const emptyLean = () => ({ lean: async () => [] });

  authModule.auth = () => (req, _res, next) => {
    req.user = { id: ids.viewer };
    next();
  };
  PostRepository.prototype.findAll = async () => [{
    _id: ids.post,
    userId: ids.author,
    taggedUsers: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    content: "Post",
  }];
  CommentRepository.prototype.findAll = async () => [{
    _id: ids.comment,
    userId: ids.author,
    postId: ids.post,
    content: "Comment",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
  }];
  ChatRepository.prototype.findAll = async () => [{
    _id: "eeeeeeeeeeeeeeeeeeeeeeee",
    senderId: ids.author,
    recipientId: ids.viewer,
    content: "Message",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
  }];
  UserRepository.prototype.findAll = async () => users;
  userModel.find = () => ({
    select() { return this; },
    lean: async () => users,
  });
  commentModel.aggregate = async () => [];
  likeModel.aggregate = async () => [];
  commentLikeModel.aggregate = async () => [];
  shareModel.aggregate = async () => [];
  likeModel.find = emptyLean;
  bookmarkModel.find = emptyLean;
  commentLikeModel.find = emptyLean;

  let server;
  try {
    const { default: postRouter } = require("../dist/module/post/post.controller.js");
    const { default: commentRouter } = require("../dist/module/comment/comment.controller.js");
    const { default: chatRouter } = require("../dist/module/chat/chat.controller.js");
    const app = express();
    app.use("/post", postRouter);
    app.use("/comment", commentRouter);
    app.use("/chat", chatRouter);
    server = app.listen(0);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const [postsResponse, commentsResponse, chatResponse] = await Promise.all([
      fetch(`${baseUrl}/post/`),
      fetch(`${baseUrl}/comment/post/${ids.post}`),
      fetch(`${baseUrl}/chat/${ids.author}`),
    ]);
    const [posts, comments, chat] = await Promise.all([
      postsResponse.json(),
      commentsResponse.json(),
      chatResponse.json(),
    ]);

    assert.equal(postsResponse.status, 200);
    assert.equal(commentsResponse.status, 200);
    assert.equal(chatResponse.status, 200);
    assert.equal(posts.data[0].author.profileImage, avatar);
    assert.equal(comments.data[0].author.profileImage, avatar);
    assert.equal(chat.data[0].sender.profileImage, avatar);
    assert.equal(chat.data[0].recipient.profileImage, avatar);
  } finally {
    if (server) await closeServer(server);
    authModule.auth = previous.auth;
    PostRepository.prototype.findAll = previous.postFindAll;
    CommentRepository.prototype.findAll = previous.commentFindAll;
    ChatRepository.prototype.findAll = previous.chatFindAll;
    UserRepository.prototype.findAll = previous.userFindAll;
    userModel.find = previous.userFind;
    commentModel.aggregate = previous.commentAggregate;
    likeModel.aggregate = previous.likeAggregate;
    commentLikeModel.aggregate = previous.commentLikeAggregate;
    shareModel.aggregate = previous.shareAggregate;
    likeModel.find = previous.likeFind;
    bookmarkModel.find = previous.bookmarkFind;
    commentLikeModel.find = previous.commentLikeFind;
    for (const modulePath of [
      "../dist/module/post/post.controller.js",
      "../dist/module/comment/comment.controller.js",
      "../dist/module/chat/chat.controller.js",
    ]) {
      delete require.cache[require.resolve(modulePath)];
    }
  }
});
