import { Router, Request } from "express";
import { UserRoleEnum } from "../../common";
import { auth, admin } from "../../common/middleware/auth/auth";
import { SuccessResponse } from "../../common/exception/success.responce";
import { catchAsync } from "../../common/utils/catchAsync";
import adminService from "./admin.service";

const router = Router();
router.use(auth(UserRoleEnum.ADMIN), admin);
const param = (req: Request, name: string) => {
  const value = req.params[name];
  if (typeof value !== "string") throw new Error(`Missing ${name}`);
  return value;
};
const ok = (message: string, action: (req: Request) => Promise<unknown>) =>
  catchAsync(async (req, res) =>
    SuccessResponse({ res, message, data: await action(req) }),
  );

router.get(
  "/dashboard",
  ok("Dashboard retrieved successfully", () => adminService.dashboard()),
);
router.get(
  "/users",
  ok("Users retrieved successfully", (req) =>
    adminService.users(req.query as Record<string, unknown>),
  ),
);
router.get(
  "/users/:id",
  ok("User retrieved successfully", (req) =>
    adminService.user(param(req, "id")),
  ),
);
router.patch(
  "/users/:id/block",
  ok("User blocked successfully", (req) =>
    adminService.setBlocked(param(req, "id"), true),
  ),
);
router.patch(
  "/users/:id/unblock",
  ok("User unblocked successfully", (req) =>
    adminService.setBlocked(param(req, "id"), false),
  ),
);
router.patch(
  "/users/:id/role",
  ok("User role updated successfully", (req) =>
    adminService.setRole(
      param(req, "id"),
      Number(req.body.role),
      req.body.confirmAdmin === true,
    ),
  ),
);
router.delete(
  "/users/:id",
  ok("User deleted successfully", (req) =>
    adminService.deleteUser(param(req, "id"), req.body.confirmAdmin === true),
  ),
);
router.delete(
  "/users/:id/delete",
  ok("User deleted successfully", (req) =>
    adminService.deleteUser(param(req, "id"), req.body.confirmAdmin === true),
  ),
);
router.get(
  "/posts",
  ok("Posts retrieved successfully", (req) =>
    adminService.posts(req.query as Record<string, unknown>),
  ),
);
router.get(
  "/posts/:id",
  ok("Post retrieved successfully", (req) =>
    adminService.post(param(req, "id")),
  ),
);
router.delete(
  "/posts/:id",
  ok("Post deleted successfully", (req) =>
    adminService.deletePost(param(req, "id")),
  ),
);
router.get(
  "/comments",
  ok("Comments retrieved successfully", (req) =>
    adminService.comments(req.query as Record<string, unknown>),
  ),
);
router.get(
  "/comments/:id",
  ok("Comment retrieved successfully", (req) =>
    adminService.comment(param(req, "id")),
  ),
);
router.delete(
  "/comments/:id",
  ok("Comment deleted successfully", (req) =>
    adminService.deleteComment(param(req, "id")),
  ),
);

export default router;
