const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");
const { friendModel } = require("../dist/database/model/friend.model.js");
const { UserRepository } = require("../dist/module/user/userRepo.js");
const authModule = require("../dist/common/middleware/auth/auth.js");

test("suggestions endpoint excludes admin accounts and returns public fields only", async () => {
  const previousAuth = authModule.auth;
  const previousFindAll = UserRepository.prototype.findAll;
  const previousFriendFind = friendModel.find;
  let userQuery;

  authModule.auth = () => (req, _res, next) => {
    req.user = { id: "current-user" };
    next();
  };
  friendModel.find = () => ({
    lean: async () => [{
      userId: "current-user",
      friendId: "blocked-user",
      status: "BLOCKED",
    }],
  });
  UserRepository.prototype.findAll = async ({ filter, select }) => {
    userQuery = { filter, select };
    return [
      {
        _id: "normal-user",
        username: "Normal User",
        firstName: "Normal",
        lastName: "User",
        unique_name: "normal_user",
        profileImage: "https://example.com/avatar.jpg",
        role: 0,
        confirmEmail: true,
      },
      {
        _id: "admin-user",
        username: "Admin",
        firstName: "Admin",
        unique_name: "Admin_01",
        profileImage: "https://example.com/admin.jpg",
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
    ].filter((user) =>
      user._id !== "current-user" &&
      !filter._id.$nin.includes(user._id) &&
      user.role === filter.role &&
      user.confirmEmail === filter.confirmEmail &&
      user.isBlocked !== filter.isBlocked.$ne
    );
  };

  const { default: userRouter } = require("../dist/module/user/user.controller.js");
  const app = express();
  app.use("/user", userRouter);
  const server = app.listen(0);

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/user/suggestions`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(userQuery.filter._id.$nin, ["blocked-user", "current-user"]);
    assert.equal(userQuery.filter.role, 0);
    assert.equal(userQuery.filter.confirmEmail, true);
    assert.deepEqual(userQuery.filter.isBlocked, { $ne: true });
    assert.match(userQuery.select, /_id/);
    assert.doesNotMatch(userQuery.select, /email|role|password/i);
    assert.deepEqual(body.data, [{
      _id: "normal-user",
      name: "Normal User",
      username: "normal_user",
      avatar: "https://example.com/avatar.jpg",
    }]);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    authModule.auth = previousAuth;
    UserRepository.prototype.findAll = previousFindAll;
    friendModel.find = previousFriendFind;
    delete require.cache[require.resolve("../dist/module/user/user.controller.js")];
  }
});
